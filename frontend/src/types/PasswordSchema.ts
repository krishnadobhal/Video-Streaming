import z from "zod"

export  const passwordSchema=z.object({
    password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"),
    token:z.string().optional()
})