import { KafkaMessage } from "@/types/index.ts";
import fs from "fs";
const bucketName = 'yt-krishna';
import AWS from "aws-sdk";
import path from "path";
import { convertMp4ToMp3, transcribeWithWhisperCLI } from "@/utils/utils.ts";
import dotenv from "dotenv";
dotenv.config();

const s3 = new AWS.S3({
    endpoint: process.env.EndPoint,
    accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
    secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
    s3ForcePathStyle: true,
    signatureVersion: "v4"
});
const TranscribeS3 = new AWS.S3({
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
    const writeStream = fs.createWriteStream(`${mp4FileName}.mp4`);

    const localMp4 = path.join(process.cwd(), `${mp4FileName}.mp4`);
    const localMp3 = path.join(process.cwd(), `${mp4FileName}.mp3`);

    const readStream = s3
        .getObject({ Bucket: bucketName, Key: mp4FilePath })
        .createReadStream();
    await new Promise<void>((resolve, reject) => {
        readStream.on("error", reject);
        writeStream.on("error", reject);
        writeStream.on("finish", () => resolve());
        readStream.pipe(writeStream);
    });

    console.log("Downloaded mp4 locally");

    // 2) Convert to mp3
    await convertMp4ToMp3(localMp4, localMp3);

    // 3) Transcribe with Whisper CLI
    const transcript = await transcribeWithWhisperCLI(localMp3);
    await TranscribeS3.upload({
        Bucket: "transcribe-krishna",
        Key: `transcripts/${message.author}/${path.basename(transcript)}`,
        Body: fs.createReadStream(transcript)
    }).promise();
    fs.unlinkSync(localMp4);
    fs.unlinkSync(localMp3);
    fs.unlinkSync(transcript);
    console.log("Transcript:", transcript);
}