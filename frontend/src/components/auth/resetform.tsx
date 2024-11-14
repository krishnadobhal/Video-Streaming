"use client"


import { signIn } from "next-auth/react"
import { Button } from "../ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { passwordSchema } from "@/types/PasswordSchema"
import * as z from "zod"
import { Form,  FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form"
import { Input } from "../ui/input"
import {useAction} from "next-safe-action/hooks"
import { emailSigin } from "@/Server/actions/email-signin"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { FormSuccess } from "./form-success"
import { FormError } from "./form-error"
import { useState } from "react"
import { reset } from "@/Server/actions/password-reset"
import { ResetSchema } from "@/types/ResetSchema"


export default function ResetForm() {
    const form = useForm<z.infer<typeof ResetSchema>>({
        resolver: zodResolver(ResetSchema),
        defaultValues: {
            email: '',
        }
    })

    const [success,setsuccess]=useState('')
    const [error,seterror]=useState('')

    const {execute,status,result}=useAction(reset,{
        onSuccess(data){
            if(data?.error) seterror(data.error)
            if(data?.success) setsuccess(data.success)
        }
    })

    const submit = (values: z.infer<typeof ResetSchema>) => {
        console.log(values);
        execute(values)
    }
    return (
        <div>
            <div><Link href={"/auth/register"}>New User?</Link></div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)}>
                    <FormField
                        control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel />
                            <FormControl>
                                <Input {...field} placeholder="example@gmail.com" type="email"/>
                            </FormControl>
                            <FormDescription />
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormSuccess message={success}  />
                    <FormError message={error}  />
                    <Button type="submit" className={cn('w-full',status==='executing'? 'animate-pulse' : "")}>{"Reset"}</Button>
                </form>
            </Form> 
        </div>
    )
}