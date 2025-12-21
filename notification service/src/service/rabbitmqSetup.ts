import { rabbitMQ } from "../client/rabbitmq.ts";

export async function setupQueues() {
    const channel = rabbitMQ.getChannel();

    // Main queue
    await channel.assertQueue("Email-Queue", {
        durable: true
    });

    // Dead Letter Queue
    await channel.assertQueue("Email-DLQ", {
        durable: true
    });

    console.log("Queues ready");
}