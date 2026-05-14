const transporter = require('../config/smtp.config');
const { welcomeTemplate, otpTemplate, purchaseTemplate } = require('../templates/email.templates');
const logger = require('../utils/logger');

/**
 * Production Mail Service
 * Clean, modular architecture for high-performance transactional emails.
 */

const SENDER = `"CV TECH" <${process.env.SMTP_USER}>`;

/**
 * Core Dispatcher Engine
 * Handles internal mailing logic with async/await and detailed logging.
 */
const sendMail = async ({ to, subject, html, text }) => {
    try {
        console.log(`📨 [MAIL-SERVICE] Sending to: ${to} | Subject: ${subject}`);
        
        const info = await transporter.sendMail({
            from: SENDER,
            to,
            subject,
            text: text || "Important notification from CV TECH Ecosystem.",
            html
        });

        console.log(`✅ [MAIL-SERVICE] Successfully delivered: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ [MAIL-SERVICE] Failed for ${to}:`, error.message);
        logger.error(`Mail Service Error [${to}]: ${error.message}`);
        return { success: false, error: error.message };
    }
};

/**
 * Welcome Email Trigger
 */
exports.sendWelcomeMail = async (email, name) => {
    return await sendMail({
        to: email,
        subject: "Identity Registered Successfully — Welcome to CV TECH",
        html: welcomeTemplate(name),
        text: `Welcome to CV TECH, ${name}. Your identity has been successfully registered.`
    });
};

/**
 * OTP / Recovery Email Trigger
 */
exports.sendOTPMail = async (email, otp) => {
    return await sendMail({
        to: email,
        subject: "Access Recovery — Security Authorization Code",
        html: otpTemplate(otp),
        text: `Your CV TECH authorization code is: ${otp}. It will expire in 5 minutes.`
    });
};

/**
 * Purchase Success Email Trigger
 */
exports.sendPurchaseMail = async (email, projectName, orderId) => {
    return await sendMail({
        to: email,
        subject: "Asset Deployment Complete — Purchase Confirmed",
        html: purchaseTemplate(projectName, orderId),
        text: `Your purchase for ${projectName} is confirmed. Order ID: ${orderId}.`
    });
};

/**
 * Startup Verification
 */
exports.verifyTransporter = () => {
    transporter.verify((error) => {
        if (error) {
            console.error('❌ [SMTP-CONFIG] Connection failure:', error.message);
        } else {
            console.log('✅ [SMTP-CONFIG] Relay connected and ready');
        }
    });
};
