const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // Added for manual verification in refresh
const logger = require('../utils/logger');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendWelcomeEmail, sendOtpEmail, sendPasswordChangedEmail } = require('../services/emailService');
const { generateOTP, saveOTP, verifyOTP } = require('../services/otpService');
const OTP = require('../models/OTP');

/**
 * ReCAPTCHA Verification Engine Utility
 */
const verifyRecaptcha = async (token) => {
    if (process.env.NODE_ENV === 'development') {
        logger.info('🛡️ reCAPTCHA verification bypassed for development environment.');
        return true;
    }
    if (!token) return false;
    try {
        const secret = process.env.RECAPTCHA_SECRET_KEY;
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${secret}&response=${token}`);
        return response.data.success;
    } catch(err) {
        logger.error(`ReCAPTCHA validation ping failed structurally: ${err.message}`);
        return false;
    }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 */
const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, recaptchaToken } = req.body;

        if (!firstName || !lastName || !email || !password || !recaptchaToken) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
        }

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            logger.warn(`Automated entity blocked at signup registration attempting email: ${email}`);
            return res.status(403).json({ success: false, message: 'Automated traversal blocked.'});
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });

        const { createNotification } = require('./notificationController');
        await createNotification({
            recipientRole: 'admin',
            type: 'alert',
            title: '👤 New User Registered',
            message: `${firstName} ${lastName} has joined CV TECH.`,
            link: '/admin/users'
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Background: Send welcome email and notification
        sendWelcomeEmail(user.email, user.firstName).catch(err => logger.error(`Welcome email failure: ${err.message}`));
        
        await createNotification({
            recipientId: user._id,
            type: 'alert',
            title: 'Welcome to CVTECH',
            message: 'Identity registered successfully. Your personal workspace is ready.',
            link: '/dashboard'
        });

        res.status(201).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error(`Signup fault: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error during signup' });
    }
};

/**
 * @desc    Authenticate User & get tokens
 * @route   POST /api/auth/login
 */
const login = async (req, res) => {
    try {
        const { email, password, recaptchaToken } = req.body;

        const isDev = process.env.NODE_ENV === 'development';
        
        if (!email || !password || (!recaptchaToken && !isDev)) {
            return res.status(400).json({ success: false, message: 'Please provide email, password and reCAPTCHA token.' });
        }

        const isHuman = await verifyRecaptcha(recaptchaToken);
        if (!isHuman) {
            logger.warn(`Automated script attack repelled on identity mapping: ${email}`);
            return res.status(403).json({ success: false, message: 'Bot protection engaged.'});
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({
            success: true,
            accessToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error(`Authentication structural drop: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server Error during login' });
    }
};

/**
 * @desc    Obtain a new access token using a valid refresh token from body
 * @route   POST /api/auth/refresh
 */
const refreshTokenHandler = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'No refresh token provided' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        const accessToken = generateAccessToken(user);

        res.status(200).json({ 
            success: true, 
            accessToken,
            message: 'Access token refreshed successfully' 
        });

    } catch (error) {
        logger.error(`Token rotation mapping drop: ${error.message}`);
        return res.status(403).json({ success: false, message: 'Invalid or Expired Refresh Token' });
    }
};

/**
 * @desc    Logout User
 * @route   POST /api/auth/logout
 */
const logout = (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ success: true, message: 'Successfully logged out. Identity discarded.' });
};

/**
 * @desc    Forgot Password - Send OTP
 * @route   POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        console.log(`[AUTH] ForgotPassword request received for: ${email}`);

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide registered email.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            console.warn(`[AUTH] ForgotPassword: User not found for email: ${email}`);
            return res.status(404).json({ success: false, message: 'Identity mapping not found.' });
        }

        console.log(`[AUTH] User found: ${user.firstName}. Generating security code...`);
        const otp = generateOTP();
        
        console.log(`[AUTH] Saving OTP to secure storage...`);
        await saveOTP(email, otp);
        
        console.log(`[AUTH] Attempting to dispatch OTP email via SMTP...`);
        const emailSent = await sendOtpEmail(email, otp);

        if (!emailSent) {
            console.error(`[AUTH] OTP dispatch failed for: ${email}`);
            return res.status(500).json({ success: false, message: 'Failed to send OTP email. Recovery protocol halted.' });
        }

        console.log(`[AUTH] Recovery protocol successful. OTP dispatched to: ${email}`);
        res.status(200).json({ 
            success: true, 
            message: 'Authorization code dispatched to your registered email.' 
        });
    } catch (error) {
        console.error(`[AUTH] CRITICAL FAULT in forgotPassword:`, error);
        logger.error(`Forgot password flow interrupted: ${error.message}`);
        res.status(500).json({ success: false, message: 'Recovery protocol failure.' });
    }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and code are required.' });
        }

        const isValid = await verifyOTP(email, otp);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Incorrect or expired authorization code.' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Identity verified. You may now reset your access key.' 
        });
    } catch (error) {
        logger.error(`OTP verification fault: ${error.message}`);
        res.status(500).json({ success: false, message: 'Verification engine failure.' });
    }
};

/**
 * @desc    Reset Password
 * @route   POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and new password are required.' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Identity no longer exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Send confirmation email
        sendPasswordChangedEmail(email).catch(err => logger.error(`Reset confirmation email failure: ${err.message}`));

        // Trigger notification
        const { createNotification } = require('./notificationController');
        await createNotification({
            recipientId: user._id,
            type: 'alert',
            title: 'Access Key Updated',
            message: 'Your login credentials have been changed successfully.',
            link: '/dashboard'
        });

        res.status(200).json({ 
            success: true, 
            message: 'Access key updated successfully. Login with your new credentials.' 
        });
    } catch (error) {
        logger.error(`Reset password fault: ${error.message}`);
        res.status(500).json({ success: false, message: 'Protocol reset failure.' });
    }
};

module.exports = {
    signup,
    login,
    refreshTokenHandler,
    logout,
    forgotPassword,
    verifyOtp,
    resetPassword
};
