import express from 'express';
import { createChatRoom, sendMessage, getChatHistory, getUserChats, deleteMessage, createGroupChat, addAdmin, removeAdmin, addParticipant, removeParticipant } from '../controllers/chat.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getUserChats);
router.post('/create-chat', authMiddleware, createChatRoom); 
router.post('/send',authMiddleware, sendMessage);
router.get('/:chatId',authMiddleware, getChatHistory);
router.post('/create-group-chat', authMiddleware, createGroupChat);
router.delete('/:chatId/message/:messageId', authMiddleware, deleteMessage);

// Group Chat 
router.post('/:chatId/admin/add', authMiddleware, addAdmin); 
router.post('/:chatId/admin/remove', authMiddleware, removeAdmin); 
router.post('/:chatId/participant/add', authMiddleware, addParticipant); 
router.post('/:chatId/participant/remove', authMiddleware, removeParticipant); 


export default router;
