const transporter = require('../config/smtp.config');
const { welcomeTemplate, otpTemplate, purchaseTemplate, passwordChangedTemplate, paymentFailedTemplate } = require('../templates/email.templates');
const logger = require('../utils/logger');

/**
 * Production Mail Service
 * Clean, modular architecture for high-performance transactional emails.
 */

// Use EMAIL_FROM for the public sender identity (must be verified in Brevo)
const SENDER = `"CV TECH" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`;

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
 * Password Reset Confirmation Trigger
 */
exports.sendPasswordChangedEmail = async (email) => {
    return await sendMail({
        to: email,
        subject: "Security Alert — Access Key Updated",
        html: passwordChangedTemplate(),
        text: "Your CV TECH account password has been successfully updated."
    });
};

/**
 * Purchase Success Email Trigger (Grouped)
 */
exports.sendPurchaseMail = async (email, projects, orderId) => {
    return await sendMail({
        to: email,
        subject: "Asset Deployment Complete — Purchase Confirmed",
        html: purchaseTemplate(projects, orderId),
        text: `Your purchase for ${projects.length} project(s) is confirmed. Order ID: ${orderId}.`
    });
};

/**
 * Payment Failure Email Trigger
 */
exports.sendPaymentFailedMail = async (email, orderId, reason) => {
    return await sendMail({
        to: email,
        subject: "Transaction Interrupted — CV TECH Payment Alert",
        html: paymentFailedTemplate(orderId, reason),
        text: `Your transaction (Order ID: ${orderId}) could not be completed. Reason: ${reason}`
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
