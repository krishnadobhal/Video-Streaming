"use client";

import { signIn } from "next-auth/react";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/types/LoginSchema";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { useAction } from "next-safe-action/hooks";
import { emailSigin } from "@/Server/actions/email-signin";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FormSuccess } from "./form-success";
import { FormError } from "./form-error";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

export default function Loginconponent() {
    const router = useRouter();
    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const [success, setsuccess] = useState("");
    const [error, seterror] = useState("");
    const [showTwoFactor, setShowTwoFactor] = useState(false);

    const { execute, status } = useAction(emailSigin, {
        onSuccess(data) {
            if (data?.error) seterror(data.error);
            if (data?.success) setsuccess(data.success);
            if (data?.twoFactor) setShowTwoFactor(true);
        },
    });

    const submit = (values: z.infer<typeof loginSchema>) => {
        console.log(values);
        execute(values);
    };
    return (
        <div>
            <div>
                <Link href={"/auth/register"}>New User?</Link>
            </div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(submit)}>
                    {showTwoFactor && (
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        We&apos;ve sent you a two factor code to your email.
                                    </FormLabel>
                                    <FormControl>
                                        <InputOTP
                                            disabled={status === "executing"}
                                            {...field}
                                            maxLength={6}
                                        >
                                            <InputOTPGroup>
                                                <InputOTPSlot index={0} />
                                                <InputOTPSlot index={1} />
                                                <InputOTPSlot index={2} />
                                                <InputOTPSlot index={3} />
                                                <InputOTPSlot index={4} />
                                                <InputOTPSlot index={5} />
                                            </InputOTPGroup>
                                        </InputOTP>
                                    </FormControl>
                                    <FormDescription />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                    {!showTwoFactor && (
                        <>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel />
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="example@gmail.com"
                                                type="email"
                                            />
                                        </FormControl>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel />
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="********"
                                                type="password"
                                            />
                                        </FormControl>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                    <FormSuccess message={success} />
                    <FormError message={error} />
                    <Button
                        type="submit"
                        className={cn(
                            "w-full",
                            status === "executing" ? "animate-pulse" : ""
                        )}
                    >
                        {"Login"}
                    </Button>
                </form>
            </Form>
            <div className="flex-col gap-2">
                <div>
                    <Button
                        variant={"outline"}
                        onClick={() => {
                            router.push("/auth/reset-form");
                        }}
                    >
                        {" "}
                        Forget password?{" "}
                    </Button>
                </div>
                <div className="flex gap-2">
                    <div>
                        <Button onClick={() => signIn("google", { redirect: false })}>
                            Sign in with Google
                        </Button>
                    </div>
                    <div>
                        <Button onClick={() => signIn("github")}>
                            Sign in with GitHub
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
