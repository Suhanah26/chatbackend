import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_TOKEN = process.env.JwtToken as string; // ensure type

export const generateToken = (user: any) => {
  console.log(user,"lkqwrhkqwj,erhjkwm")
  return jwt.sign({ user }, JWT_TOKEN, { expiresIn: "3d" });
};
