import express from 'express';
import { createChatRoom, sendMessage, getChatHistory } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/create-chat', createChatRoom); 
router.post('/send', sendMessage);
router.get('/:chatId', getChatHistory);

export default router;
