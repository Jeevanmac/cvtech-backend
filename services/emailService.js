const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * High-Availability SMTP Transporter Factory (Brevo Optimized)
 * Attempting Port 2525 as a bypass for potential cloud provider port blocking.
 * Port 2525 is Brevo's secondary SMTP relay port designed for cloud environments.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: 2525, // Brevo secondary port often open when 587/465 are throttled
        secure: false, // Port 2525 uses STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 45000, // Increased to 45s for cold start environments
        greetingTimeout: 45000,
        socketTimeout: 45000,
        tls: {
            rejectUnauthorized: false,
            family: 4 // Force IPv4 for Render stability
        }
    });
};

const transporter = createTransporter();

/**
 * Robust Email Dispatch with Aggressive Retry Logic
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
    try {
        return await transporter.sendMail(mailOptions);
    } catch (error) {
        const errorMessage = error.message || String(error);
        
        // Retry on any timeout or connection-related failure
        if (retryCount === 0 && (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT' || error.command === 'CONN')) {
            logger.warn(`[SMTP] Attempting recovery from: ${errorMessage}. Retrying in 8s...`);
            await new Promise(resolve => setTimeout(resolve, 8000));
            return await transporter.sendMail(mailOptions);
        }
        
        logger.error(`[SMTP] CRITICAL FAILURE: ${errorMessage}`, { code: error.code, command: error.command });
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
            logger.info("✅ SMTP SERVER READY (PORT 2525)");
            console.log("✅ SMTP SERVER READY (PORT 2525)");
        }
    });
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const success = await sendMailWithRetry({
            from: `"CVTECH Ecosystem" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Welcome to CVTECH — Identity Registered Successfully",
            html: welcomeTemplate(name),
        });
        return !!success;
    } catch (error) {
        logger.error(`[EMAIL] Welcome email failure for ${email}: ${error.message}`);
        return false;
    }
};

exports.sendOtpEmail = async (email, otp) => {
    try {
        const success = await sendMailWithRetry({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Access Recovery — Verification Code",
            html: otpTemplate(otp),
        });
        return !!success;
    } catch (error) {
        logger.error(`[EMAIL] OTP delivery failure for ${email}: ${error.message}`);
        return false;
    }
};

exports.sendPasswordChangedEmail = async (email) => {
    try {
        const success = await sendMailWithRetry({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Access Key Was Updated",
            html: passwordChangedTemplate(),
        });
        return !!success;
    } catch (error) {
        logger.error(`[EMAIL] Password change notification failure for ${email}: ${error.message}`);
        return false;
    }
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    try {
        const success = await sendMailWithRetry({
            from: `"CVTECH Assets" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
        });
        return !!success;
    } catch (error) {
        logger.error(`[EMAIL] Purchase email delivery failure for ${email}: ${error.message}`);
        return false;
    }
};
