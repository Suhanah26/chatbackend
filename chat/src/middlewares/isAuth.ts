import type { NextFunction, Response, Request } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
}
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
      res.status(401).json({ message: "please login - no auth headers" });
      return;
    }
    const token = authHeader?.split(" ")[1] as string;
    const storedToken = process.env.JwtToken as string;
    const decodedUser = jwt.verify(token, storedToken) as JwtPayload;

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
