import AWS from "aws-sdk"
import * as dotenv from "dotenv"
dotenv.config()
import path from "path";
import { generateStreamToken } from "../middleware/utils.js"
import { getVideoMasterUrl } from "../service/watchService.js";


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
        Expires: 3600
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
        const id = req.params.id;
        console.log(id);
        const MasterUrl = await getVideoMasterUrl(id);
        const signedUrl = await generateSignedUrl(MasterUrl);
        console.log(id)
        console.log(signedUrl)
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

        const MasterUrl = await getVideoMasterUrl(id);
        console.log(MasterUrl);
        if (!MasterUrl) {
            return res.status(404).send("Video not found");
        }

        const key = MasterUrl;
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
        const MasterUrl = await getVideoMasterUrl(id);
        if (!MasterUrl) {
            return res.status(404).send("Video not found");
        }

        //example-> video.master = "hls/output/john/video1/video1_master.m3u8"

        const masterDir = path.posix.dirname(MasterUrl);
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
 */
export const getStreamToken = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify the video exists
        const MasterUrl = await getVideoMasterUrl(id);

        if (!MasterUrl) {
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