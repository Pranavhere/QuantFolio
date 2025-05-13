const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const config = require('../config/config');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Auth service is running' });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ 
            message: 'Invalid token',
            error: error.message 
        });
    }
};

// Validate token and return user data
router.get('/validate', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            username,
            email,
            password: await bcrypt.hash(password, 10)
        });

        await user.save();

        const payload = { userId: user._id };
        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
        console.log('Generated token:', token);

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email 
            } 
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = { userId: user._id };
        const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
        console.log('Generated token:', token);

        res.json({ 
            token, 
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Server error',
            error: error.message 
        });
    }
});

module.exports = router;