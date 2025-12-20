import express from "express"
import kafkaPublisherRouter from "./routes/kafkapublisher.route.js"
import cors from "cors"
import bodyParser from "body-parser"
import router from "./routes/kafkapublisher.route.js"
import { SetupElasticsearch } from "./service/elasticSearch.js"

const app = express();

// Middleware for parsing JSON
app.use(bodyParser.json());
app.use(cors())
app.use("/upload", router)
app.get("/", (req, res) => {
    res.send("hello ")
})
app.listen(8080)
SetupElasticsearch()

