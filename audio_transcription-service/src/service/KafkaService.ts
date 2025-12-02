import { EachMessageKafkaPayload, JobInfo, KafkaMessagePayload } from "@/types/index.ts";
import KafkaConfig from "../kafka/kafka.ts"
import { KafkaMessage } from "kafkajs";
import dotenv from "dotenv";
import { ConsumeMessage } from "./service.ts";

dotenv.config();

const kafkaConfig = new KafkaConfig();


const PROCESSING_TIMEOUT = parseInt(process.env.PROCESSING_TIMEOUT as string) || 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES as string) || 3;

export async function processEachMessage({ activeJobs, topic, partition, message, heartbeat, pause }: EachMessageKafkaPayload) {
    if (message == null || message.value == null) {
        console.log("Received null message, skipping...");
        return;
    }
    let value;
    try {
        value = JSON.parse(message.value.toString());
    } catch (err) {
        console.error("Failed to parse message:", err);
        // Commit invalid messages to avoid reprocessing
        await kafkaConfig.consumer.commitOffsets([
            { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
        ]);
        return;
    }

    console.log(`[Partition ${partition}] Received:`, value);

    if (!value || !value.title || !value.id) {
        console.log("Invalid message - missing required fields");
        // Commit invalid messages
        await kafkaConfig.consumer.commitOffsets([
            { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
        ]);
        return;
    }

    const jobId = `${value.id}_${Date.now()}`;
    const jobInfo: JobInfo = {
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
        const messageValue = message.value ? JSON.parse(message.value.toString()) as KafkaMessagePayload : null;
        // IMPORTANT: Await the processing to prevent offset commit before completion
        if (!messageValue) {
            throw new Error("Message value is null");
        }
        await processAudioWithTimeout(messageValue, jobInfo, heartbeat);

        // Only commit offset after successful processing
        await kafkaConfig.consumer.commitOffsets([
            { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
        ]);
        console.log(`[${jobId}] Offset committed: ${message.offset}`);

    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(`[${jobId}] Processing failed:`, err.message);
        } else {
            console.error(`[${jobId}] Unknown error during processing:`, err);
        }
        // DO NOT commit - message will be redelivered on restart
        console.log(`[${jobId}] Offset NOT committed - will retry on restart`);
    } finally {
        activeJobs.delete(jobId);
        console.log(`[${jobId}] Removed from queue. Active: ${activeJobs.size}`);
    }
}



async function processAudioWithTimeout(messageValue: KafkaMessagePayload, jobInfo: JobInfo, heartbeat: () => Promise<void>) {
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
            if (err instanceof Error) {
                console.error(`[${jobInfo.id}] Heartbeat failed:`, err.message);
            } else {
                console.error(`[${jobInfo.id}] Heartbeat failed:`, err);
            }
        }
    }, 5000);

    try {
        await processAudioWithRetry(messageValue, jobInfo, controller.signal);
    } finally {
        clearTimeout(timeoutId);
        clearInterval(heartbeatInterval);
    }
}

async function processAudioWithRetry(messageValue: KafkaMessagePayload, jobInfo: JobInfo, signal: AbortSignal, retryCount = 0) {
    try {
        // If timeout already fired (controller.abort()), this stops immediately.
        if (signal?.aborted) {
            throw new Error("Processing timeout");
        }

        console.log(`[${jobInfo.id}] Processing: ${messageValue.title} (attempt ${retryCount + 1})`);
        if (messageValue) {
            await ConsumeMessage(messageValue);
        }

        const duration = ((Date.now() - jobInfo.startTime) / 1000).toFixed(2);
        console.log(`[${jobInfo.id}] Completed in ${duration}s`);
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error(`[${jobInfo.id}] Error:`, err.message);
        }
        console.error(`[${jobInfo.id}] Unknown error:`, err);
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
            return processAudioWithRetry(messageValue, jobInfo, signal, retryCount + 1);
        }

        throw err;
    }
}