import { Server } from "socket.io";
import Chat from "../models/chat.modal.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const onlineUsers = new Map();

  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (!userId) {
      socket.disconnect();
      return;
    }

    onlineUsers.set(userId, socket.id);

    try {
      const userChats = await Chat.find({ participants: userId })
        .populate("participants", "username")
        .populate("messages.sender", "username");

      socket.emit("initChats", {
        chats: userChats.map((chat) => ({
          chatId: chat._id,
          participants: chat.participants,
          messages: chat.messages.slice(-10),
        })),
      });

      const chatIds = userChats.map((chat) => chat._id.toString());
      chatIds.forEach((chatId) => socket.join(chatId));
      console.log(`${userId} joined rooms: ${chatIds}`);
    } catch (error) {
      console.error("Error initializing chats:", error);
    }

    socket.on("typing", (data) => {
      socket.to(data.chatId).emit("typing", { userId });
    });

    socket.on("stopTyping", (data) => {
      socket.to(data.chatId).emit("stopTyping", { userId });
    });

    socket.on("sendMessage", async (data) => {
      const { chatId, sender, content } = data;

      try {
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.includes(sender)) {
          return socket.emit("error", { message: "Unauthorized action" });
        }

        const newMessage = { chatId, sender, content };
        chat.messages.push(newMessage);
        await chat.save();

        io.to(chatId).emit("newMessage", { chatId, sender, content });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("sendFriendRequest", async (data) => {
      const { friendId, userId } = data;

      try {
        const friendSocketId = onlineUsers.get(friendId);
        if (friendSocketId) {
          io.to(friendSocketId).emit("friendRequestReceived", {
            userId,
            message: "You have a new friend request!",
          });
        }
      } catch (error) {
        console.error("Error sending friend request notification:", error);
      }
    });

    socket.on("respondFriendRequest", async (data) => {
      const { requestId, status, senderId, receiverId } = data;

      try {
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("friendRequestResponse", {
            requestId,
            status,
            message:
              status === "accepted"
                ? "Your friend request was accepted!"
                : "Your friend request was rejected.",
          });
        }
      } catch (error) {
        console.error(
          "Error sending friend request response notification:",
          error
        );
      }
    });

    // Group Chhat functionality

    socket.on("adminAdded", (data) => {
      const { userId } = data;
      console.log(`Admin added: ${userId}`);
      socket.broadcast.emit("adminAdded", { userId });
    });

    socket.on("adminRemoved", (data) => {
      const { userId } = data;
      console.log(`Admin removed: ${userId}`);
      socket.broadcast.emit("adminRemoved", { userId });
    });

    socket.on("participantAdded", (data) => {
      const { userId } = data;
      console.log(`Participant added: ${userId}`);
      socket.broadcast.emit("participantAdded", { userId });
    });

    socket.on("participantRemoved", (data) => {
      const { userId } = data;
      console.log(`Participant removed: ${userId}`);
      socket.broadcast.emit("participantRemoved", { userId });
    });

    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId) || [];
      onlineUsers.set(
        userId,
        userSockets.filter((id) => id !== socket.id)
      );
      if (onlineUsers.get(userId).length === 0) {
        onlineUsers.delete(userId);
      }
      console.log("User disconnected:", socket.id);
    });
  });
};

export { initSocket, io };
