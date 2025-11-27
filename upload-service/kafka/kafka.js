import { Kafka } from "kafkajs"
import fs from "fs"
import path from "path"
import * as dotenv from "dotenv"


dotenv.config()


class KafkaConfig {
    constructor() {
        this.kafka = new Kafka({
            clientId: 'my-app',
            brokers: ['localhost:9092'],
        });

        this.producer = this.kafka.producer()
        this.consumer = this.kafka.consumer({ groupId: "youtube-uploader" })
    }

    async produce(topic, messages) {
        try {
            const result = await this.producer.connect()
            console.log("kafka connected... : ", result)
            await this.producer.send({
                topic: topic,
                messages: messages
            })
        } catch (error) {
            console.log(error)
        } finally {
            await this.producer.disconnect()
        }
    }

    async consume(topic, callback) {
        try {
            await this.consumer.subscribe({ topic: topic, fromBeginning: true })
            await this.consumer.run({
                eachMessage: async ({
                    topic, partition, message
                }) => {
                    const value = message.value.toString()
                    callback(value)
                }
            })
        } catch (error) {
            console.log(error)
        }
    }

    async connectConsumer() {
        await this.consumer.connect();
        console.log("Consumer connected to Kafka");
    }
}
export default KafkaConfig;