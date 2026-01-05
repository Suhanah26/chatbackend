import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
import TryCatch from "../config/tryCatch.js";
import type { IUser } from "../model/userModel.js";
import type { NextFunction } from "express-serve-static-core";
import type { Request, Response } from "express";
dotenv.config();
export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}
export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ message: "No token provided" });
      return;
    }
    const token = authHeader?.split(" ")[1] as string;
    // const storedToken = process.env.JwtToken as string;
    const decodedUser = jwt.verify(
      token,
      process.env.JwtToken as string
    ) as JwtPayload;
    console.log(decodedUser, "decodedUser");
    if (!decodedUser || !decodedUser?.user) {
      res.status(401).json({ message: "authentication failed,invalid token " });
      return;
    }
    req.user = decodedUser.user;
    next();
  } catch (error) {
    res.status(401).json({ message: "jwt token code error" });
    console.log(error);
  }
};
