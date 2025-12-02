import { KafkaMessage } from "kafkajs";

export interface KafkaMessagePayload {
    title: string;
    author: string;
    id: string;
    location: string;
}
export interface JobInfo {
    id: string;
    videoId: string;
    title: string;
    startTime: number;
    partition: number;
    offset: string;
    topic: string;
}

export interface EachMessageKafkaPayload {
    activeJobs: Map<string, JobInfo>;
    topic: string;
    partition: number;
    message: KafkaMessage;
    heartbeat: () => Promise<void>;
    pause: () => void;
}