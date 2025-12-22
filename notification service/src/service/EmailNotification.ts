import { NotificationMessage } from "@/types/index.ts";


export async function EmailNotificationWithRetry(message: NotificationMessage): Promise<{ success: boolean; attempts: number; error?: string }> {

    const attempts = (message.retryCount ?? 0) + 1;

    try {
        console.log(`Attempt #${attempts}: Sending email...`);
        await EmailNotification();
        console.log("Email sent successfully");

        return { success: true, attempts };
    } catch (error: any) {
        console.error("Email sending failed");

        return {
            success: false,
            attempts,
            error: error?.message || "UNKNOWN_ERROR"
        };
    }
}


export async function EmailNotification() {
    throw new Error("Simulated email sending failure");
}