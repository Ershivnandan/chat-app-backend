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
      const userId = req.user.id;
      const chats = await Chat.find({ participants: userId }).select('_id');
      res.status(200).json(chats.map(chat => chat._id));
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



export const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;
    const { deleteForEveryone } = req.body; 
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const messageIndex = chat.messages.findIndex(
      (msg) => msg._id.toString() === messageId
    );

    if (messageIndex === -1) {
      return res.status(404).json({ message: "Message not found" });
    }

    const message = chat.messages[messageIndex];

    if (deleteForEveryone) {
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ message: "You can only delete your own messages for everyone." });
      }

      chat.messages.splice(messageIndex, 1);
      await chat.save();

      return res.status(200).json({ message: "Message deleted for everyone." });
    } else {

      if (!message.deletedFor) {
        message.deletedFor = [];
      }

      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }

      await chat.save();
      return res.status(200).json({ message: "Message deleted from your side only." });
    }
  } catch (error) {
    res.status(500).json({ message: "Error deleting message", error });
  }
};



// Group Chat Management 


export const createGroupChat = async (req, res) => {
  try {
      const { groupName, participants } = req.body;
      const creatorId = req.user.id; 

      if (participants.length < 2) {
          return res.status(400).json({ message: "A group chat needs at least 2 participants." });
      }

      if (!participants.includes(creatorId)) {
          participants.push(creatorId);
      }

      const groupChat = new Chat({
          isGroupChat: true,
          groupName,
          participants,
          admins: [creatorId],
      });

      await groupChat.save();
      res.status(201).json(groupChat);
  } catch (error) {
      res.status(500).json({ message: "Error creating group chat", error });
  }
};

export const addAdmin = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body; // User to be added as admin
    const requesterId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Only admins can add other admins
    if (!chat.admins.includes(requesterId)) {
      return res.status(403).json({ message: "Only admins can add other admins." });
    }

    // Add user to admins if they are a participant
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: "User must be a participant to become an admin." });
    }

    if (!chat.admins.includes(userId)) {
      chat.admins.push(userId);
    }

    await chat.save();
    res.status(200).json({ message: "Admin added successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error adding admin", error });
  }
};

export const removeAdmin = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.admins.includes(requesterId)) {
      return res.status(403).json({ message: "Only admins can remove other admins." });
    }

    chat.admins = chat.admins.filter((adminId) => adminId.toString() !== userId);
    await chat.save();

    res.status(200).json({ message: "Admin removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing admin", error });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body; 
    const requesterId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!chat.admins.includes(requesterId)) {
      return res.status(403).json({ message: "Only admins can add participants." });
    }

    if (!chat.participants.includes(userId)) {
      chat.participants.push(userId);
    }

    await chat.save();
    res.status(200).json({ message: "Participant added successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error adding participant", error });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { userId } = req.body;
    const requesterId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

   
    if (!chat.admins.includes(requesterId)) {
      return res.status(403).json({ message: "Only admins can remove participants." });
    }

  
    if (chat.admins.includes(userId) && chat.admins.length === 1) {
      return res.status(400).json({ message: "Cannot remove the last admin." });
    }

    chat.participants = chat.participants.filter((participantId) => participantId.toString() !== userId);
    chat.admins = chat.admins.filter((adminId) => adminId.toString() !== userId); 

    await chat.save();
    res.status(200).json({ message: "Participant removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing participant", error });
  }
};
