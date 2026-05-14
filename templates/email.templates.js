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
        h1 { font-size: 22px; font-weight: 900; margin: 0 0 16px; text-transform: uppercase; }
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

exports.purchaseTemplate = (projectName, orderId) => getBaseTemplate(`
    <h1>Asset Deployment Complete</h1>
    <p>Your acquisition is confirmed. Your professional asset is now ready for deployment.</p>
    <div style="background: #111111; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; color: #ffffff;"><strong>Project:</strong> ${projectName}</p>
        <p style="margin: 8px 0 0; font-size: 12px;"><strong>Order ID:</strong> ${orderId}</p>
    </div>
    <a href="${process.env.FRONTEND_URL}/dashboard/my-projects" class="button">Access My Assets</a>
    <p style="margin-top: 32px; font-size: 12px;">For technical deployment support: <span class="text-primary">${process.env.ADMIN_EMAIL}</span></p>
`);
