import amqp, { Connection, Channel } from "amqplib";

class RabbitMQ {
    private static instance: RabbitMQ;
    private connection!: amqp.ChannelModel;
    private channel!: Channel;
    public consumerTag?: string; // to store consumer tag

    private constructor() { }

    static getInstance() {
        if (!RabbitMQ.instance) {
            RabbitMQ.instance = new RabbitMQ();
        }
        return RabbitMQ.instance;
    }

    async connect(url = "amqp://localhost") {
        if (this.connection && this.channel) return;

        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        console.log("RabbitMQ connected");
    }

    getChannel(): Channel {
        if (!this.channel) {
            throw new Error("RabbitMQ not connected");
        }
        return this.channel;
    }

    async stopConsumer() {
        if (!this.consumerTag) return;

        await this.channel.cancel(this.consumerTag);
        this.consumerTag = undefined;

        console.log("Consumer stopped");
    }

    close() {
        return this.connection.close();
    }
}

export const rabbitMQ = RabbitMQ.getInstance();
