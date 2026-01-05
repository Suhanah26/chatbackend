import { Chat } from "../models/chat.js";
import TryCatch from "../config/tryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { Messages } from "../models/message.js";
import axios from "axios";
import mongoose from "mongoose";
import { getRecieverSocketId, io } from "../config/socket.js";
import { Socket } from "socket.io";
export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;
    const { otherUserId } = req.body;
    if (!otherUserId) {
      res.status(400).json({ message: "othere user id id required" });
      return;
    }
    const existingChat = await Chat.findOne({
      users: { $all: [userId, otherUserId], $size: 2 },
    });
    if (existingChat) {
      res.json({ message: "chat already exist", chatId: existingChat._id });
      return;
    }
    const newchat = await Chat.create({ users: [userId, otherUserId] });
    res.status(200).json({ message: "new chat created", chatId: newchat._id });
  }
);
export const fetchAllChat = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id as string;
  if (!userId) {
    res.status(400).json({ message: "userid is missing" });
  }
  const chats = await Chat.find({ users: userId }).sort({
    updatedAt: -1,
  });
  const chateWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id != userId);
      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        sender: { $ne: userId },
        seen: false,
      });

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
        );
        return {
          user: data,
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.log(error);
        return {
          user: { _id: otherUserId, name: "Unknown User" },
          chat: {
            ...chat.toObject(),
            latestMessage: chat.latestMessage || null,
            unseenCount,
          },
        };
      }
    })
  );
  res.json({ chats: chateWithUserData });
});
export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id as string;
  const { chatId, text } = req.body;
  const imageFile = req.file;
  console.log(text, imageFile, "i74382948574809758349", chatId, typeof chatId);
  if (!userId) {
    res.status(400).json({ message: "unAuthorized" });
    return;
  }
  if (!chatId) {
    res.status(400).json({ message: "chatId is required" });
    return;
  }
  if (!text && !imageFile) {
    res.status(400).json({ message: "text or image is required" });
    return;
  }
  const chat = await Chat.findById(chatId);
  console.log(chat, "wqpoeqpoei");
  if (!chat) {
    res.status(404).json({ message: "chat is not present" });
    return;
  }
  // the sender is present in this chat or not
  const isUserInChat = await chat.users.some(
    (id) => id.toString() === userId.toString()
  );
  if (!isUserInChat) {
    res.status(403).json({ message: "You are not a part of this chat" });
    return;
  }
  const otherUserId = chat.users.find(
    (id) => id.toString() !== userId.toString()
  );
  if (!otherUserId) {
    res.status(400).json({ message: "No other user allowed" });
  }
  // socket setup
  const recieverSockedId = getRecieverSocketId(otherUserId?.toString() || "");
  let isRecieverInChatRoom = false;
  if (recieverSockedId) {
    const recieverSockets = io.sockets.sockets.get(recieverSockedId);
    if (recieverSockets && recieverSockets.rooms.has(chatId))
      isRecieverInChatRoom = true;
  }

  let messageData: any = {
    chatId: chatId,
    sender: userId,
    seen: isRecieverInChatRoom,
    seenAt: isRecieverInChatRoom ? new Date() : undefined,
  };
  if (imageFile) {
    messageData.image = {
      url: imageFile.path,
      publicId: imageFile.filename,
    };
    messageData.messageType = "image";
    messageData.text = text || "";
  } else {
    messageData.text = "text";
    messageData.text = text || "";
  }
  const message = new Messages(messageData);
  const savedMessage = await message.save();
  const latestMessageText = imageFile ? "📷 Image" : text;

  const savedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: userId,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );
  // emit to socket
  io.to(chatId).emit("newMessage", savedMessage);
  if (recieverSockedId) {
    io.to(recieverSockedId).emit("newMessage", savedMessage);
  }
  const senderSocketId = getRecieverSocketId(userId.toString());
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", savedMessage);
  }
  if (isRecieverInChatRoom && senderSocketId) {
    io.to(senderSocketId).emit("messagesSeen", {
      chatId: chatId,
      seenBy: otherUserId,
      messageIds: [savedMessage?._id],
    });
  }
  res.status(201).json({ message: savedMessage, userId });
});
export const getMessageBychat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id || "";
    const { chatId } = req.params;
    // const {chatId}  = req.params||{};
    const chatObjectId = new mongoose.Types.ObjectId(chatId);
    console.log("welriwoiu", typeof chatId, "quiworyuoqryqwyry", req.params);
    if (!userId) {
      res.status(400).json({ message: "unAuthorized" });
    }
    if (!chatId) {
      res.status(400).json({ message: "chatId is  not present" });
    }
    const chat = await Chat.findById(chatId);
    if (!chat) {
      res.status(400).json({ message: "chat data is not found" });
      return;
    }
    const isUserInChat = await chat.users.some(
      (id) => id.toString() === userId.toString()
    );
    if (!isUserInChat) {
      res.status(403).json({ message: "You are not a part of this chat" });
      return;
    }
    const messagesMarkAsSeen = await Messages.find({
      chatId: chatObjectId,
      sender: { $ne: userId },
      seen: false,
    });
    await Messages.updateMany(
      {
        chatId: chatObjectId,
        sender: { $ne: userId },
        seen: false,
      },
      { seen: true, seenAt: new Date() }
    );
    const messages = await Messages.find({ chatId: chatObjectId }).sort({
      createdAt: 1,
    });
    const otherUserId = chat.users.find((id) => id !== userId);
    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`
      );
      if (!otherUserId) {
        res.status(403).json({ message: `no other user found` });
        return;
      }
      if (messagesMarkAsSeen.length > 0) {
        const otherUserSocketId = getRecieverSocketId(otherUserId?.toString());
        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messagesSeen", {  
            chatId: chatId,
            seenBy: userId,
            messageIds: messagesMarkAsSeen.map((msg) => msg?._id),
          });
        }
      }
      res.status(200).json({ messages, user: data });
    } catch (error) {
      console.log(error);
      res
        .status(500)
        .json({ messages, _id: otherUserId, name: "unknown user" });
    }
  }
);
