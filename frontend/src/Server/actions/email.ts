"use server"
import {Resend} from "resend"
const resend = new Resend(process.env.RESEND_API_KEY)


export const sendVerificationEmail = async (email: string, token: string) => {
    const confirmLink = `${"http://localhost:3000"}/auth/new-verification?token=${token}`
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Krishna E-commerce - Confirmation Email",
      html: `<p>Click to <a href='${confirmLink}'>confirm your email</a></p>`,
    })
    if (error) return console.log(error)
    if (data) return data
  }
export const sendPasswordReserEmail = async (email: string, token: string) => {
    const confirmLink = `${"http://localhost:3000"}/auth/new-password?token=${token}`
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Krishna E-commerce - Password Reset",
      html: `<p>Click here <a href='${confirmLink}'>Reset your password</a></p>`,
    })
    if (error) return console.log(error)
    if (data) return data
  }

  export const sendTwoFactorTokenByEmail = async (
    email: string,
    token: string
  ) => {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Krishna E-commerce - Your 2 Factor Token",
      html: `<p>Your Confirmation Code: ${token}</p>`,
    })
    if (error) return console.log(error)
    if (data) return data
  }