const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

exports.sendWelcomeEmail = async (email, name) => {
    try {
        await transporter.sendMail({
            from: `"CVTECH Ecosystem" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Welcome to CVTECH — Identity Registered Successfully",
            html: welcomeTemplate(name),
        });
        logger.info(`[EMAIL] Welcome email successfully dispatched to: ${email}`);
    } catch (error) {
        logger.error(`[EMAIL] Welcome email failure for ${email}: ${error.message}`);
    }
};

exports.sendOtpEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Access Recovery — Verification Code",
            html: otpTemplate(otp),
        });
        logger.info(`[EMAIL] Security OTP successfully dispatched to: ${email}`);
    } catch (error) {
        logger.error(`[EMAIL] OTP delivery failure for ${email}: ${error.message}`);
    }
};

exports.sendPasswordChangedEmail = async (email) => {
    try {
        await transporter.sendMail({
            from: `"CVTECH Security" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Access Key Was Updated",
            html: passwordChangedTemplate(),
        });
        logger.info(`[EMAIL] Password reset confirmation dispatched to: ${email}`);
    } catch (error) {
        logger.error(`[EMAIL] Password change notification failure for ${email}: ${error.message}`);
    }
};

exports.sendPurchaseEmail = async (email, orderData, adminContact) => {
    try {
        await transporter.sendMail({
            from: `"CVTECH Assets" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your CVTECH Asset Deployment Is Complete",
            html: purchaseTemplate(orderData, adminContact),
        });
        logger.info(`[EMAIL] Purchase confirmation successfully dispatched to: ${email}`);
    } catch (error) {
        logger.error(`[EMAIL] Purchase email delivery failure for ${email}: ${error.message}`);
    }
};
