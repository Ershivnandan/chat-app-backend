import express from 'express';
import connectDB from './src/config/db.js';
import userRoutes from './src/routes/user.route.js';
import dotenv from 'dotenv';
import './src/config/passport.js'; 
import chatRoutes from "./src/routes/chat.route.js";
import passport from 'passport';
import session from 'express-session';
import friendRoutes from "./src/routes/friends.route.js"
import { initSocket } from './src/utils/socket.js';
import http from "http";
import CORS from "cors";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8088;

connectDB();

app.use(express.json());

app.use(
    CORS({
        origin: ["http://localhost:5173", process.env.CLIENT_URL],
        credentials: true,
    })
);
app.use(session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats', chatRoutes);

initSocket(server);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
