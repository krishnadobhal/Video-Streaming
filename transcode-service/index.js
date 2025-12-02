import express from "express";
import cors from "cors";
import KafkaConfig from "./kafka/kafka.js";
import s3ToS3 from "./hls/encoding.js";
import { processEachMessage } from "./service/kafkaservice.js";

const app = express();
app.use(cors());
app.use(express.json());

const kafkaconfig = new KafkaConfig();

const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS) || 1;//how many partitions to consume concurrently

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
         await processEachMessage({ activeJobs, topic, partition, message, heartbeat, pause });
      }
   });
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

