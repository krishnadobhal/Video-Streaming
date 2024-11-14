"use server"
import { ResetSchema } from "@/types/ResetSchema"
import {createSafeActionClient} from "next-safe-action"
import { db } from ".."
import { eq } from "drizzle-orm"
import { users } from "../schema"
import { generatePasswordResetToken } from "./token"
import { sendPasswordReserEmail } from "./email"

const action=createSafeActionClient()

export const reset=action(ResetSchema,async({email})=>{
    console.log(email);
    
    // console.log(users.email);
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    })
    
    if(!existingUser){
        return {error:"No User found"}
    }
    const passwordResetToken=await generatePasswordResetToken(email);
    await sendPasswordReserEmail(email,passwordResetToken[0].token)
    return {success:"Reset Email send"}
})