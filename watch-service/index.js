import express from "express";
import dotenv from "dotenv"
import cors from "cors"
import watchRouter from "./routes/watch.route.js"
import cookieParser from "cookie-parser";
import { shutdown } from "./service/shutdown.js";


dotenv.config();

const port = process.env.PORT || 8082;
const app = express();

const FRONTEND_ORIGIN = "http://localhost:3000";

app.use(cookieParser());

// for {withCredentials: true} to work properly, we need this CORS setup
app.use(cors({
   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
   allowedHeaders: ["Content-Type", "Authorization"],
   origin: FRONTEND_ORIGIN,
   credentials: true,
}));

app.use(express.json());

app.use('/watch', watchRouter);

app.get('/', (req, res) => {
   res.send('HHLD YouTube Watch Service')
})

const server = app.listen(port, () => {
   console.log(`Server is listening at http://localhost:${port}`);
})


shutdown(server);