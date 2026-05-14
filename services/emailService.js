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
 * Optimized for Render's network architecture with extended timeout buffers.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false, // STARTTLS logic
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false,
            family: 4 
        }
    });
};

const transporter = createTransporter();

const VERIFIED_SENDER = {
    name: "CV TECH",
    address: "gmac010102@gmail.com"
};

/**
 * High-Performance Email Dispatch
 * Stripped of complex retries to prevent frontend timeout.
 */
const sendMail = async (mailOptions) => {
    try {
        console.log(`📨 [SMTP] Initiating dispatch to: ${mailOptions.to}`);
        const info = await transporter.sendMail({
            ...mailOptions,
            from: VERIFIED_SENDER
        });
        console.log(`✅ [SMTP] DISPATCH SUCCESS! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ [SMTP] DISPATCH FAULT:`, error.message);
        throw error;
    }
};

exports.verifySmtp = () => {
    transporter.verify((error) => {
        if (error) {
            console.error("❌ SMTP SYSTEM FAULT:", error.message);
        } else {
            console.log("✅ SMTP SERVER READY");
        }
    });
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const info = await sendMail({
            to: email,
            subject: "Welcome to CVTECH — Identity Registered Successfully",
            html: welcomeTemplate(name),
            text: `Welcome to CVTECH, ${name}. Your identity has been successfully registered.`
        });
        return !!info;
    } catch (error) {
        return false;
    }
};

exports.sendOtpEmail = async (email, otp) => {
    try {
        const info = await sendMail({
            to: email,
            subject: "Access Recovery — Verification Code",
            html: otpTemplate(otp),
            text: `Your CVTECH authorization code is: ${otp}. It will expire in 5 minutes.`
        });
        return !!info;
    } catch (error) {
        return false;
    }
};

exports.sendPasswordChangedEmail = async (email) => {
    try {
        const info = await sendMail({
            to: email,
            subject: "Your CVTECH Access Key Was Updated",
            html: passwordChangedTemplate(),
            text: `Your CVTECH account password has been successfully updated.`
        });
        return !!info;
    } catch (error) {
        return false;
    }
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    try {
        const info = await sendMail({
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
            text: `Deployment complete for Order: ${orderData.orderId}. Your asset is ready.`
        });
        return !!info;
    } catch (error) {
        return false;
    }
};
