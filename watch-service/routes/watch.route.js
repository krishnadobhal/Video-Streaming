import express from "express"
import watchVideo, { streamAsset, streamMaster, getStreamToken } from "../controllers/watch.controller.js";
import getAllVideos from "../controllers/home.controller.js"
import { verifyStreamToken } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get('/home', getAllVideos);
router.get('/stream/:id', watchVideo);

// Get a streaming token (should be called by authenticated users)
router.get('/stream/:id/token', getStreamToken);

// master playlist - requires token authentication
router.get("/stream/:id/master.m3u8", verifyStreamToken, streamMaster);

// variant playlists + segments (.ts, .m3u8) - requires token authentication
router.get("/stream/:id/:fileName", verifyStreamToken, streamAsset);

export default router;
