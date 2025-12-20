import jwt from "jsonwebtoken";
import * as jose from "jose";
import { getAuthJsDerivedKey } from "./utils.js";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.AUTH_SECRET;

/**
 * Middleware to verify JWT token from query parameter for streaming endpoints.
 * HLS players don't support Authorization headers directly, so we use query parameters.
 * 
 * Usage: /stream/:id/master.m3u8?token=JWT_TOKEN
 */
export const verifyStreamToken = (req, res, next) => {
    const token = req.query.token;
    const requestedVideoId = req.params.id;

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    if (!JWT_SECRET) {
        console.error("AUTH_SECRET environment variable is not set");
        return res.status(500).json({ error: "Server configuration error" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Validate that the token's videoId matches the requested video
        if (decoded.videoId && decoded.videoId !== requestedVideoId) {
            return res.status(403).json({ error: "Token not valid for this video" });
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Token expired" });
        }
        if (err.name === "JsonWebTokenError") {
            return res.status(401).json({ error: "Invalid token" });
        }
        console.error("Token verification error:", err);
        return res.status(401).json({ error: "Token verification failed" });
    }
};


export const VerifyUserToken = async (req, res, next) => {

    try {
        const sessionCookie = req.cookies["authjs.session-token"];

        if (!sessionCookie) {
            return res.status(401).json({ message: "Not authenticated" });
        }

        // Auth.js v5 use HMAC-based Key Derivation Function (HKDF) to derive encryption keys from the JWT secret.
        const encryptionKey = await getAuthJsDerivedKey();

        // Decrypt the session cookie
        const { plaintext } = await jose.compactDecrypt(sessionCookie, encryptionKey);

        const payload = JSON.parse(new TextDecoder().decode(plaintext));
        if (!payload || !payload.sub) {
            return res.status(401).json({ message: "Invalid session token" });
        }
        if (payload.exp && Date.now() >= payload.exp * 1000) {
            return res.status(401).json({ message: "Session token has expired" });
        }
        console.log("Authenticated User Payload:", payload);
        req.user = payload;
        next();
    }
    catch (err) {
        console.error("Error in VerifyUserToken middleware:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}