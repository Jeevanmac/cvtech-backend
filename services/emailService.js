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
 * Switching to Port 465 with SSL for maximum stability on Render environments.
 * Forces IPv4 to resolve ENETUNREACH issues.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: 465, // Using SSL port for better bypass of potential firewalls
        secure: true, // Required for port 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false,
            family: 4 // Force IPv4
        }
    });
};

const transporter = createTransporter();

/**
 * Robust Email Dispatch with Retry Logic
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        // Detailed error logging to prevent character-splitting objects in logs
        const errorMessage = error.message || String(error);
        
        if (retryCount === 0 && (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT' || error.command === 'CONN')) {
            logger.warn(`[SMTP] Transient failure: ${errorMessage}. Retrying in 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await transporter.sendMail(mailOptions);
        }
        
        logger.error(`[SMTP] FATAL ERROR: ${errorMessage}`, { code: error.code, command: error.command });
        throw error;
    }
};

/**
 * Non-blocking Health Check
 */
exports.verifySmtp = () => {
    transporter.verify((error) => {
        if (error) {
            const msg = error.message || String(error);
            logger.error(`❌ SMTP SYSTEM FAULT: ${msg}`);
            console.error('❌ SMTP SYSTEM FAULT:', msg);
        } else {
            logger.info("✅ SMTP SERVER READY (SSL/465)");
            console.log("✅ SMTP SERVER READY (SSL/465)");
        }
    });
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        await sendMailWithRetry({
            from: `"CVTECH Ecosystem" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Welcome to CVTECH — Identity Registered Successfully",
            html: welcomeTemplate(name),
        });
        logger.info(`[EMAIL] Welcome email successfully dispatched to: ${email}`);
        return true;
    } catch (error) {
        logger.error(`[EMAIL] Welcome email failure for ${email}: ${error.message}`);
        return false;
    }
};

exports.sendOtpEmail = async (email, otp) => {
    try {
        await sendMailWithRetry({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Access Recovery — Verification Code",
            html: otpTemplate(otp),
        });
        logger.info(`[EMAIL] Security OTP successfully dispatched to: ${email}`);
        return true;
    } catch (error) {
        logger.error(`[EMAIL] OTP delivery failure for ${email}: ${error.message}`);
        return false;
    }
};

exports.sendPasswordChangedEmail = async (email) => {
    try {
        await sendMailWithRetry({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Access Key Was Updated",
            html: passwordChangedTemplate(),
        });
        logger.info(`[EMAIL] Password reset confirmation dispatched to: ${email}`);
        return true;
    } catch (error) {
        logger.error(`[EMAIL] Password change notification failure for ${email}: ${error.message}`);
        return false;
    }
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    try {
        await sendMailWithRetry({
            from: `"CVTECH Assets" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
        });
        logger.info(`[EMAIL] Purchase confirmation successfully dispatched to: ${email}`);
        return true;
    } catch (error) {
        logger.error(`[EMAIL] Purchase email delivery failure for ${email}: ${error.message}`);
        return false;
    }
};
