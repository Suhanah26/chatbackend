import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
// socket emit is sending the data and io is input and out put and ON is listening to the event
const userSocketMap: Record<string, string> = {};
export const getRecieverSocketId = (recieverId: string): string | undefined => {
  return userSocketMap[recieverId];
};

io.on("connection", (socket: Socket) => {
  const userId = socket.handshake.query.userId as string | undefined;

  console.log("Socket connected:", socket.id, "userId:", userId);

  if (!userId || userId === "undefined") {
    console.log("❌ Invalid userId, skipping socket mapping");
    return;
  }

  userSocketMap[userId] = socket.id;
  console.log(`✅ user ${userId} mapped to socket ${socket.id}`);

  io.emit("getOnlineUser", Object.keys(userSocketMap));
  if (userId) {
    socket.join(userId);
  }
  // user typing
  socket.on("typing", (data) => {
    console.log(`user ${data?.userId} is typing in chat ${data.chatId}`);
    socket.to(data.chatId).emit("userTyping", {
      chatId: data?.chatId,
      userId: data?.UserId,
    });
  });
  //typing has stopped
  socket.on("stopTyping", (data) => {
    console.log(`data ${data?.userId} stopped typing in chat ${data?.chatId}`);
    socket.to(data?.chatId).emit("userStoppedTyping", {
      chatId: data?.chatId,
      userId: data?.userId,
    });
  });

  //join chat
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`user${userId} joined the chat room${chatId}`);
  });
  //leave chat
  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log(`user ${userId} leave the chat room${chatId}`);
  });
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (userId) {
      // 🔥 remove user on disconnect
      delete userSocketMap[userId];
    }

    io.emit("getOnlineUser", Object.keys(userSocketMap));
  });

  socket.on("connect_error", (error) => {
    console.log("the error is coming from catch block");
    console.log("Socket connection error:", error);
  });
});

export { app, server, io };
