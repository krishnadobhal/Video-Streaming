import { PrismaClient } from '@prisma/client'
import { day, getKey, setAndExpireKey } from './redis.js';
import client from './redis-client.js';


const prisma = new PrismaClient()
client.on('error', (err) => console.log('Redis Client Error', err));


export async function getVideoMasterUrl(id) {
    let MasterUrl = await getKey(id);
    if (!MasterUrl) {
        const videoData = await prisma.video_data.findUnique({
            where: {
                id: id
            }
        })
        if (!videoData) {
            return res.status(404).json({ error: "Video not found" });
        }
        MasterUrl = videoData.master;
        await setAndExpireKey(id, MasterUrl, day);
    }
    else {
        console.log("Cache hit for video key:", id);
    }
    return MasterUrl;
}