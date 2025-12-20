import redis from 'redis';
import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
    node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

const redisClient = redis.createClient({ url: process.env.REDIS_URL });


async function connectClients() {
    await redisClient.connect();
    console.log('Redis connected');
}
export { redisClient, connectClients, esClient };