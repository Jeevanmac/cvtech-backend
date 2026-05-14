const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * Hardened SMTP Transporter Factory (Brevo Optimized)
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 45000,
        greetingTimeout: 45000,
        socketTimeout: 45000,
        tls: {
            rejectUnauthorized: false,
            family: 4 
        }
    });
};

const transporter = createTransporter();

/**
 * Verified Sender Identity
 * Must match the verified sender in the Brevo dashboard to ensure delivery to Gmail.
 */
const VERIFIED_SENDER = {
    name: "CV TECH",
    address: "gmac010102@gmail.com"
};

/**
 * Robust Email Dispatch with Aggressive Retry Logic
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
    try {
        console.log(`📨 [SMTP] Dispatching to: ${mailOptions.to} | Using Identity: ${mailOptions.from.address}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [SMTP] EMAIL SENT! ID: ${info.messageId}`);
        logger.info(`[SMTP] Dispatched: ${info.messageId} to ${mailOptions.to}`);
        return info;
    } catch (error) {
        const errorMessage = error.message || String(error);
        if (retryCount === 0 && (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT')) {
            console.warn(`⚠️ [SMTP] Handshake stalled. Retrying in 8s...`);
            await new Promise(resolve => setTimeout(resolve, 8000));
            return await transporter.sendMail(mailOptions);
        }
        console.error(`❌ [SMTP] FATAL ERROR for ${mailOptions.to}:`, error);
        throw error;
    }
};

/**
 * Startup Health Check
 */
exports.verifySmtp = () => {
    transporter.verify((error) => {
        if (error) {
            console.error("❌ SMTP SERVER FAILED:", error.message);
        } else {
            console.log("✅ SMTP SERVER READY (2525/587)");
        }
    });
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const info = await sendMailWithRetry({
            from: VERIFIED_SENDER,
            to: email,
            subject: "Welcome to CVTECH — Identity Registered Successfully",
            html: welcomeTemplate(name),
        });
        return !!info;
    } catch (error) {
        return false;
    }
};

exports.sendOtpEmail = async (email, otp) => {
    try {
        const info = await sendMailWithRetry({
            from: VERIFIED_SENDER,
            to: email,
            subject: "Access Recovery — Verification Code",
            html: otpTemplate(otp),
        });
        return !!info;
    } catch (error) {
        return false;
    }
};

exports.sendPasswordChangedEmail = async (email) => {
    try {
        const info = await sendMailWithRetry({
            from: VERIFIED_SENDER,
            to: email,
            subject: "Your CVTECH Access Key Was Updated",
            html: passwordChangedTemplate(),
        });
        return !!info;
    } catch (error) {
        return false;
    }
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    try {
        const info = await sendMailWithRetry({
            from: VERIFIED_SENDER,
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
        });
        return !!info;
    } catch (error) {
        return false;
    }
};
