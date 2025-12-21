import { NotificationMessage } from "@/types/index.ts";


export async function EmailNotificationWithRetry(message: NotificationMessage) {
    let attempts = message.retryCount;
    try {
        console.log("Attempting to send email notification...");
        console.log("Email notification sent successfully.");
        await EmailNotification(); // Call the actual email sending function
        return { success: true, attempts };
    } catch (error) {
        throw new Error("Email sending failed");
    }
}

export async function EmailNotification() {
    throw new Error("Simulated email sending failure");
}