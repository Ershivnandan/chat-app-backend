import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'; 
import User from '../models/user.modal.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID, 
    clientSecret: process.env.GOOGLE_CLIENT_SECRET, 
    callbackURL: `${process.env.AZURE_API}/api/users/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
    try {
        
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
        
            return done(null, existingUser);
        }

       
        const newUser = await new User({
            username: profile.displayName,
            googleId: profile.id,
            email: profile.emails[0].value,
            password: null, 
        }).save();

        done(null, newUser);  
    } catch (error) {
        console.error('Error during Google login:', error);  
        done(error, null); 
    }
}));


passport.serializeUser((user, done) => {
    done(null, user.id);  
});


passport.deserializeUser((id, done) => {
  
    User.findById(id).then(user => {
        done(null, user);  
    }).catch(err => {
        done(err, null);  
    });
});
