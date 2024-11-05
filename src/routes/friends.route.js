import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as friendController from "../controllers/friend.controller.js";

const router = express.Router();

router.post('/send-request', authMiddleware, friendController.sendFriendRequest);
router.post('/accept-request', authMiddleware, friendController.acceptFriendRequest);
router.post('/reject-request', authMiddleware, friendController.rejectFriendRequest);

export default router;
