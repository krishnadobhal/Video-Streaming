import client from "./redis-client.js";

client.on('error', (err) => console.log('Redis Client Error', err));

await client.connect();
export async function setAndExpireKey(key, value, TTL) {
    await client.setEx(key, TTL, value);
}

export async function getKey(key) {
    const value = await client.get(key);
    return value;
}

export const day = 86400;
export const hour = 3600;