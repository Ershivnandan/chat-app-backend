import express from 'express';
import { login, signup, getUser } from '../controllers/authController.js';
import passport from 'passport';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      
        res.redirect('/'); 
    }
);

router.get('/getUser', authMiddleware, getUser);

export default router;
