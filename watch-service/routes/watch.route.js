import express from "express"
import watchVideo, { streamAsset, streamMaster } from "../controllers/watch.controller.js";
import getAllVideos from "../controllers/home.controller.js"

const router = express.Router();

router.get('/home', getAllVideos);
router.get('/stream/:id', watchVideo);

// master playlist
router.get("/stream/:id/master.m3u8", streamMaster);

// variant playlists + segments (.ts, .m3u8)
router.get("/stream/:id/:fileName", streamAsset);

export default router;
