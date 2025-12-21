export interface NotificationMessage {
    to: string;
    subject: string;
    body: string;
    retryCount: number;
}