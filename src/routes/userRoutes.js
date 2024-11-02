import express from 'express';
import { login, signup } from '../controllers/authController.js';
import passport from 'passport';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);


router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      
        res.redirect('/'); 
    }
);

export default router;
