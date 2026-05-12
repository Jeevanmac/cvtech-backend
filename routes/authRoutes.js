const express = require('express');
const router = express.Router();
const { signup, login, refreshTokenHandler, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiter');
const { validateInput, authSchema } = require('../middleware/validate');

// Public routes
router.post('/signup', strictLimiter, validateInput(authSchema, true), signup);
router.post('/login', strictLimiter, validateInput(authSchema, false), login);
router.post('/refresh', refreshTokenHandler);

// Protected routes
router.post('/logout', protect, logout);

module.exports = router;
