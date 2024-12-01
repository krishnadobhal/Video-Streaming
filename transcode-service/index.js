import express from "express"
import KafkaConfig from "../upload-service/kafka/kafka.js"
import cors from "cors"
import s3ToS3 from "./hls/encoding.js"

const app = express()
app.use(cors())
const kafkaconfig = new KafkaConfig()
await kafkaconfig.connectConsumer();
let isSystemFree = true;

kafkaconfig.consume("youtube", async (message) => {
      const value = JSON.parse(message);
      console.log("value", value);
      if (value && value.title) {
         if (isSystemFree) {
         try {
            console.log("Processing file:", value.title);
            isSystemFree = false; 
            kafkaconfig.consumer.pause([{ topic: "youtube" }]);

            await s3ToS3(value);

            console.log("Finished processing:", value.title);
            isSystemFree = true; 
            kafkaconfig.consumer.resume([{ topic: "youtube" }]);
         } catch (error) {
            console.error("Error during file processing:", error);
            isSystemFree = true; // Ensure system is marked free on error
            kafkaconfig.consumer.resume([{ topic: "youtube" }]); // Resume consumption
         }
      } else {
         console.log("System busy, message will be processed when consumer resumes.");
      }
   } else {
      console.log("Message is missing filename. Skipping.");
   }
   
})

app.get("/", async (req, res) => {
   await s3ToS3()
   res.send("encoding")
})

app.listen(81)

