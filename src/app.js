import express from 'express';
import connectDB from './config/db.js';
import userRoutes from './routes/user.route.js';
import dotenv from 'dotenv';
import './config/passport.js'; 
import passport from 'passport';
import session from 'express-session';
import friendRoutes from "./routes/friends.route.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8088;


connectDB();


app.use(express.json());
app.use(session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
}));
app.use(passport.initialize());
app.use(passport.session());


app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
