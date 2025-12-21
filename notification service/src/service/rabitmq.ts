import { EmailNotificationWithRetry } from './EmailNotification.ts';
import { NotificationMessage } from "@/types/index.ts";
import { rabbitMQ } from '@/client/rabbitmq.ts';
import CircuitBreaker from '@/service/circuitBreaker.ts';


const breaker = new CircuitBreaker();

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
        try {
            // If circuit breaker is OPEN, reject processing
            if (!breaker.canExecute()) {
                throw new Error("Circuit breaker OPEN");
            }
            console.log(`Received: ${msg.content.toString()}`);
            const msgContent = JSON.parse(msg.content.toString()) as NotificationMessage;

            const result = await EmailNotificationWithRetry(msgContent);
            console.log('email notification result:', result);
            const { success, attempts } = result;

            // If success, ACK the message
            if (success) {
                channel.ack(msg);
                breaker.recordSuccess();
                console.log("Email sent successfully, message acknowledged.");
                return;
            }
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
                breaker.recordFailure();
                return;
            }

            channel.ack(msg);

            if (breaker.getState() === "HALF_OPEN") {
                try {
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
                    breaker.recordSuccess();
                }
                catch (error) {
                    breaker.recordFailure();
                    console.error("Error re-queuing message in HALF_OPEN state:", error);
                }
            }
        }
        catch (error) {
            breaker.recordFailure();
            console.error("Error processing message:", error);
            channel.nack(msg, false, true); // requeue the message
            return;
        }
    }, { noAck: false });
}