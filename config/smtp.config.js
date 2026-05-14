const nodemailer = require('nodemailer');

/**
 * SMTP Configuration Utility
 * Centralized transporter instance for production-grade reliability on Render.
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
    // Production stability settings
    connectionTimeout: 10000, // 10s
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

module.exports = transporter;
