import express from "express";
import dotenv from "dotenv";
import { startsendOTPConsumer } from "./consumer.js";
dotenv.config();
startsendOTPConsumer()
const app = express();
app.listen(process.env.PORT, () => {
  console.log(`listening to ${process.env.PORT} `);
});
