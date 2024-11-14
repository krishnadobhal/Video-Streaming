import z from "zod"

export const ResetSchema=z.object({
    email: z.string().email("Please enter a valid email address"),
})
