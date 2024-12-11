import { Server } from "socket.io";
import Chat from "../models/chat.modal.js";
import Notification from "../models/notification.modal.js";

let io;

const onlineUsers = new Map();

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ["*", "http://localhost:5173"],
      methods: ["GET", "POST"],
      
    }
  });


  io.on("connection", async (socket) => {
    console.log("A user connected:", socket.id);

    // Validate and fetch userId
    const userId = socket.handshake.query.userId;
    if (!userId) {
      console.log("User ID not provided, disconnecting...");
      socket.disconnect();
      return;
    }

    // Add user to online users map
    onlineUsers.set(userId, socket.id);

    // Join user to chat rooms they are part of
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

    // Notification Update Listener
    socket.on("update_notifications", async () => {
      try {
        const notifications = await Notification.find({ recipient: userId, read: false });
        io.to(userId).emit("notifications_updated", notifications);
      } catch (error) {
        console.error("Error updating notifications:", error);
      }
    });

    // Typing Indicators
    socket.on("typing", ({ chatId }) => {
      socket.to(chatId).emit("typing", { userId });
    });

    socket.on("stopTyping", ({ chatId }) => {
      socket.to(chatId).emit("stopTyping", { userId });
    });

    // Send Message
    socket.on("sendMessage", async ({ chatId, sender, content }) => {
      try {
        const chat = await Chat.findById(chatId);

        if (!chat || !chat.participants.includes(sender)) {
          socket.emit("error", { message: "Unauthorized action" });
          return;
        }

        const newMessage = { chatId, sender, content };
        chat.messages.push(newMessage);
        await chat.save();

        io.to(chatId).emit("newMessage", { chatId, sender, content });
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Friend Request Events
    socket.on("sendFriendRequest", async ({ friendId }) => {
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

    socket.on("respondFriendRequest", async ({ requestId, status, senderId }) => {
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
        console.error("Error sending friend request response notification:", error);
      }
    });

    // Group Chat Management
    const notifyGroup = (event, data) => {
      const { chatId, userId } = data;
      io.to(chatId).emit(event, { userId });
    };

    socket.on("adminAdded", (data) => {
      console.log(`Admin added: ${data.userId}`);
      notifyGroup("adminAdded", data);
    });

    socket.on("adminRemoved", (data) => {
      console.log(`Admin removed: ${data.userId}`);
      notifyGroup("adminRemoved", data);
    });

    socket.on("participantAdded", (data) => {
      console.log(`Participant added: ${data.userId}`);
      notifyGroup("participantAdded", data);
    });

    socket.on("participantRemoved", (data) => {
      console.log(`Participant removed: ${data.userId}`);
      notifyGroup("participantRemoved", data);
    });

    // Cleanup on disconnect
    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      console.log("User disconnected:", socket.id);
    });
  });
};

export { initSocket, io, onlineUsers };
