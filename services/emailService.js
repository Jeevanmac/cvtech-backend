const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

/**
 * Standard SMTP Transporter Factory
 * Reverting to Port 587 with explicit STARTTLS for maximum compatibility.
 */
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false,
            family: 4 // Force IPv4
        }
    });
};

const transporter = createTransporter();

const VERIFIED_SENDER = {
    name: "CV TECH",
    address: "gmac010102@gmail.com"
};

/**
 * Simple Email Dispatch with Detailed Error Propagation
 */
const sendMail = async (mailOptions) => {
    try {
        console.log(`📨 [SMTP] Attempting dispatch to: ${mailOptions.to}`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ [SMTP] DISPATCH SUCCESS! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ [SMTP] DISPATCH FAULT:`, error.message);
        console.error(`FULL ERROR CONTEXT:`, error);
        throw error;
    }
};

exports.verifySmtp = () => {
    transporter.verify((error) => {
        if (error) {
            console.error("❌ SMTP VERIFICATION FAILED:", error.message);
        } else {
            console.log("✅ SMTP SERVER READY (587)");
        }
    });
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const info = await sendMail({
            from: VERIFIED_SENDER,
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
        const info = await sendMail({
            from: VERIFIED_SENDER,
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
        const info = await sendMail({
            from: VERIFIED_SENDER,
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
        const info = await sendMail({
            from: VERIFIED_SENDER,
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
        });
        return !!info;
    } catch (error) {
        return false;
    }
};
