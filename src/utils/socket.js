import { Server } from 'socket.io';

const initSocket = (server) => {
    const io = new Server(server);

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        socket.on('sendMessage', (data) => {
            io.emit('newMessage', data);
        });

        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

export default initSocket;
