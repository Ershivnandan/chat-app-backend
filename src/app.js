import express from "express";
import mongoose, { mongo } from "mongoose";
import dotenv from "dotenv";

const PORT = process.env.PORT || 8088

dotenv.config();

const app = express();

app.use(express.json());



mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("MongoDB Connected")
})
.catch((err)=>{
    console.log(err.message);
})

app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`)
})
