const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * CVTECH Branded SMTP Infrastructure
 * Optimized for Render's cloud network using Brevo's High-Availability Port 2525.
 */

// Centralized Verified Identity
const BRAND_IDENTITY = {
    name: "CV TECH",
    address: "gmac010102@gmail.com"
};

// Transporter Instance with production-grade timeout buffers
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525,
    secure: false, // TLS is upgraded via STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
        family: 4 // Enforce IPv4 for predictable Render routing
    },
    connectionTimeout: 20000, // 20s
    greetingTimeout: 20000,
    socketTimeout: 20000,
});

/**
 * Startup Readiness Check
 * Validates the SMTP relay path during server boot.
 */
exports.verifySmtp = () => {
    transporter.verify((error) => {
        if (error) {
            console.error('❌ [SMTP-INFRA] Connection Failed:', error.message);
            logger.error(`SMTP Infrastructure Fault: ${error.message}`);
        } else {
            console.log('✅ [SMTP-INFRA] Brevo Relay Connected (Port 2525)');
            logger.info('SMTP Infrastructure Ready');
        }
    });
};

/**
 * Internal Dispatcher Engine
 * Handles common mailing logic with explicit error logging.
 */
const dispatchEmail = async (options) => {
    try {
        console.log(`📨 [MAIL-ENGINE] Dispatching: ${options.subject} -> ${options.to}`);
        const info = await transporter.sendMail({
            from: BRAND_IDENTITY,
            ...options
        });
        console.log(`✅ [MAIL-ENGINE] Successfully delivered ID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ [MAIL-ENGINE] Fault detected during delivery to ${options.to}:`, error.message);
        logger.error(`Mail Engine Fault [${options.to}]: ${error.message}`);
        return { success: false, error: error.message };
    }
};

/**
 * Transactional Email Actions
 */

exports.sendWelcomeEmail = async (email, name) => {
    return await dispatchEmail({
        to: email,
        subject: "Welcome to CVTECH — Account Activated",
        text: `Welcome to the ecosystem, ${name}. Your account is ready.`,
        html: welcomeTemplate(name)
    });
};

exports.sendOtpEmail = async (email, otp) => {
    return await dispatchEmail({
        to: email,
        subject: "CVTECH Security — Authorization Code",
        text: `Your security code is ${otp}. It will expire in 5 minutes.`,
        html: otpTemplate(otp)
    });
};

exports.sendPasswordChangedEmail = async (email) => {
    return await dispatchEmail({
        to: email,
        subject: "CVTECH Alert — Access Key Updated",
        text: "Your password has been changed successfully. Your account is secure.",
        html: passwordChangedTemplate()
    });
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    return await dispatchEmail({
        to: email,
        subject: "CVTECH Asset Deployment — Purchase Success",
        text: `Your purchase (Order: ${orderData.orderId}) is confirmed and ready for deployment.`,
        html: purchaseTemplate(orderData, adminContact)
    });
};
