import express from 'express';
import { createChatRoom, sendMessage, getChatHistory, getUserChats } from '../controllers/chat.controller.js';

const router = express.Router();

router.get('/', getUserChats);
router.post('/create-chat', createChatRoom); 
router.post('/send', sendMessage);
router.get('/:chatId', getChatHistory);

export default router;
