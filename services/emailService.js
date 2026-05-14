const logger = require('../utils/logger');
const nodemailer = require('nodemailer');
const { 
    welcomeTemplate, 
    otpTemplate, 
    passwordChangedTemplate, 
    purchaseTemplate 
} = require('../utils/emailTemplates');

// Force IPv4 for Gmail SMTP to resolve Render ENETUNREACH issues
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
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

// Verify SMTP connection on startup
const verifySmtp = async () => {
    try {
        await transporter.verify();
        logger.info('✅ SMTP READY');
        console.log('✅ SMTP READY');
    } catch (error) {
        logger.error(`❌ SMTP FAILED: ${error.message}`);
        console.error('❌ SMTP FAILED:', error.message);
    }
};

exports.verifySmtp = verifySmtp;

exports.sendWelcomeEmail = async (email, name) => {
    try {
        await transporter.sendMail({
            from: `"CVTECH Ecosystem" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Welcome to CVTECH — Identity Registered Successfully",
            html: welcomeTemplate(name),
        });
        logger.info(`[EMAIL] Welcome email successfully dispatched to: ${email}`);
        return true;
    } catch (error) {
        logger.error(`[EMAIL] Welcome email failure for ${email}: ${error.message}`);
        return false;
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
        return true;
    } catch (error) {
        logger.error(`[EMAIL] OTP delivery failure for ${email}: ${error.message}`);
        return false;
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
        return true;
    } catch (error) {
        logger.error(`[EMAIL] Password change notification failure for ${email}: ${error.message}`);
        return false;
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
        return true;
    } catch (error) {
        logger.error(`[EMAIL] Purchase email delivery failure for ${email}: ${error.message}`);
        return false;
    }
};
