import User from '../models/user.modal.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Signup Controller
export const signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Login Controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUser = async(req, res)=>{
    try {
        const userData = req.user; 
        const userId = req.user.id; 
        const user = await User.findById(userId).select('-password'); 

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error });
    }
}

export const updateProfile = async (req, res) => {
    try {
        const { mobileNumber } = req.body;
        let profileImageUrl = null;

        if (req.file) {
            profileImageUrl = await uploadImageToImageKit(req.file);
        }

        const userId = req.user.id;
        const updateData = {
            ...(mobileNumber && { mobileNumber }),
            ...(profileImageUrl && { profileImage: profileImageUrl }),
        };

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error });
    }
};

export const googleAuthCallback = async (req, res) => {
    try {
        const { id, displayName, emails, photos } = req.user; 
        const email = emails[0].value;
        const profileImage = photos[0].value;

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                username: displayName,
                email,
                googleId: id,
                profileImage,
            });
            await user.save();
        }

        res.redirect('/'); 
    } catch (error) {
        res.status(500).json({ message: 'Error during Google login', error });
    }
};
