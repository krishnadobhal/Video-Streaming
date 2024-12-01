"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Session } from "next-auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SettingsSchema } from "@/types/settings-schema"
import Image from "next/image"
import { Switch } from "@/components/ui/switch"
import { FormError } from "@/components/auth/form-error"
import { FormSuccess } from "@/components/auth/form-success"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAction } from "next-safe-action/hooks"
import { settings } from "@/Server/actions/setting"

type SettingsForm = {
    session: Session
}

export default function SettingsCard(session: SettingsForm) {
    const [error, setError] = useState<string | undefined>()
    const [success, setSuccess] = useState<string | undefined>()
    console.log(session.session.user)
    const form = useForm<z.infer<typeof SettingsSchema>>({
        resolver: zodResolver(SettingsSchema),
        defaultValues: {
            password: undefined,
            newPassword: undefined,
            name: session.session.user?.name || undefined,
            email: session.session.user?.email || undefined,
            image: session.session.user.image || undefined,
            isTwoFactorEnabled: session.session.user?.isTwoFactorEnabled || undefined,
        },
    })

    const { execute, status } = useAction(settings, {
        onSuccess: (data) => {
            if (data?.success) setSuccess(data.success)
            if (data?.error) setError(data.error)
        },
        onError: () => {
            setError("Something went wrong")
        },
    })

    const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
        execute(values)
    }

    return (
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Your Settings</CardTitle>
                    <CardDescription>Update your account settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="John Doe"
                                                disabled={status === "executing"}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            This is your public display name.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Avatar</FormLabel>
                                        <div className="flex items-center gap-4">
                                            {!form.getValues("image") && (
                                                <div className="font-bold">
                                                    {session.session.user?.name?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {form.getValues("image") && (
                                                <Image
                                                    src={form.getValues("image")!}
                                                    width={42}
                                                    height={42}
                                                    className="rounded-full"
                                                    alt="User Image"
                                                />
                                            )}
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder="User Image"
                                                type="hidden"
                                                disabled={status === "executing"}
                                                {...field}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="********"
                                                disabled={
                                                    status === "executing" || session?.session.user.isOAuth
                                                }
                                                {...field}
                                                type="password"
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="*******"
                                                disabled={
                                                    status === "executing" || session?.session.user.isOAuth
                                                }
                                                {...field}
                                                type="password"
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isTwoFactorEnabled"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Two Factor Authentication</FormLabel>
                                        <FormDescription>
                                            Enable two factor authentication for your account
                                        </FormDescription>
                                        <FormControl>
                                            <Switch
                                                disabled={
                                                    status === "executing" ||
                                                    session.session.user.isOAuth === true
                                                }
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>

                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormError message={error} />
                            <FormSuccess message={success} />
                            <Button
                                type="submit"
                                disabled={status === "executing"}
                            >
                                Update your settings
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
