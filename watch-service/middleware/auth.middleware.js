import jwt from "jsonwebtoken";

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

/**
 * Generate a streaming token for a user.
 * This can be called from a protected endpoint to get a token for streaming.
 * 
 * @param {object} payload - User data to encode in the token
 * @param {string} expiresIn - Token expiration time (default: 1h)
 * @returns {string} JWT token
 */
export const generateStreamToken = (payload, expiresIn = "1h") => {
    if (!JWT_SECRET) {
        throw new Error("AUTH_SECRET environment variable is not set");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export default verifyStreamToken;
