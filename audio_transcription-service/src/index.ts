import express from 'express';
import KafkaConfig from "./kafka/kafka.ts"
import { ConsumeMessage, GetSubtitle } from './service/service.ts';
import { JobInfo, KafkaMessagePayload } from './types/index.ts';
import cors from "cors"
import dotenv from "dotenv";
import { processEachMessage } from './service/KafkaService.ts';

dotenv.config();

const port = process.env.PORT || 7070;

const app = express();
app.use(cors());
const kafkaConfig = new KafkaConfig();


const MAX_CONCURRENT_JOBS = parseInt(process.env.MAX_CONCURRENT_JOBS as string) || 1;//how many partitions to consume concurrently


// Track active jobs with metadata
const activeJobs = new Map<string, JobInfo>();


async function startConsumer() {
    // Ensure consumer is connected and subscribed before running
    await kafkaConfig.consumer.connect();
    await kafkaConfig.consumer.subscribe({ topic: "youtube", fromBeginning: false });

    await kafkaConfig.consumer.run({
        autoCommit: false, // Disable auto commit
        partitionsConsumedConcurrently: MAX_CONCURRENT_JOBS,

        // Use autoCommit: false for manual offset control if needed
        eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
            await processEachMessage({ activeJobs, topic, partition, message, heartbeat, pause });
        }
    });
}


app.get('/get-subtitle/:id', async (req, res) => {
    const { id } = req.params;
    const subtitleBuffer = await GetSubtitle(id);
    res.setHeader("Content-Type", "text/vtt; charset=utf-8");
    res.setHeader("Content-Disposition", "inline"); // it is to display the file directly in the browser instead of downloading it.

    return res.send(subtitleBuffer);
})

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});


startConsumer().catch(err => {
    console.error("Failed to start consumer:", err);
    process.exit(1);
});