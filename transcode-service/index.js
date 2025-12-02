import express from "express";
import cors from "cors";
import KafkaConfig from "./kafka/kafka.js";
import s3ToS3 from "./hls/encoding.js";

const app = express();
app.use(cors());
app.use(express.json());

const kafkaconfig = new KafkaConfig();

const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS) || 1;//how many partitions to consume concurrently
const PROCESSING_TIMEOUT = parseInt(process.env.PROCESSING_TIMEOUT) || 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;

// Track active jobs with metadata
const activeJobs = new Map();

async function startConsumer() {
   // Ensure consumer is connected and subscribed before running
   await kafkaconfig.consumer.connect();
   await kafkaconfig.consumer.subscribe({ topic: "youtube", fromBeginning: false });

   await kafkaconfig.consumer.run({
      autoCommit: false, // Disable auto commit
      partitionsConsumedConcurrently: MAX_CONCURRENT_JOBS,

      // Use autoCommit: false for manual offset control if needed
      eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {

         let value;
         try {
            value = JSON.parse(message.value.toString());
         } catch (err) {
            console.error("Failed to parse message:", err);
            // Commit invalid messages to avoid reprocessing
            await kafkaconfig.consumer.commitOffsets([
               { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
            ]);
            return;
         }

         console.log(`[Partition ${partition}] Received:`, value);

         if (!value || !value.title || !value.id) {
            console.log("Invalid message - missing required fields");
            // Commit invalid messages
            await kafkaconfig.consumer.commitOffsets([
               { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
            ]);
            return;
         }

         const jobId = `${value.id}_${Date.now()}`;
         const jobInfo = {
            id: jobId,
            videoId: value.id,
            title: value.title,
            startTime: Date.now(),
            partition,
            offset: message.offset,
            topic
         };

         activeJobs.set(jobId, jobInfo);
         console.log(`[${jobId}] Started. Active jobs: ${activeJobs.size}`);

         try {
            // IMPORTANT: Await the processing to prevent offset commit before completion
            await processVideoWithTimeout(value, jobInfo, heartbeat);

            // Only commit offset after successful processing
            await kafkaconfig.consumer.commitOffsets([
               { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
            ]);
            console.log(`[${jobId}] Offset committed: ${message.offset}`);

         } catch (err) {
            console.error(`[${jobId}] Processing failed:`, err.message);
            // DO NOT commit - message will be redelivered on restart
            console.log(`[${jobId}] Offset NOT committed - will retry on restart`);
         } finally {
            activeJobs.delete(jobId);
            console.log(`[${jobId}] Removed from queue. Active: ${activeJobs.size}`);
         }
      }
   });
}

async function processVideoWithTimeout(value, jobInfo, heartbeat) {
   const controller = new AbortController();

   // After PROCESSING_TIMEOUT time abort the processing
   const timeoutId = setTimeout(() => {
      controller.abort();
   }, PROCESSING_TIMEOUT);

   // Send periodic heartbeats to avoid session timeout in Kafka
   const heartbeatInterval = setInterval(async () => {
      try {
         await heartbeat();
         console.log(`[${jobInfo.id}] Heartbeat sent`);
      } catch (err) {
         console.error(`[${jobInfo.id}] Heartbeat failed:`, err.message);
      }
   }, 5000);

   try {
      await processVideoWithRetry(value, jobInfo, controller.signal);
   } finally {
      clearTimeout(timeoutId);
      clearInterval(heartbeatInterval);
   }
}

async function processVideoWithRetry(value, jobInfo, signal, retryCount = 0) {
   try {
      // If timeout already fired (controller.abort()), this stops immediately.
      if (signal?.aborted) {
         throw new Error("Processing timeout");
      }

      console.log(`[${jobInfo.id}] Processing: ${value.title} (attempt ${retryCount + 1})`);
      await s3ToS3(value);

      const duration = ((Date.now() - jobInfo.startTime) / 1000).toFixed(2);
      console.log(`[${jobInfo.id}] ✓ Completed in ${duration}s`);
   } catch (err) {
      console.error(`[${jobInfo.id}] ✗ Error:`, err.message);

      // Retry logic
      //If:
      // you haven’t hit MAX_RETRIES yet AND
      // the timeout has NOT been triggered (!signal.aborted)
      //then:
      // wait a bit (setTimeout wrapped in a Promise)
      // delay increases with retry:
      // 1st retry: 1s
      // 2nd: 2s
      // 3rd: 3s … (simple linear backoff)
      // recursively call processVideoWithRetry with retryCount + 1.
      if (retryCount < MAX_RETRIES - 1 && !signal?.aborted) {
         console.log(`[${jobInfo.id}] Retrying (${retryCount + 2}/${MAX_RETRIES})`);
         await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
         return processVideoWithRetry(value, jobInfo, signal, retryCount + 1);
      }

      throw err;
   }
}

app.get("/health", (req, res) => {
   res.json({
      activeJobs: activeJobs.size,
      maxConcurrent: MAX_CONCURRENT_JOBS,
      uptime: process.uptime()
   });
});

app.get("/stats", (req, res) => {
   const jobs = Array.from(activeJobs.values()).map(job => ({
      id: job.id,
      videoId: job.videoId,
      title: job.title,
      duration: ((Date.now() - job.startTime) / 1000).toFixed(2) + "s",
      partition: job.partition
   }));

   res.json({
      activeJobs: jobs,
      count: activeJobs.size,
      capacity: MAX_CONCURRENT_JOBS,
      available: MAX_CONCURRENT_JOBS - activeJobs.size
   });
});


startConsumer().catch(err => {
   console.error("Failed to start consumer:", err);
   process.exit(1);
});

