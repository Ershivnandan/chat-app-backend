import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
    participants: {
        type: [mongoose.Schema.Types.ObjectId],
        required: true,
        ref: 'User'
    },
    messages: [
        {
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
        }
    ],
}, { timestamps: true });

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
