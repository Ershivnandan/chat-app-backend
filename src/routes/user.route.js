import express from "express";
import {
  login,
  signup,
  getUser,
  updateProfile,
  googleAuthCallback,
  getUserByName,
} from "../controllers/authController.js";
import passport from "passport";
import authMiddleware from "../middleware/auth.middleware.js";
import upload from "../utils/imageKit.js"; 

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleAuthCallback
);

router.put(
  "/update-profile",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile
);

router.get('/getuserbyname', authMiddleware, getUserByName);

router.get("/getUser", authMiddleware, getUser);

export default router;
