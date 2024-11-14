"use server"

import { RegisterSchema } from "@/types/RegisterSchema";
import bcrpyt from "bcrypt"
import {createSafeActionClient} from "next-safe-action"
import { users } from "../schema";
import { db } from "..";
import { eq } from "drizzle-orm";
import { generateEmailVerificationToken, getVerificationTokenByEmail } from "./token";
import { sendVerificationEmail } from "./email";

const action=createSafeActionClient();

export const registerAction=action(RegisterSchema,async({email,username,password})=>{
    // console.log({email});

    const hashedPassword = await bcrpyt.hash(password, 10)
    const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email),
    })
    console.log("existingUser",existingUser);
    
    // console.log("generateEmailVerificationToken");
    if(existingUser){
        if(!existingUser.emailVerified){
            
            const verificationToken=await generateEmailVerificationToken(email);
            await sendVerificationEmail(email,verificationToken[0].token)
            return {success:"Confirmation Sent"}
        }
        return {error:"Email already in use"}
    }
    //Logic for when the user is not registered
    await db.insert(users).values({
        email,
        name:username,
        password: hashedPassword,
    })

    const verificationToken = await generateEmailVerificationToken(email)
    await sendVerificationEmail(email,verificationToken[0].token)

    return { success: "Confirmation Email Sent!" }

})