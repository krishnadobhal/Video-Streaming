"use server"

import { RegisterSchema } from "@/types/RegisterSchema";
import bcrpyt from "bcryptjs"
import { createSafeActionClient } from "next-safe-action"
import { generateEmailVerificationToken } from "./token";
import { sendVerificationEmail } from "./email";
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const action = createSafeActionClient();

export const registerAction = action(RegisterSchema, async ({ email, username, password }) => {
  // console.log({email});

  const hashedPassword = await bcrpyt.hash(password, 10)
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });
  console.log("existingUser", existingUser);

  // console.log("generateEmailVerificationToken");
  if (existingUser) {
    if (!existingUser.emailVerified) {

      const verificationToken = await generateEmailVerificationToken(email);
      await sendVerificationEmail(email, verificationToken.token)
      return { success: "Confirmation Sent" }
    }
    return { error: "Email already in use" }
  }
  //Logic for when the user is not registered
  await prisma.user.create({
    data: {
      email: email,
      name: username,
      password: hashedPassword,
    },
  });


  const verificationToken = await generateEmailVerificationToken(email)
  await sendVerificationEmail(email, verificationToken.token)

  return { success: "Confirmation Email Sent!" }

})