import express from "express"
import { initializeUpload, uploadChunk, completeUpload,thumbnailupload } from "../controller/multipartupload.controller.js.js";

import multer from 'multer';
const upload = multer();

const router = express.Router();

// Route for initializing upload
router.post('/initialize', upload.none(), initializeUpload);
router.get('/test', upload.none(), (req,res)=>{
    res.send("hello")
});


// Route for uploading individual chunks
router.post('/', upload.single('chunk'), uploadChunk);

// Route for completing the upload
router.post('/complete', completeUpload);
router.post("/thumbnail",thumbnailupload)

export default router;