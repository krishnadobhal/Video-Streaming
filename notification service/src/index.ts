import KafkaConfig from "@/client/kafka.ts";
import { setupQueues } from "@/service/rabbitmqSetup.ts";
import { sendMessage, startEmailConsumer } from "@/service/rabitmq.ts";
import { rabbitMQ } from "@/client/rabbitmq.ts"

const kafkaConfig = new KafkaConfig();

async function startConsumer() {
    // Ensure consumer is connected and subscribed before running
    await kafkaConfig.consumer.connect();
    await kafkaConfig.consumer.subscribe({ topic: "Notification", fromBeginning: false });

    await kafkaConfig.consumer.run({
        autoCommit: false, // Disable auto commit

        // Use autoCommit: false for manual offset control if needed
        eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
            await sendMessage(message.value ? JSON.parse(message.value.toString()) : {}, 'Email-Queue');

            // Manually commit the offset after processing
            await kafkaConfig.consumer.commitOffsets([
                { topic, partition, offset: (BigInt(message.offset) + 1n).toString() }
            ]);
        }
    });
}

async function start() {
    try {

        await rabbitMQ.connect();
        await setupQueues();
        await startEmailConsumer();
        await startConsumer();
    }
    catch (error) {
        console.error("Error in starting services:", error);
        cleanup();
    }
}

start().catch((error) => {
    console.error("Error starting the service:", error);
    process.exit(1);
});

async function cleanup() {
    try {
        await kafkaConfig.consumer.disconnect();
        await rabbitMQ.close();
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}