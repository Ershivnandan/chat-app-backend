import express from 'express';
import { createChatRoom, sendMessage, getChatHistory, getUserChats } from '../controllers/chat.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getUserChats);
router.post('/create-chat', createChatRoom); 
router.post('/send', sendMessage);
router.get('/:chatId', getChatHistory);

export default router;
