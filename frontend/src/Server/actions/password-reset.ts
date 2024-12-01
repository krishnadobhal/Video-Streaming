"use server"
import { ResetSchema } from "@/types/ResetSchema"
import {createSafeActionClient} from "next-safe-action"

import { generatePasswordResetToken } from "./token"
import { sendPasswordReserEmail } from "./email"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const action=createSafeActionClient()

export const reset=action(ResetSchema,async({email})=>{
    console.log(email);
    
    // console.log(users.email);
    const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
        },
      });
    
    if(!existingUser){
        return {error:"No User found"}
    }
    const passwordResetToken=await generatePasswordResetToken(email);
    await sendPasswordReserEmail(email,passwordResetToken.token)
    return {success:"Reset Email send"}
})