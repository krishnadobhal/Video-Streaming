import express from 'express';
import KafkaConfig from "./kafka/kafka.ts"
import { ConsumeMessage, GetSubtitle } from './service/service.ts';
import { KafkaMessage } from './types/index.ts';
import cors from "cors"

const port = process.env.PORT || 7070;

const app = express();
app.use(cors());
const kafkaConfig = new KafkaConfig();



kafkaConfig.consume("audio", async (message) => {
    console.log("Received message:", message.value?.toString())
    const messageValue = message.value ? JSON.parse(message.value.toString()) as KafkaMessage : null;
    if (messageValue) {
        await ConsumeMessage(messageValue);
    }
});


app.get('/get-subtitle/:id', async (req, res) => {
    const { id } = req.params;
    const subtitleBuffer = await GetSubtitle(id);
    res.setHeader("Content-Type", "text/vtt; charset=utf-8");
    res.setHeader("Content-Disposition", "inline"); // make browser load directly

    return res.send(subtitleBuffer);
})

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});