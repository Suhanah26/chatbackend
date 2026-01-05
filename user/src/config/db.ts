import mongoose from "mongoose";
import dotenv from "dotenv"
dotenv.config()
const connectDb = async () => {
  try {
    const url = process.env.MONGO_URI;
    if (!url) {
      throw new Error("url is not found");
    }
    await mongoose
      .connect(url, { dbName: "ChatMicroServiceApp" })
      .then(() => console.log("connected to database"));
  } catch (error) {
    console.error("faiked to connect Db", error);
  }
};
export default connectDb