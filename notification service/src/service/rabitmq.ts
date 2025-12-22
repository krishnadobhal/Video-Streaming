import { EmailNotificationWithRetry } from './EmailNotification.ts';
import { NotificationMessage } from "@/types/index.ts";
import { rabbitMQ } from '@/client/rabbitmq.ts';
import { circuitBreakerTest } from './CB.ts';



export async function sendMessage(queueMessage: NotificationMessage, queue: string) {
    const channel = rabbitMQ.getChannel();

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(queueMessage)), { persistent: true });
    console.log(`Sent: ${JSON.stringify(queueMessage)}`);
}


export async function startEmailConsumer() {
    const channel = rabbitMQ.getChannel();
    const queue = "Email-Queue";

    await channel.prefetch(1);
    console.log("Waiting for messages...");

    const res = await channel.consume(queue, async (msg) => {
        if (!msg) return;

        if (!circuitBreakerTest.canConsume()) {
            console.warn("Message received while Paused. Nacking without requeue locally (relying on Consumer Stop).");
            channel.nack(msg, false, true);
            return;
        }

        const payload = JSON.parse(msg.content.toString()) as NotificationMessage;

        // Calculate attempts based on payload
        const currentRetryCount = payload.retryCount;
        const attempts = currentRetryCount + 1;

        try {
            const result = await EmailNotificationWithRetry({
                ...payload,
                retryCount: currentRetryCount
            });

            if (result.success) {
                channel.ack(msg);
                circuitBreakerTest.recordSuccess();
                return;
            }


            // if we reached Max Retries (Dead Letter Strategy)
            if (result.attempts > circuitBreakerTest.MAX_RETRIES) {
                console.error(`Max retries reached for msg. Sending to DLQ.`);
                channel.sendToQueue(
                    "Email-DLQ",
                    Buffer.from(JSON.stringify(payload)),
                    { persistent: true }
                );
                channel.ack(msg);
                return;
            }

            // 2. System Backoff (Circuit Breaker Strategy)
            console.warn(`Failure detected. Triggering Circuit Breaker...`);


            // Send back to queue
            channel.sendToQueue(
                queue,
                Buffer.from(JSON.stringify(payload)),
                { persistent: true }
            );

            channel.ack(msg);

            // Trigger the pause
            circuitBreakerTest.recordFailure(
                () => rabbitMQ.stopConsumer(),
                () => startEmailConsumer()
            );

        } catch (err) {
            console.error("Unexpected Consumer Error", err);
            // Catch-all: Update count, republish, ack, pause.
            payload.retryCount = attempts;
            channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
            channel.ack(msg);

            circuitBreakerTest.recordFailure(
                () => rabbitMQ.stopConsumer(),
                () => startEmailConsumer()
            );
        }
    });

    rabbitMQ.consumerTag = res.consumerTag;
}