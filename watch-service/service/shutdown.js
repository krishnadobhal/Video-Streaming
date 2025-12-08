import { esClient, redisClient } from "./client.js";

export const shutdown = (server) => {
    const graceful = async () => {
        console.log("Shutting down service...");

        try {
            await redisClient.quit();
            console.log("Redis disconnected.");
        } catch (err) {
            console.error("Redis shutdown error:", err);
        }
        try {
            await esClient.close();
            console.log('Elasticsearch client closed successfully.');
        } catch (error) {
            console.error('Error closing Elasticsearch client:', error);
        }

        server.close(() => {
            console.log("HTTP server closed.");
            process.exit(0);
        });
    };

    process.on("SIGINT", graceful);
    process.on("SIGTERM", graceful);
};