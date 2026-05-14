const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * Optimized SMTP Transporter Factory
 * Forces IPv4 and includes extended timeouts for production stability on Render.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        requireTLS: true,
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
 * Retry Logic for SMTP Dispatch
 * Attempts a single retry after a 3-second delay if a timeout occurs.
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        if (retryCount === 0 && (error.code === 'ETIMEDOUT' || error.command === 'CONN')) {
            logger.warn(`[SMTP] Timeout detected. Retrying in 3s...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
            return await transporter.sendMail(mailOptions);
        }
        logger.error("SMTP FULL ERROR:", error);
        throw error;
    }
};

// Removed transporter.verify() from startup to prevent deployment blocking.

exports.verifySmtp = () => {
    // Legacy export maintained to avoid breaking server.js imports, 
    // but now performing a non-blocking check if called.
    transporter.verify((error) => {
        if (error) {
            logger.error("✅ SMTP CHECK FAILED:", error.message);
        } else {
            logger.info("✅ SMTP SERVER READY");
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
