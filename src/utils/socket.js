import { Server } from "socket.io";
import Chat from "../models/chat.modal.js";

const initSocket = (server) => {
    const io = new Server(server);
    const onlineUsers = new Map(); 

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Store user ID from frontend
        const userId = socket.handshake.query.userId;
        onlineUsers.set(userId, socket.id);

        socket.on('joinRooms', async (chatIds) => {
            chatIds.forEach((chatId) => socket.join(chatId));
            console.log(`${userId} joined rooms: ${chatIds}`);
        });

        // Typing indicator
        socket.on('typing', (data) => {
            socket.to(data.chatId).emit('typing', { userId: data.userId });
        });

        socket.on('stopTyping', (data) => {
            socket.to(data.chatId).emit('stopTyping', { userId: data.userId });
        });

        // Send message
        socket.on('sendMessage', async (data) => {
            const { chatId, sender, content } = data;

            // Save message in database
            const chat = await Chat.findById(chatId);
            if (!chat) return;

            chat.messages.push({ sender, content });
            await chat.save();

            // Emit message to all participants in the chat
            io.to(chatId).emit('newMessage', { chatId, sender, content });
        });

        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            console.log('User disconnected:', socket.id);
        });
    });
};

export default initSocket;
