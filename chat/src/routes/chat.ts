import express from "express";
import {
  createNewChat,
  fetchAllChat,
  sendMessage,
  getMessageBychat
} from "../controllers/chat.js";
import { isAuth } from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
const router = express.Router();

router.post("/chat/new", isAuth, createNewChat);
router.get("/chat/all", isAuth, fetchAllChat);
router.post("/message", isAuth, upload.single("image"), sendMessage);
router.get("/message/:chatId",isAuth,getMessageBychat)

export default router;
