import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";


ffmpeg.setFfmpegPath("C:\\ProgramData\\chocolatey\\lib\\ffmpeg\\tools\\ffmpeg\\bin\\ffmpeg.exe");
const WHISPER_CLI =
    process.env.WHISPER_CLI_PATH ||
    "C:\\Users\\krish\\AppData\\Local\\Programs\\Python\\Python313\\Scripts\\whisper.exe";

export function convertMp4ToMp3(inputPath: string, outputPath: string): Promise<void> {

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .noVideo()
            .audioCodec("libmp3lame")
            .save(outputPath)
            .on("end", () => {
                console.log("Conversion finished successfully!");
                resolve();
            })
            .on("error", (err) => {
                console.error("Error during conversion:", err);
                reject(err);
            });
    });
}

// This will not block the event loop. It only blocks your function until the Promise resolves.
export async function transcribeWithWhisperCLI(audioPath: string): Promise<string> {
    const outputDir = path.dirname(audioPath);
    const base = path.basename(audioPath, path.extname(audioPath));
    const vttPath = path.join(outputDir, `${base}.vtt`);

    return new Promise<string>((resolve, reject) => {
        const args = [
            audioPath,
            "--model", "small",
            "--language", "en",
            "--output_format", "vtt",
            "--output_dir", outputDir
        ];

        const proc = spawn(process.env.WHISPER_CLI || "whisper", args, {
            stdio: "inherit"
        });

        proc.on("error", reject);
        proc.on("close", (code) => {
            if (code === 0) resolve(vttPath);
            else reject(new Error(`Whisper exited with code ${code}`));
        });
    });
}
