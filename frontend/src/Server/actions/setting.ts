"use server"
import { SettingsSchema } from "@/types/settings-schema"
import { createSafeActionClient } from "next-safe-action"
import { auth } from "../auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const action = createSafeActionClient()

export const settings = action(SettingsSchema, async (values) => {
  console.log(values);
  const user = await auth()
  if (!user) {
    return { error: "user not exist" }
  }
  const dbUser = await prisma.user.findFirst({
    where: {
      id: user.user.id,
    },
  });

  if (!dbUser) {
    return { error: "User not found" }
  }
  if (user.user.isOAuth) {
    values.email = undefined
    values.password = undefined
    values.newPassword = undefined
    values.isTwoFactorEnabled = undefined
  }
  if (values.password && values.newPassword && dbUser.password) {
    const passwordMatch = await bcrypt.compare(values.password, dbUser.password)
    if (!passwordMatch) {
      return { error: "Password does not match" }
    }
    const samePassword = await bcrypt.compare(
      values.newPassword,
      dbUser.password
    )
    if (samePassword) {
      return { error: "New password is the same as the old password" }
    }
    const hashedPassword = await bcrypt.hash(values.newPassword, 10)
    values.password = hashedPassword
    values.newPassword = undefined
  }

  revalidatePath("/dashboard/settings")
  return { success: "Settings updated" }
})