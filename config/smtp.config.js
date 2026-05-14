const nodemailer = require('nodemailer');

/**
 * SMTP Configuration Utility (Render Optimized)
 * Using Port 2525 to bypass Render's outbound restrictions on 587/465.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 2525, 
    secure: false, // STARTTLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
        family: 4 // Force IPv4 to resolve Render network conflicts
    },
    connectionTimeout: 15000, // 15s
    greetingTimeout: 15000,
    socketTimeout: 15000,
});

module.exports = transporter;
