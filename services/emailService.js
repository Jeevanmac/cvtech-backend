const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * Standard Brevo SMTP Transporter Configuration
 * Stripped of all complex retry logic for maximum deployment stability.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

/**
 * Startup Verification
 */
exports.verifySmtp = () => {
    transporter.verify((error, success) => {
        if (error) {
            console.error('SMTP VERIFY FAILED:', error);
            logger.error(`SMTP VERIFY FAILED: ${error.message}`);
        } else {
            console.log('SMTP SERVER READY');
            logger.info('SMTP SERVER READY');
        }
    });
};

/**
 * Core Mail Dispatch Functions
 * Using direct Nodemailer sendMail() with no internal retries.
 */

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const info = await transporter.sendMail({
            from: `"CV TECH" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Welcome to CVTECH — Identity Registered Successfully',
            text: `Welcome to CVTECH, ${name}. Your identity has been successfully registered.`,
            html: welcomeTemplate(name),
        });
        console.log('✅ WELCOME EMAIL SENT:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ WELCOME MAIL SEND FAILED:', error);
        return false;
    }
};

exports.sendOtpEmail = async (email, otp) => {
    try {
        console.log('📨 Sending OTP email to:', email);
        const info = await transporter.sendMail({
            from: `"CV TECH" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Access Recovery — Verification Code',
            text: `Your OTP code is ${otp}. It will expire in 5 minutes.`,
            html: otpTemplate(otp),
        });
        console.log('✅ OTP EMAIL SENT:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ OTP MAIL SEND FAILED:', error);
        return false;
    }
};

exports.sendPasswordChangedEmail = async (email) => {
    try {
        const info = await transporter.sendMail({
            from: `"CV TECH" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your CVTECH Access Key Was Updated',
            text: `Your CVTECH account password has been successfully updated.`,
            html: passwordChangedTemplate(),
        });
        console.log('✅ PASSWORD CHANGED EMAIL SENT:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ PASSWORD CHANGED MAIL SEND FAILED:', error);
        return false;
    }
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    try {
        const info = await transporter.sendMail({
            from: `"CV TECH" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Your CVTECH Asset Deployment Is Complete',
            text: `Deployment complete for Order: ${orderData.orderId}. Your asset is ready.`,
            html: purchaseTemplate(orderData, adminContact),
        });
        console.log('✅ PURCHASE EMAIL SENT:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ PURCHASE MAIL SEND FAILED:', error);
        return false;
    }
};
