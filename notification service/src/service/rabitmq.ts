import amqp from 'amqplib';
import { EmailNotificationWithRetry } from './EmailNotification.ts';

export async function sendMessage() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'task_queue';

    await channel.assertQueue(queue, { durable: true });
    const message = 'Hello, RabbitMQ!';

    channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
    console.log(`Sent: ${message}`);

    setTimeout(() => {
        connection.close();
        process.exit(0);
    }, 500);
}


async function receiveMessage() {
    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'task_queue';

    await channel.assertQueue(queue, { durable: true });
    console.log(`Waiting for messages in ${queue}...`);

    channel.consume(queue, async (msg) => {
        if (msg) {
            console.log(`Received: ${msg.content.toString()}`);

            const result = await EmailNotificationWithRetry();
            channel.ack(msg);
        }
    }, { noAck: false });
}