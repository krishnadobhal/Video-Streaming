"use client"


import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/types/LoginSchema"
import * as z from "zod"
import { Form,  FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {useAction} from "next-safe-action/hooks"
import { cn } from "@/lib/utils"
import { registerAction } from "@/Server/actions/register"
import { RegisterSchema } from "@/types/RegisterSchema"
import { useState } from "react"
import { FormSuccess } from "./form-success"
import { FormError } from "./form-error"


export default function RegisterComponent() {
    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            email: '',
            password: '',
            username:''
        }
    })
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    const {execute,status,result}=useAction(registerAction,{
        onSuccess(data){
            if(data.error) setError(data.error)
            if(data.success) setSuccess(data.success)
        }
    })

    const submit = (values: z.infer<typeof RegisterSchema>) => {
        // console.log(values);
        execute(values)
        
    }
    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)}>
                    <FormField
                        control={form.control}
                    name="email"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel />
                            <FormControl>
                                <Input {...field}  placeholder="example@gmail.com" type="email"/>
                            </FormControl>
                            <FormDescription />
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                    name="password"
                    render={({field}) => (
                        <FormItem> 
                            <FormLabel />
                            <FormControl>
                                <Input {...field}  placeholder="********" type="password"/>
                            </FormControl>
                            <FormDescription />
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                    name="username"
                    render={({field}) => (
                        <FormItem> 
                            <FormLabel />
                            <FormControl>
                                <Input {...field}  placeholder="BoB" type="username"/>
                            </FormControl>
                            <FormDescription />
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormSuccess message={success} />
                    <FormError message={error} />
                    <Button type="submit" className={cn('w-full',status==='executing'? 'animate-pulse' : "")}>{"Register"}</Button>
                </form>
            </Form>
            <Button onClick={() => signIn('google', { redirect: false })}>Sign in with Google</Button>
            <Button onClick={() => signIn('github')}>Sign in with GitHub</Button>
        </div>
    )
}