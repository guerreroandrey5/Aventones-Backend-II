const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Make sure to import your User model
module.exports = router;

const { ridePost, rideDelete, ridePatch } = require('../controller/rideController');
const { requestPost, requestDelete } = require('../controller/requestController');
const { userDelete, userPatch,  getUserCredentials} = require('../controller/userController');

router.post('/ride/', ridePost);
router.delete('/ride/', rideDelete);
router.patch('/ride/', ridePatch);

router.delete('/user', userDelete);
router.patch('/user', userPatch);


// Add the patch route for updating status
router.patch('/user/:id/status', async (req, res) => {
    try {
        const userId = req.params.id;
        const { statusUser } = req.body;

        if (!statusUser) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { statusUser: statusUser }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User status updated successfully', updatedUser });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



router.post('/reqaventon', requestPost);
router.delete('/reqaventon', requestDelete);

// Google OAuth login route
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Successful authentication, redirect to the appropriate page
    res.redirect('/register'); // You can customize this redirect
  }
);

// Google Login using Google ID
router.post('/auth/google', async (req, res) => {
    const { googleId } = req.body;

    try {
        // Find the user by Google ID stored in the password field
        const user = await User.findOne({ password: googleId });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Create a JWT token for the user
        const payload = {
            userId: user._id,
            isDriver: user.isDriver,
            agent: req.get('user-agent')
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 86400 });

        res.status(200).json({ token });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

