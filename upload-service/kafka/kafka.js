import { Kafka, Partitioners } from "kafkajs";
import * as dotenv from "dotenv";
dotenv.config();

class KafkaConfig {
    constructor() {
        this.kafka = new Kafka({
            clientId: "upload-service",
            brokers: ["localhost:9092"],
        });
        // Use LegacyPartitioner(RoundRobin),otherwise it uses DefaultPartitioner(Sticky Partitioning) 
        this.producer = this.kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner, });
        this.consumer = this.kafka.consumer({ groupId: "youtube-uploader" });
        this.isProducerConnected = false;
        this.isConsumerConnected = false;
    }

    async connectProducer() {
        if (!this.isProducerConnected) {
            await this.producer.connect();
            this.isProducerConnected = true;
            console.log("Upload producer connected");
        }
    }

    async connectConsumer() {
        if (!this.isConsumerConnected) {
            await this.consumer.connect();
            this.isConsumerConnected = true;
            console.log("Upload consumer connected");
        }
    }

    async produce(topic, messages) {
        try {
            await this.connectProducer();
            const result = await this.producer.send({ topic, messages });
            console.log("Upload produce result:", result);
        } catch (error) {
            console.error("Upload produce error:", error);
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
            console.error("Upload consume error:", error);
        }
    }
}

export default KafkaConfig;
