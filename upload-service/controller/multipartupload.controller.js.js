import { pushVideoForEncodingToKafka } from "./kafkapublisher.controller.js"
import AWS from 'aws-sdk';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as dotenv from "dotenv"
import { addVideoDetailsToDB } from "../db/db.js"
dotenv.config()

export const initializeUpload = async (req, res) => {
    try {
        console.log("Initialising Upload");
        const { filename } = req.body;
        console.log(filename);
        const s3 = new AWS.S3({
            endpoint: process.env.EndPoint,
            accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
            secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
            s3ForcePathStyle: true,
            signatureVersion: "v4"
        });
        console.log("s3");

        const bucketName = process.env.AWS_BUCKET;

        const createParams = {
            Bucket: bucketName,
            Key: filename,
            ContentType: "video/mp4",
        };

        const multipartParams = await s3
            .createMultipartUpload(createParams).promise()
        console.log("multipartparams---- ", multipartParams);
        const uploadId = multipartParams.UploadId;

        res.status(200).json({ uploadId });
    } catch (err) {
        console.error("Error initializing upload:", err);
        res.status(500).send("Upload initialization failed");
    }
};

// Upload chunk
export const uploadChunk = async (req, res) => {
    try {
        console.log("Uploading Chunk");
        const { filename, chunkIndex, uploadId } = req.body;
        const s3 = new AWS.S3({
            endpoint: "http://localhost:9000",
            accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
            secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
            s3ForcePathStyle: true,
            signatureVersion: "v4"
        });
        const bucketName = process.env.AWS_BUCKET;

        const partParams = {
            Bucket: bucketName,
            Key: filename,
            UploadId: uploadId,
            PartNumber: parseInt(chunkIndex) + 1,
            Body: req.file.buffer,
        };

        const data = await s3.uploadPart(partParams).promise();
        console.log("data------- ", data);
        res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error uploading chunk:", err);
        res.status(500).send("Chunk could not be uploaded");
    }
};

// Complete upload
export const completeUpload = async (req, res) => {
    try {
        console.log("Completing Upload");
        const { filename, totalChunks, uploadId, title, description, author, id } = req.body;

        const s3 = new AWS.S3({
            endpoint: "http://localhost:9000",
            accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
            secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
            s3ForcePathStyle: true,
            signatureVersion: "v4"
        });
        const bucketName = process.env.AWS_BUCKET;

        const completeParams = {
            Bucket: bucketName,
            Key: title,
            UploadId: uploadId,
        };

        // Listing parts using promise
        const data = await s3.listParts(completeParams).promise();

        const parts = data.Parts.map((part) => ({
            ETag: part.ETag,
            PartNumber: part.PartNumber,
        }));

        completeParams.MultipartUpload = {
            Parts: parts,
        };

        // Completing multipart upload using promise
        const uploadResult = await s3
            .completeMultipartUpload(completeParams)
            .promise();

        console.log("data----- ", uploadResult);
        const url = uploadResult.Location;
        const videodetails = await addVideoDetailsToDB(title, description, author, url);
        console.log(videodetails.id);

        pushVideoForEncodingToKafka(title, author, videodetails.id, uploadResult.Location);
        return res.status(200).json({ message: "Uploaded successfully!!!" });
    } catch (error) {
        console.log("Error completing upload :", error);
        return res.status(500).send("Upload completion failed");
    }
};


export const thumbnailupload = async (req, res) => {
    const { author, title, imageType } = req.body;
    console.log(title);

    const imageLocation = `hls/output/${author}/${title}/thumbnail`
    // const imageType=req.query.imageType
    const allowedImageTypes = [
        "image/jpg",
        "image/jpeg",
        "image/png",
        "image/webp",
    ];
    if (!allowedImageTypes.includes(imageType)) {
        return res.status(400).json({ error: "Unsupported Image Type" });
    }

    const putObjectCommand = new PutObjectCommand({
        Bucket: "yt-krishna",
        ContentType: imageType,
        Key: imageLocation,
    });
    const s3 = new S3Client({
        credentials: {
            endpoint: "http://localhost:9000",
            accessKeyId: process.env.ACCESS_KEY_ID || "krishna",
            secretAccessKey: process.env.SECRET_ACCESS_KEY || "12345678",
            s3ForcePathStyle: true,
            signatureVersion: "v4"
        },
    });
    const signedURL = await getSignedUrl(s3, putObjectCommand);
    res.json({ url: signedURL });
}
