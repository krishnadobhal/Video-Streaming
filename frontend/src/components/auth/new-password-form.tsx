"use client"


import { Button } from "../ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { passwordSchema } from "@/types/PasswordSchema"
import * as z from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import { useAction } from "next-safe-action/hooks"
import { cn } from "@/lib/utils"
import { FormSuccess } from "./form-success"
import { FormError } from "./form-error"
import { useState } from "react"
import { newPassword } from "@/Server/actions/new-password"
import { useSearchParams } from "next/navigation"


export default function NewPassword() {
    const form = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: '',
        }
    })

    const token = useSearchParams().get("token")

    const [success, setsuccess] = useState('')
    const [error, seterror] = useState('')

    const { execute, status } = useAction(newPassword, {
        onSuccess(data) {
            if (data?.error) seterror(data.error)
            if (data?.success) setsuccess(data.success)
        }
    })

    const submit = (values: z.infer<typeof passwordSchema>) => {
        console.log(token);

        console.log({ password: values.password, token: token });
        const val = { password: values.password, token: token }
        execute(val)

    }
    return (
        <div>
            <div>Enter New password</div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)}>
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel />
                                <FormControl>
                                    <Input {...field} placeholder="********" type="password" />
                                </FormControl>
                                <FormDescription />
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormSuccess message={success} />
                    <FormError message={error} />
                    <Button type="submit" className={cn('w-full', status === 'executing' ? 'animate-pulse' : "")}>{"Reset"}</Button>
                </form>
            </Form>

        </div>
    )
}