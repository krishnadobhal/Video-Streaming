"use server"
import { createSafeActionClient } from "next-safe-action"
import { passwordSchema } from "@/types/PasswordSchema"
import { getpasswordTokenByToken } from "./token"
import bcrypt from "bcryptjs";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const action = createSafeActionClient()

export const newPassword = action(passwordSchema, async ({ token, password }) => {

    console.log(token);

    if (!token) {
        return { error: "Missing Token" }
    }
    const existingToken = await getpasswordTokenByToken(token);
    if (!existingToken) {
        return { error: "Token not found" }
    }
    const hasExpired = new Date(existingToken.expires) < new Date()
    if (hasExpired) {
        return { error: "Token Expired" }
    }
    const existingUser = await prisma.user.findFirst({
        where: {
            email: existingToken.email,
        },
    });
    if (!existingUser) {
        return { error: "User not found" }
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: {
                id: existingUser.id,
            },
            data: {
                password: hashedpassword,
            },
        });

        await tx.password_reset_tokens.delete({
            where: {
                id: existingToken.id,
            },
        });
    });

    return { success: "Password Updated" }
})