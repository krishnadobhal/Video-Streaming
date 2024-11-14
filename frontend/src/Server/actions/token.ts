"use server"

import { eq } from "drizzle-orm"
import { db } from ".."
import crypto from "crypto"
import { emailTokens, passwordResetTokens, twoFactorTokens, users } from "../schema"


export const getVerificationTokenByEmail = async (email: string) => {
    try {
        const verificationToken = await db.query.emailTokens.findFirst({
            where: eq(emailTokens.email, email),
        })
        return verificationToken
    } catch (error) {
        return null
    }
}
export const getVerificationTokenByToken = async (token: string) => { 
    try {
        const verificationToken = await db.query.emailTokens.findFirst({
            where: eq(emailTokens.token, token), // Search by token instead of email
        });
        return verificationToken;
    } catch (error) {
        return null;
    }
};

export const getPasswordTokenByToken=async(token:string)=>{
    try {
        const passwordToken=await db.query.passwordResetTokens.findFirst({
            where:eq(passwordResetTokens.token,token)
        })
        return passwordToken
    } catch (error) {
        return null
    }
}

export const generateEmailVerificationToken=async(email:string)=>{
    const token=crypto.randomUUID()
    const expires=new Date(new Date().getTime() + 3600*1000)
    const existingToken=await getVerificationTokenByEmail(email);

    if(existingToken){
        await db.delete(emailTokens).where(eq(emailTokens.id, existingToken.id))
    }
    const verificationToken = await db
        .insert(emailTokens)
        .values({
            email,
            token,
            expires,
        })
    .returning()
  return verificationToken
}

export const emailVerification=async(token:string)=>{
    console.log(token);
    
    const existingToken = await getVerificationTokenByToken(token)
    if (!existingToken) return { error: "Token not found" }
    const hasExpired = new Date(existingToken.expires) < new Date()

    if (hasExpired) return { error: "Token has expired" }

    const existingUser = await db.query.users.findFirst({
    where: eq(users.email, existingToken.email),
    })
    if (!existingUser) return { error: "Email does not exist" }

    await db
    .update(users)
    .set({
        emailVerified: new Date(),
        email: existingToken.email,
    })
    .where(eq(users.id, existingUser.id))

    await db.delete(emailTokens).where(eq(emailTokens.id, existingToken.id))
    return { success: "Email Verified" }
}

export const getpasswordTokenByToken=async(token:string)=>{
    try {
        const paaswordResetToken=await db.query.passwordResetTokens.findFirst({
            where:eq(passwordResetTokens.token,token)
        })
        return paaswordResetToken
    } catch (error) {
        console.log(error);
        return null
        
    }
}

export const generatePasswordResetToken=async(email:string)=>{
    try {
        const token=crypto.randomUUID();
        const expires=new Date(new Date().getTime() + 3600*1000)
        const existingToken=await getpasswordTokenByToken(token)
        if(existingToken){
            await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id,existingToken.id))
        } 
        const passwordResetToken=await db.insert(passwordResetTokens).values({
            email,
            token,
            expires
        }).returning()
        return passwordResetToken

    } catch (error) {
        console.log(error);
        
        throw error
    }
}

export const getTwoFactorTokenByEmail=async(email:string)=>{
    try {
        const twoFactor=db.query.twoFactorTokens.findFirst({
            where:eq(twoFactorTokens.email,email)
        })
        return twoFactor
    } catch (error) {
        console.log(error);
        throw error;
    }
}

export const generateTwoFactorToken = async (email: string) => {
    try {
        const token = crypto.randomInt(100_000, 1_000_000).toString()
      //Hour Expiry
      const expires = new Date(new Date().getTime() + 3600 * 1000)

        const existingToken = await getTwoFactorTokenByEmail(email)
        if (existingToken) {
        await db
            .delete(twoFactorTokens)
            .where(eq(twoFactorTokens.id, existingToken.id))
        }
        const twoFactorToken = await db
            .insert(twoFactorTokens)
            .values({
                email,
                token,
                expires,
            })
        .returning()
        return twoFactorToken
    } catch (e) {
        return null
    }
}