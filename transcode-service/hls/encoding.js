import dotenv from "dotenv";
import AWS from "aws-sdk";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import binary from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
ffmpeg.setFfmpegPath(binary.path);

dotenv.config();

const PLAYBACK_BASE_URL =
  process.env.PLAYBACK_BASE_URL || "http://localhost:8082/watch/stream";

const s3 = new AWS.S3({
  endpoint: process.env.EndPoint,
  accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
  secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
  s3ForcePathStyle: true,
  signatureVersion: "v4"
});

const bucketName = process.env.AWS_BUCKET;
const hlsFolder = "hls/output";

const s3ToS3 = async (paramkey) => {
  console.log(paramkey);
  const { title: mp4FileName, author, id } = paramkey;
  const filename = mp4FileName;
  console.log("Starting script");
  console.time("req_time");
  try {
    console.log("Downloading s3 mp4 file locally 1");

    const mp4FilePath = `${mp4FileName}`;
    console.log("file", mp4FilePath);
    const writeStream = fs.createWriteStream("local.mp4");
    const readStream = s3
      .getObject({ Bucket: bucketName, Key: mp4FilePath })
      .createReadStream();
    readStream.pipe(writeStream);
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });
    console.log("Downloaded s3 mp4 file locally 2");

    const resolutions = [
      {
        resolution: "320x180",
        videoBitrate: "500k",
        audioBitrate: "64k",
        bandwidth: 676800,
      },
      {
        resolution: "854x480",
        videoBitrate: "1000k",
        audioBitrate: "128k",
        bandwidth: 1353600,
      },
      {
        resolution: "1280x720",
        videoBitrate: "2500k",
        audioBitrate: "192k",
        bandwidth: 3230400,
      },
    ];

    const baseFileName = mp4FileName.replace(".", "_");

    console.log("Starting parallel HLS conversion for all resolutions");
    const transcodePromises = resolutions.map(
      async ({ resolution, videoBitrate, audioBitrate, bandwidth }) => {
        console.log(`HLS conversion starting for ${resolution}`);
        const outputFileName = `${baseFileName}_${resolution}.m3u8`;
        const segmentFileName = `${baseFileName}_${resolution}_%03d.ts`;

        await new Promise((resolve, reject) => {
          ffmpeg("./local.mp4")
            .outputOptions([
              `-c:v h264`,
              `-b:v ${videoBitrate}`,
              `-c:a aac`,
              `-b:a ${audioBitrate}`,
              `-vf scale=${resolution}`,
              `-f hls`,
              `-hls_time 10`,
              `-hls_list_size 0`,
              `-hls_base_url ${PLAYBACK_BASE_URL}/${id}/`,
              `-hls_segment_filename hls/output/${segmentFileName}`,
            ])
            .output(`hls/output/${outputFileName}`)
            .on("end", () => resolve())
            .on("error", (err) => reject(err))
            .run();
        });

        console.log(`HLS conversion done for ${resolution}`);
        return {
          resolution,
          outputFileName,
          bandwidth,
        };
      }
    );

    const variantPlaylists = await Promise.all(transcodePromises);
    console.log("All parallel HLS conversions completed");
    console.log(`HLS master m3u8 playlist generating`);
    const masterPlaylist =
      `#EXTM3U\n` +
      variantPlaylists
        .map(
          ({ resolution, outputFileName, bandwidth }) =>
            `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${PLAYBACK_BASE_URL}/${id}/${outputFileName}`
        )
        .join("\n");

    const masterPlaylistFileName = `${baseFileName}_master.m3u8`;
    const masterPlaylistPath = `hls/output/${masterPlaylistFileName}`;
    fs.writeFileSync(masterPlaylistPath, masterPlaylist);
    console.log(`HLS master m3u8 playlist generated`);

    console.log(`Deleting locally downloaded s3 mp4 file`);
    fs.unlinkSync("local.mp4");
    console.log(`Deleted locally downloaded s3 mp4 file`);

    console.log(`Uploading media m3u8 playlists and ts segments to s3`);

    const files = fs.readdirSync(hlsFolder);
    console.log("author->", author);
    console.log("file->", filename);

    const s3BaseKey = `${hlsFolder}/${author}/${filename}`;

    for (const file of files) {
      if (!file.startsWith(baseFileName)) {
        continue;
      }
      const filePath = path.join(hlsFolder, file);
      const fileStream = fs.createReadStream(filePath);
      const contentType = file.endsWith(".ts")
        ? "video/mp2t"
        : file.endsWith(".m3u8")
          ? "application/x-mpegURL"
          : "application/octet-stream";

      const uploadParams = {
        Bucket: bucketName,
        Key: `${s3BaseKey}/${file}`,
        Body: fileStream,
        ContentType: contentType,
      };
      await s3.upload(uploadParams).promise();
      fs.unlinkSync(filePath);
    }

    console.log(
      `Uploaded media m3u8 playlists and ts segments to s3. Also deleted locally`
    );

    console.log("Success. Time taken: ");
    const data = await prisma.video_data.update({
      where: {
        id: id,
      },
      data: {
        master: `${s3BaseKey}/${masterPlaylistFileName}`,
      },
    });
    console.timeEnd("req_time");
    console.log("data", data);
  } catch (error) {
    console.error("Error:", error);
  }
};

export default s3ToS3;
