
import { hkdf } from "@panva/hkdf";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.AUTH_SECRET;
const AUTH_COOKIE_NAME = "authjs.session-token";

// Auth.js v5 use HMAC-based Key Derivation Function (HKDF) to derive encryption keys from the JWT secret.
export async function getAuthJsDerivedKey() {
    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not set");
    }

    return hkdf(
        "sha256",
        JWT_SECRET,
        AUTH_COOKIE_NAME,
        `Auth.js Generated Encryption Key (${AUTH_COOKIE_NAME})`,
        64
    );
}


/**
 * Generate a streaming token for a user.
 * This can be called from a protected endpoint to get a token for streaming.
 */
export const generateStreamToken = (payload, expiresIn = "1h") => {
    if (!JWT_SECRET) {
        throw new Error("AUTH_SECRET environment variable is not set");
    }
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};