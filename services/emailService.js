const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * PRODUCTION SMTP CONFIGURATION AUDIT
 * Debugging potential environment variable mapping issues on Render.
 */
console.log("-----------------------------------------");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_USER:", process.env.SMTP_USER);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("-----------------------------------------");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Production stability settings
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    tls: {
        rejectUnauthorized: false,
        family: 4 // Force IPv4 to resolve Render network conflicts
    }
});

/**
 * Robust Email Dispatch with Retry Logic and ID Tracking
 */
const sendMailWithRetry = async (mailOptions, retryCount = 0) => {
    try {
        console.log(`📨 [SMTP] Dispatching email to: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [SMTP] EMAIL SENT! ID: ${info.messageId}`);
        logger.info(`[SMTP] Dispatched: ${info.messageId} to ${mailOptions.to}`);
        return info;
    } catch (error) {
        const errorMessage = error.message || String(error);
        
        if (retryCount === 0 && (errorMessage.includes('timeout') || error.code === 'ETIMEDOUT')) {
            console.warn(`⚠️ [SMTP] Connection timeout. Retrying in 5s...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return await transporter.sendMail(mailOptions);
        }
        
        console.error(`❌ [SMTP] FATAL DISPATCH ERROR for ${mailOptions.to}:`, error);
        logger.error(`[SMTP] FATAL DISPATCH ERROR: ${errorMessage}`);
        throw error;
    }
};

/**
 * Startup Health Check
 */
exports.verifySmtp = () => {
    transporter.verify((error, success) => {
        if (error) {
            console.error("❌ SMTP SERVER FAILED:", error.message);
            logger.error(`❌ SMTP SERVER FAILED: ${error.message}`);
        } else {
            console.log("✅ SMTP SERVER READY");
            logger.info("✅ SMTP SERVER READY");
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
        console.log(`[DEBUG] Preparing OTP dispatch. Target: ${email}, Code: ${otp}`);
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
