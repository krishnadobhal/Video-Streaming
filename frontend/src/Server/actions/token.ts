"use server"

import crypto from "crypto"
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await prisma.email_tokens.findFirst({
      where: {
        email: email,
      },
    });

    return verificationToken
  } catch (error) {
    console.log(error);
    return null
  }
}
export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await prisma.email_tokens.findFirst({
      where: {
        token: token,
      },
    });

    return verificationToken;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const generateEmailVerificationToken = async (email: string) => {
  const token = crypto.randomUUID()
  const expires = new Date(new Date().getTime() + 3600 * 1000)
  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await prisma.email_tokens.delete({
      where: {
        id: existingToken.id,
      },
    });

  }
  const verificationToken = await prisma.email_tokens.create({
    data: {
      email: email,
      token: token,
      expires: expires
    },
  });

  return verificationToken
}

export const emailVerification = async (token: string) => {
  console.log(token);

  const existingToken = await getVerificationTokenByToken(token)
  if (!existingToken) return { error: "Token not found" }
  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) return { error: "Token has expired" }

  const existingUser = await prisma.user.findFirst({
    where: {
      email: existingToken.email,
    },
  });

  if (!existingUser) return { error: "Email does not exist" }

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  });


  await prisma.email_tokens.delete({
    where: {
      id: existingToken.id,
    },
  });

  return { success: "Email Verified" }
}

export const getpasswordTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        token: token,
      },
    });

    return passwordResetToken
  } catch (error) {
    console.log(error);
    return null

  }
}

export const generatePasswordResetToken = async (email: string) => {
  try {
    const token = crypto.randomUUID();
    const expires = new Date(new Date().getTime() + 3600 * 1000)
    const existingToken = await getpasswordTokenByToken(token)
    if (existingToken) {
      await prisma.password_reset_tokens.delete({
        where: {
          id: existingToken.id,
        },
      });

    }
    const passwordResetToken = await prisma.password_reset_tokens.create({
      data: {
        email: email,
        token: token,
        expires: expires,
      },
    });

    return passwordResetToken

  } catch (error) {
    console.log(error);

    throw error
  }
}

export const getTwoFactorTokenByEmail = async (email: string) => {
  try {
    const twoFactor = await prisma.two_factor_tokens.findFirst({
      where: {
        email: email,
      },
    });

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
    const twoFactorToken = await prisma.two_factor_tokens.create({
      data: {
        email: email,
        token: token,
        expires: expires,
      },
    });

    return twoFactorToken
  } catch (e) {
    console.log(e);
    return null
  }
}