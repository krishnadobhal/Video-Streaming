// "use server"
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@/Server/schema"


console.log('DRIZZLE_DATABASE_URL:', process.env.DRIZZLE_DATABASE_URL);



const sql = neon(process.env.DRIZZLE_DATABASE_URL as string);
export const db = drizzle(sql,{schema});
