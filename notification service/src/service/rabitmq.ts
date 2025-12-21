import { EmailNotificationWithRetry } from './EmailNotification.ts';
import { NotificationMessage } from "@/types/index.ts";
import { rabbitMQ } from '@/client/rabbitmq.ts';

const BASE_DELAY_MS = 2000 // Exponential backoff multiplier

export async function sendMessage(queueMessage: NotificationMessage, queue: string) {
    const channel = rabbitMQ.getChannel();

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(queueMessage)), { persistent: true });
    console.log(`Sent: ${JSON.stringify(queueMessage)}`);
}


export async function startEmailConsumer() {
    const channel = rabbitMQ.getChannel();
    const queue = 'Email-Queue';
    channel.prefetch(1);

    console.log(`Waiting for messages in ${queue}...`);

    channel.consume(queue, async (msg) => {
        if (!msg) {
            console.error("Consumer cancelled by server");
            return;
        }
        console.log(`Received: ${msg.content.toString()}`);
        const msgContent = JSON.parse(msg.content.toString()) as NotificationMessage;

        const result = await EmailNotificationWithRetry(msgContent);
        const { success, attempts } = result;

        // If success, ACK the message
        if (success) {
            channel.ack(msg);
            return;
        }

        const delay = BASE_DELAY_MS * Math.pow(2, attempts);
        const nextRetry = attempts + 1;


        // If attempts exceed max retries, send to DLQ
        if (nextRetry > 3) {
            channel.sendToQueue(
                "Email-DLQ",
                Buffer.from(JSON.stringify({
                    ...msgContent,
                    failedAttempts: attempts,
                    lastError: new Date().toISOString()
                })),
                { persistent: true }
            );
            channel.ack(msg);
            return;
        }

        channel.ack(msg);
        console.log(`Retrying in ${delay} ms (attempt ${nextRetry})`);


        // Schedule retry with exponential backoff
        setTimeout(() => {
            channel.sendToQueue(
                queue,
                Buffer.from(
                    JSON.stringify({
                        ...msgContent,
                        retryCount: nextRetry
                    })
                ),
                { persistent: true }
            );
        }, delay);
    }, { noAck: false });
}