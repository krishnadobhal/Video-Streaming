import { Consumer, Kafka, KafkaMessage, Producer } from "kafkajs"
import * as dotenv from "dotenv"


dotenv.config()


class KafkaConfig {
    kafka: Kafka
    producer: Producer
    consumer: Consumer
    private isProducerConnected = false;
    private isConsumerConnected = false;
    constructor() {
        this.kafka = new Kafka({
            clientId: 'audio-transcription-service',
            brokers: ['localhost:9092'],
        });

        this.producer = this.kafka.producer()
        this.consumer = this.kafka.consumer({ groupId: "audio-transcription" })
    }

    async produce(topic: string, messages: any[]) {
        try {
            await this.connectProducer();
            await this.producer.send({
                topic,
                messages,
            });
        } catch (error) {
            console.error("Error producing message:", error);
        }
    }

    async consume(topic: string, callback: (message: KafkaMessage) => Promise<void>) {
        try {
            await this.connectConsumer();

            await this.consumer.subscribe({
                topic,
                fromBeginning: false,
            });

            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    callback(message);
                },
            });
        } catch (error) {
            console.error("Error consuming messages:", error);
        }
    }

    private async connectProducer() {
        if (!this.isProducerConnected) {
            await this.producer.connect();
            this.isProducerConnected = true;
            console.log("Producer connected to Kafka");
        }
    }

    private async connectConsumer() {
        if (!this.isConsumerConnected) {
            await this.consumer.connect();
            this.isConsumerConnected = true;
            console.log("Consumer connected to Kafka");
        }
    }

}
export default KafkaConfig;