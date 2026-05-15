/**
 * Clean HTML Email Templates for CV TECH
 * Optimized for mobile, dark/light modes, and branding consistency.
 */

const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Inter', -apple-system, sans-serif; background-color: #050505; color: #ffffff; }
        .wrapper { width: 100%; padding: 40px 0; background-color: #000000; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #a855f7, #6b21a8); padding: 40px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; color: #ffffff; text-transform: uppercase; }
        .content { padding: 40px; }
        .footer { padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; }
        .button { display: inline-block; padding: 14px 28px; background: #a855f7; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; margin-top: 24px; }
        .otp-box { background: #111111; border: 1px solid #a855f7; padding: 20px; border-radius: 12px; text-align: center; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #a855f7; margin: 24px 0; }
        h1 { font-size: 22px; font-weight: 900; margin: 0 0 16px; text-transform: uppercase; color: #ffffff; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
        .text-white { color: #ffffff; }
        .text-primary { color: #a855f7; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header"><div class="logo">CV TECH</div></div>
            <div class="content">${content}</div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} CV TECH Architecture. Assets provided by professional infrastructure.<br>
                Support: ${process.env.ADMIN_PHONE || '+91 9876543210'}
            </div>
        </div>
    </div>
</body>
</html>
`;

exports.welcomeTemplate = (name) => getBaseTemplate(`
    <h1>Welcome to the Ecosystem</h1>
    <p>Hello <span class="text-white">${name}</span>,</p>
    <p>Your identity has been successfully registered. You now have full access to our premium suite of architectural assets and professional workspaces.</p>
    <a href="${process.env.FRONTEND_URL}/dashboard" class="button">Go to Dashboard</a>
    <p style="margin-top: 32px; font-size: 12px;">Need assistance? Our support is ready at <span class="text-primary">${process.env.ADMIN_EMAIL}</span></p>
`);

exports.otpTemplate = (otp) => getBaseTemplate(`
    <h1>Access Recovery</h1>
    <p>Use the secure authorization code below to complete your identity verification. This code is sensitive and single-use.</p>
    <div class="otp-box">${otp}</div>
    <p style="color: #ef4444; font-size: 12px; font-weight: 700;">SECURITY ALERT: This code expires in 5 minutes.</p>
    <p style="font-size: 12px;">If you did not initiate this request, please secure your account immediately.</p>
`);

/**
 * Password Reset Confirmation Template
 */
exports.passwordChangedTemplate = () => getBaseTemplate(`
    <h1>Access Key Updated</h1>
    <p>Your CV TECH account password has been successfully updated. All previous sessions have been terminated for security.</p>
    <div style="background: #111111; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0; color: #ffffff; font-weight: bold;">Security Status: Verified</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Account</a>
    <p style="margin-top: 32px; font-size: 12px;">If you did not make this change, contact support immediately.</p>
`);

exports.purchaseTemplate = (projects, orderId) => getBaseTemplate(`
    <h1 style="color: #ffffff; font-weight: 900;">Asset Deployment Complete</h1>
    <p>Your acquisition is confirmed. Your professional assets are now ready for deployment in your workspace.</p>
    
    <div style="background: #111111; padding: 24px; border-radius: 16px; margin: 24px 0; border: 1px solid #1e293b;">
        <h3 style="margin: 0 0 12px; font-size: 12px; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">Acquired Assets:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #a855f7; font-weight: bold;">
            ${projects.map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}
        </ul>
        <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #1e293b; font-size: 11px;">
            <strong style="color: #ffffff; font-weight: 900;">Order ID:</strong> <span style="color: #ffffff; font-weight: bold;">${orderId}</span>
        </div>
    </div>

    <h3 style="font-size: 14px; color: #ffffff;">DOWNLOAD INSTRUCTIONS:</h3>
    <ol style="font-size: 13px; color: #94a3b8; padding-left: 20px;">
        <li>Login to your <span class="text-white">CV TECH Dashboard</span></li>
        <li>Navigate to the <span class="text-primary">"My Projects"</span> section</li>
        <li>Select your project and trigger the secure extraction</li>
    </ol>

    <a href="${process.env.FRONTEND_URL}/dashboard/my-projects" class="button">Access My Assets</a>
    
    <p style="margin-top: 32px; font-size: 11px; border-top: 1px solid #1e293b; pt-4;">
        For technical deployment support: <span class="text-primary">${process.env.ADMIN_EMAIL}</span>
    </p>
`);

/**
 * Payment Failure Template
 */
exports.paymentFailedTemplate = (orderId, reason) => getBaseTemplate(`
    <h1 style="color: #ef4444;">Transaction Interrupted</h1>
    <p>We were unable to complete your purchase (Order: <span class="text-white">${orderId}</span>). Your account has not been charged, or a refund will be initiated if a deduction occurred.</p>
    
    <div style="background: #111111; padding: 24px; border-radius: 16px; margin: 24px 0; border-left: 4px solid #ef4444;">
        <p style="margin: 0; font-weight: bold; color: #ffffff;">Status: Payment Failed</p>
        <p style="margin: 8px 0 0; font-size: 12px;">Reason: ${reason || 'Bank declined or validation mismatch'}</p>
    </div>

    <p>Please try again or use a different payment method. If you believe this is an error, please contact our support team.</p>
    
    <a href="${process.env.FRONTEND_URL}/cart" class="button">Return to Cart</a>
    
    <p style="margin-top: 32px; font-size: 11px;">
        Support Terminal: <span class="text-primary">${process.env.ADMIN_EMAIL}</span>
    </p>
`);
