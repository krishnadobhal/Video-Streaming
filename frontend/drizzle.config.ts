import { defineConfig } from 'drizzle-kit';
import * as dotenv from "dotenv"
import {} from "./src/Server/schema"

dotenv.config({
    path:".env.local"
})

export default defineConfig({
    schema: './src/Server/schema.ts',
    out: './src/Server/migration',
    dialect: "postgresql", // 'postgresql' | 'mysql' | 'sqlite'
    dbCredentials: {
        url: process.env.DRIZZLE_DATABASE_URL as string
    }
});