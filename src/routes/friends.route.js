import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import * as friendController from "../controllers/friend.controller.js";

const router = express.Router();

router.post('/send-request', authMiddleware, friendController.sendFriendRequest);
router.post('/accept-request', authMiddleware, friendController.acceptFriendRequest);
router.post('/reject-request', authMiddleware, friendController.rejectFriendRequest);
router.get('/getAll-request', authMiddleware, friendController.getFriendRequests);
router.get('/get-friendlist', authMiddleware, friendController.getFriendList);
router.post('/remove-friend', authMiddleware, friendController.removeFriend);


export default router;
