import AWS from "aws-sdk"
import * as dotenv from "dotenv"
dotenv.config()
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateSignedUrl(videoKey) {

    const s3 = new AWS.S3({
        endpoint: process.env.EndPoint,
        accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
        secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
        s3ForcePathStyle: true,
        signatureVersion: "v4"
    });

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
        console.log("hello");

        const videoKey = req.query.key; // Key of the video file in S3
        const key = await prisma.video_data.findUnique({
            where: {
                id: videoKey
            }
        })
        const signedUrl = await generateSignedUrl(key.master);
        console.log(videoKey)
        console.log(signedUrl)
        res.json({ signedUrl });
    } catch (err) {
        console.error('Error generating pre-signed URL:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default watchVideo;