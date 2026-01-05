import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import { createClient } from "redis";
import userRoutes from "./routes/userRoutes.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import cors from "cors";
dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/v1", userRoutes);
const redisUrl = process.env.REDIS_URL || "";
export const redisClient = createClient({
  url: redisUrl,
});

redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

app.listen(process.env.PORT, () => {
  connectDb();
  connectRabbitMQ();
  console.log("server is listening on 5000 port");
});
