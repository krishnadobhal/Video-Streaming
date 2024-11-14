"use server"
import {createSafeActionClient} from "next-safe-action"
import {passwordSchema} from "@/types/PasswordSchema"
import { getpasswordTokenByToken } from "./token"
import { db } from ".."
import { eq } from "drizzle-orm"
import { passwordResetTokens, users } from "../schema"
import bcrypt from "bcrypt"
import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"

const action=createSafeActionClient()

export const newPassword=action(passwordSchema,async({token,password})=>{
    const pool=new Pool({connectionString:process.env.DRIZZLE_DATABASE_URL})
    const dbpool=drizzle(pool)
    console.log(token);
    
    if(!token){
        return {error:"Missing Token"}
    }
    const existingToken=await getpasswordTokenByToken(token);
    if(!existingToken){
        return {error:"Token not found"}
    }
    const hasExpired=new Date(existingToken.expires) < new Date()       
    if(hasExpired){
        return {error:"Token Expired"}
    }
    const existingUser=await db.query.users.findFirst({
        where:eq(users.email,existingToken.email)
    })
    if (!existingUser) {
        return { error: "User not found" }
      }

    const hashedpassword=await bcrypt.hash(password,10);

    await dbpool.transaction(async(tx)=>{
        await tx
        .update(users)
        .set({
            password: hashedpassword,
        })
        .where(eq(users.id, existingUser.id))
        await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.id,existingToken.id))
    })
    return {success:"Password Updated"}
})