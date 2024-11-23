import { Server } from "socket.io";
import Chat from "../models/chat.modal.js";

const initSocket = (server) => {
    const io = new Server(server);
    const onlineUsers = new Map(); 

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        const userId = socket.handshake.query.userId;
        onlineUsers.set(userId, socket.id);

        socket.on('joinRooms', async (chatIds) => {
            chatIds.forEach((chatId) => socket.join(chatId));
            console.log(`${userId} joined rooms: ${chatIds}`);
        });

        // Check karo if user is Typing 
        socket.on('typing', (data) => {
            socket.to(data.chatId).emit('typing', { userId: data.userId });
        });

        // Check if user is stopped Typing
        socket.on('stopTyping', (data) => {
            socket.to(data.chatId).emit('stopTyping', { userId: data.userId });
        });

        //Send message 
        socket.on('sendMessage', async (data) => {
            const { chatId, sender, content } = data;

        
            const chat = await Chat.findById(chatId);
            if (!chat) return;

            chat.messages.push({ sender, content });
            await chat.save();

    
            io.to(chatId).emit('newMessage', { chatId, sender, content });
        });

        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            console.log('User disconnected:', socket.id);
        });
    });
};

export default initSocket;
