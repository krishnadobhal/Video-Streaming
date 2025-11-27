import AWS from "aws-sdk"
import * as dotenv from "dotenv"
dotenv.config()
import { PrismaClient } from '@prisma/client'
import axios from "axios"
import path from "path";
import { generateStreamToken } from "../middleware/auth.middleware.js";

const prisma = new PrismaClient()

const s3 = new AWS.S3({
    endpoint: process.env.EndPoint,
    accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
    s3ForcePathStyle: true,
    signatureVersion: "v4"
});

const BUCKET = process.env.AWS_BUCKET;

async function generateSignedUrl(videoKey) {


    const params = {
        Bucket: process.env.AWS_BUCKET,
        Key: videoKey,
        Expires: 3600 // URL expires in 1 hour, adjust as needed
    };

    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', params, (err, url) => {
            if (err) {
                reject(err);
            } else {
                resolve(url);
            }
        });
    });
}

const watchVideo = async (req, res) => {
    try {

        const videoKey = req.params.id; // Key of the video file in S3
        console.log(videoKey);
        const key = await prisma.video_data.findUnique({
            where: {
                id: videoKey
            }
        })
        const signedUrl = await generateSignedUrl(key.master);
        console.log(videoKey)
        console.log(signedUrl)
        const url = await axios.get(signedUrl)
        res.json({ url: signedUrl });
    } catch (err) {
        console.error('Error generating pre-signed URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export const streamMaster = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(id);

        const video = await prisma.video_data.findUnique({
            where: { id: id },
        });
        console.log(video);
        if (!video || !video.master) {
            return res.status(404).send("Video not found");
        }

        const key = video.master; // full S3 key to master.m3u8

        const s3Stream = s3
            .getObject({
                Bucket: BUCKET,
                Key: key,
            })
            .createReadStream();

        s3Stream.on("error", (err) => {
            console.error("Error streaming master.m3u8:", err);
            if (!res.headersSent) {
                res.status(500).send("Error streaming master playlist");
            }
        });

        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        s3Stream.pipe(res);
    } catch (err) {
        console.error("Error in streamMaster:", err);
        if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
        }
    }
};

export const streamAsset = async (req, res) => {
    try {
        // this was url example -> http://localhost:8082/watch/stream/cmihpvklw0001wedfrqkcobnr/OneBox_854x480_000.ts
        const { id, fileName } = req.params;
        //id -> cmihpvklw0001wedfrqkcobnr
        //fileName -> OneBox_854x480_000.ts
        const video = await prisma.video_data.findUnique({
            where: { id },
        });

        if (!video || !video.master) {
            return res.status(404).send("Video not found");
        }

        //example-> video.master = "hls/output/john/video1/video1_master.m3u8"

        const masterDir = path.posix.dirname(video.master);
        // after this it will be -> "hls/output/john/video1"

        //then we will be fetching the file hls/output/john/video1/OneBox_854x480_000.ts from s3
        const key = path.posix.join(masterDir, fileName);

        const s3Stream = s3
            .getObject({
                Bucket: BUCKET,
                Key: key,
            })
            .createReadStream();

        s3Stream.on("error", (err) => {
            console.error("Error streaming asset:", err);
            if (!res.headersSent) {
                res.status(500).send("Error streaming video asset");
            }
        });

        if (fileName.endsWith(".m3u8")) {
            res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        } else if (fileName.endsWith(".ts")) {
            res.setHeader("Content-Type", "video/mp2t");
        } else if (fileName.endsWith(".m4s")) {
            res.setHeader("Content-Type", "video/iso.segment");
        } else {
            res.setHeader("Content-Type", "application/octet-stream");
        }

        s3Stream.pipe(res);
    } catch (err) {
        console.error("Error in streamAsset:", err);
        if (!res.headersSent) {
            res.status(500).send("Internal Server Error");
        }
    }
};

/**
 * Generate a streaming token for a video.
 * This endpoint should be called by authenticated users to get a token
 * that can be used to access streaming endpoints.
 * 
 * NOTE: In production, this endpoint should be protected by session-based
 * authentication from your application (e.g., NextAuth session validation).
 * The current implementation validates the video exists before issuing a token.
 */
export const getStreamToken = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the video exists
        const video = await prisma.video_data.findUnique({
            where: { id },
        });

        if (!video) {
            return res.status(404).json({ error: "Video not found" });
        }

        // Generate a token with video ID and expiration
        const token = generateStreamToken({
            videoId: id,
            type: "stream"
        }, "1h"); // Token valid for 1 hour

        res.json({ token });
    } catch (err) {
        console.error("Error generating stream token:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export default watchVideo;