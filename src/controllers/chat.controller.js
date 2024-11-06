import Chat from "../models/chat.modal.js";

export const createChatRoom = async (req, res) => {
  try {
    const { user1, user2 } = req.body;
    const chat = new Chat({ participants: [user1, user2] });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error creating chat room", error });
  }
};


export const getUserChats = async (req, res) => {
    try {
        const  userId = req.user.id;
        const chats = await Chat.find({ participants: userId }).populate('messages.sender', 'username');
        res.status(200).json(chats);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user chats", error });
    }
};


export const sendMessage = async (req, res) => {
  try {
    const { chatId, sender, content } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.messages.push({ sender, content });
    await chat.save();
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate(
      "messages.sender",
      "username"
    );
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    res.status(200).json(chat.messages);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving chat history", error });
  }
};
