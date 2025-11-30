import { KafkaMessage } from "@/types/index.ts";
import fs from "fs";
const bucketName = 'yt-krishna';
import AWS from "aws-sdk";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath("C:\\ProgramData\\chocolatey\\lib\\ffmpeg\\tools\\ffmpeg\\bin\\ffmpeg.exe");

const s3 = new AWS.S3({
    endpoint: process.env.EndPoint,
    accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
    s3ForcePathStyle: true,
    signatureVersion: "v4"
});

export async function ConsumeMessage(message: KafkaMessage) {
    console.log("Consuming message...");
    // const transcript = await whisper();
    const mp4FileName = message.title;
    console.log("bucketName", bucketName);
    console.log("mp4FileName", mp4FileName);
    const mp4FilePath = `${mp4FileName}`;
    console.log("file", mp4FilePath);
    const writeStream = fs.createWriteStream("local.mp4");
    const readStream = s3
        .getObject({ Bucket: bucketName, Key: mp4FilePath })
        .createReadStream();
    readStream.pipe(writeStream);
    await new Promise((resolve, reject) => {
        writeStream.on("finish", () => resolve(null));
        writeStream.on("error", reject);
    });
    const inputPath = path.join(__dirname, 'local.mp4');
    const outputPath = path.join(__dirname, 'output.mp3');
    console.log("Downloaded s3 mp4 file locally 2");
    ffmpeg(inputPath)
        .noVideo() // Extract only the audio stream
        .audioCodec('libmp3lame') // Specify MP3 audio codec
        .save(outputPath)
        .on('end', () => {
            console.log('Conversion finished successfully!');
        })
        .on('error', (err) => {
            console.error('Error during conversion:', err);
        });
}