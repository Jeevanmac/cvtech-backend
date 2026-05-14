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
        port: 2525, 
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
 * Robust Email Dispatch with Aggressive Retry Logic and Detailed Logging
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
    try {
        console.log(`📨 [SMTP] Dispatching email to: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [SMTP] EMAIL SENT SUCCESSFULLY! ID: ${info.messageId}`);
        logger.info(`[SMTP] Dispatched: ${info.messageId} to ${mailOptions.to}`);
        return info;
    } catch (error) {
        const errorMessage = error.message || String(error);
        
        if (retryCount === 0 && (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT' || error.command === 'CONN')) {
            console.warn(`⚠️ [SMTP] Timeout/Connection failure. Retrying in 8s...`);
            logger.warn(`[SMTP] Attempting recovery from: ${errorMessage}. Retrying in 8s...`);
            await new Promise(resolve => setTimeout(resolve, 8000));
            return await sendMailWithRetry(mailOptions, 1);
        }
        
        console.error(`❌ [SMTP] CRITICAL DISPATCH FAILURE for ${mailOptions.to}:`, error);
        logger.error(`[SMTP] CRITICAL DISPATCH FAILURE for ${mailOptions.to}: ${errorMessage}`, { code: error.code, command: error.command });
        throw error;
    }
};

/**
 * Health Check
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
        const info = await sendMailWithRetry({
            from: `"CVTECH Ecosystem" <${process.env.SMTP_USER}>`,
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
        console.log(`[DEBUG] Preparing OTP Email dispatch. Target: ${email}, Code: ${otp}`);
        const info = await sendMailWithRetry({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
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
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
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
            from: `"CVTECH Assets" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
        });
        return !!info;
    } catch (error) {
        return false;
    }
};
