import { redisClient } from "./client.js";

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export async function setAndExpireKey(key, value, TTL) {
    await redisClient.setEx(key, TTL, value);
}

export async function getKey(key) {
    const value = await redisClient.get(key);
    return value;
}

export const day = 86400;
export const hour = 3600;