import { createClient } from "redis";
import TryCatch from "../config/tryCatch.js";
import { pulishToQueue } from "../config/rabbitmq.js";
import { redisClient } from "../index.js";
import { User } from "../model/userModel.js";
import { generateToken } from "../config/generateToken.js";
import type { AuthenticatedRequest } from "../middleWare/isAuth.js";
import { UserCheck } from "lucide-react";
export const loginUser = TryCatch(async (req, res) => {
  console.log(req.body, " req.body");
  const { email } = req.body;
  const rateLimitKey = `otp:ratelimit:${email}`;
  const rateLimit = await redisClient.get(rateLimitKey);
  console.log(rateLimit, "rateLimit");
  if (rateLimit === "true") {
    res.status(429).json({
      message: "Too many rquest. Please wait before requesting new OTP",
    });
    return;
  }
  const otp = Math.floor(10000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  await redisClient.set(otpKey, otp, { EX: 300 });
  await redisClient.set(rateLimitKey, "true", { EX: 60 });
  const message = {
    to: email,
    subject: "your otp code",
    body: `your otp is ${otp}. It is valid for 5 mins`,
  };
  await pulishToQueue("send-otp", message);
  res.status(200).json({ message: "OTP sent to your email" });
});
export const verifyUser = TryCatch(async (req, res) => {
  const { email, otp } = req.body;
  console.log(email, otp, "req.vodyyyyyyy");
  if (!otp) {
    res.status(400).json({ message: "OTP is required" });
  }
  const otpKey = `otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);
  console.log(storedOtp, storedOtp === otp);
  if (!storedOtp || storedOtp != otp) {
    res.status(401).json({ message: "otp is incorrect" });
  } else {
    await redisClient.del(otpKey);
    let user = await User.findOne({ email });
    if (!user) {
      const name = email.slice(0, 8);
      user = await User.create({ name, email });
    }
    const token = generateToken(user);
    res.status(200).json({ token, user, meaage: "user is verified" });
  }
  //  else {
  //   res.status(401).json("user has alread registered kindly login");
  // }
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await req.user;
  res.status(200).json({ user });
});
export const getAllUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const users = await User.find();
  res.status(200).json(users);
});
export const getAUser = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const users = await User.findById({ _id: id });
  res.status(200).json(users);
});
export const updateUsers = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = await User.findById({ _id: req.user?._id });
  if (!user) {
    res.status(400).json({ message: "user not found" });
  } else {
    user.name = req.body.name;
    await user.save();
    const token = generateToken(user);
    res.status(200).json({ message: "user updated", token });
  }
});
