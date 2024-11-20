import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
    {
      isGroupChat: { type: Boolean, default: false },
      groupName: { type: String, default: null },
      participants: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      ],
      admins: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User', 
        },
      ],
      messages: [
        {
          sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          content: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
          deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        },
      ],
    },
    { timestamps: true }
  );
  

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
