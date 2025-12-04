import client from "./redis-client.js";

export const shutdown = (server) => {
    const graceful = async () => {
        console.log("Shutting down service...");

        try {
            await client.quit();
            console.log("Redis disconnected.");
        } catch (err) {
            console.error("Redis shutdown error:", err);
        }

        server.close(() => {
            console.log("HTTP server closed.");
            process.exit(0);
        });
    };

    process.on("SIGINT", graceful);
    process.on("SIGTERM", graceful);
};