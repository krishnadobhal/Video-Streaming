import express from 'express';
import KafkaConfig from "./kafka/kafka.ts"
import { ConsumeMessage } from './service/service.ts';
import { KafkaMessage } from './types/index.ts';


const port = process.env.PORT || 7070;

const app = express();
const kafkaConfig = new KafkaConfig();



kafkaConfig.consume("youtube", async (message) => {
    console.log("Received message:", message.value?.toString())
    const messageValue = message.value ? JSON.parse(message.value.toString()) as KafkaMessage : null;
    if (messageValue) {
        await ConsumeMessage(messageValue);
    }
});


app.get('/', (req, res) => {
    res.send('Audio Transcription Service is running');
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});