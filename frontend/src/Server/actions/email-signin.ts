"use server"
import { loginSchema } from "@/types/LoginSchema"
import { createSafeActionClient } from "next-safe-action"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import { generateEmailVerificationToken, generateTwoFactorToken, getTwoFactorTokenByEmail } from "./token"
import { sendTwoFactorTokenByEmail, sendVerificationEmail } from "./email"
import { signIn } from "../auth"
import { AuthError } from "next-auth"

const action = createSafeActionClient()

export const emailSigin = action(loginSchema, async ({ email, password, code }) => {
    try {
        console.log(email);

        const existingUser=await prisma.user.findFirst({
            where:{
                email:email
            }
        })
        if (!existingUser) {
            return { error: "Email not found" }
        }

        if (existingUser?.email !== email) {
            return { error: "Email not found" }
        }

        if (!existingUser?.emailVerified) {
            const verificationToken = await generateEmailVerificationToken(email)
            await sendVerificationEmail(email, verificationToken.token)
            return { success: "Comfirmation Email sent" }
        }

        if (existingUser.twoFactorEnabled && existingUser.email) {
            if (code) {
                const twoFactorToken = await getTwoFactorTokenByEmail(
                    existingUser.email
                )
                if (!twoFactorToken) {
                    return { error: "Invalid Token" }
                }
                if (twoFactorToken.token !== code) {
                    return { error: "Invalid Token" }
                }
                const hasExpired = new Date(twoFactorToken.expires) < new Date()
                if (hasExpired) {
                    return { error: "Token has expired" }
                }
                await prisma.two_factor_tokens.delete({
                    where:{
                        id:twoFactorToken.id
                    }
                })
                
            } else {
                const token = await generateTwoFactorToken(existingUser.email)

                if (!token) {
                    return { error: "Token not generated!" }
                }

                await sendTwoFactorTokenByEmail(token.email, token.token)
                return { twoFactor: "Two Factor Token Sent!" }
            }
        }

        await signIn('credentials', {
            email,
            password,
            redirectTo: "/"
        })

        return { email }

    } catch (error) {
        console.log(error)
        if (error instanceof AuthError) {
            switch (error.type) {
                case "AccessDenied":
                    return { error: error.message }
                case "OAuthSignInError":
                    return { error: error.message }
                default:
                    return { error: "Something went wrong" }
            }
        }
        throw error
    }
})