import express from "express";
import authMiddleware from "../middleware/auth.middleware.js";
import { createNotification, getNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/createNotification", authMiddleware, createNotification);
router.get("/getNotification", authMiddleware, getNotifications); 
router.put("/:notificationId/read", authMiddleware, markNotificationAsRead); 

export default router;
