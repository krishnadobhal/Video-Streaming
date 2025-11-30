import { Kafka } from "kafkajs";
import * as dotenv from "dotenv";
dotenv.config();

class KafkaConfig {
    constructor() {
        this.kafka = new Kafka({
            clientId: "transcode-service",
            brokers: ["localhost:9092"],
        });

        this.producer = this.kafka.producer();
        this.consumer = this.kafka.consumer({ groupId: "transcode-service" });
        this.isProducerConnected = false;
        this.isConsumerConnected = false;
    }

    async connectProducer() {
        if (!this.isProducerConnected) {
            await this.producer.connect();
            this.isProducerConnected = true;
            console.log("Transcode producer connected");
        }
    }

    async connectConsumer() {
        if (!this.isConsumerConnected) {
            await this.consumer.connect();
            this.isConsumerConnected = true;
            console.log("Transcode consumer connected");
        }
    }

    async produce(topic, messages) {
        try {
            await this.connectProducer();
            await this.producer.send({ topic, messages });
        } catch (error) {
            console.error("Transcode produce error:", error);
        }
    }

    async consume(topic, callback) {
        try {
            await this.connectConsumer();
            await this.consumer.subscribe({ topic, fromBeginning: false });
            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    const value = message.value?.toString();
                    if (value !== undefined) callback(value);
                },
            });
        } catch (error) {
            console.error("Transcode consume error:", error);
        }
    }
}

export default KafkaConfig;
