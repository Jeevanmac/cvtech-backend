const getBaseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CVTECH Notification</title>
    <style>
        :root {
            --primary: #a855f7;
            --background: #0a0a0a;
            --surface: #111111;
            --text: #ffffff;
            --text-muted: #94a3b8;
        }
        body {
            background-color: #000000;
            color: #ffffff;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0a;
            border: 1px solid #1e293b;
            border-radius: 24px;
            overflow: hidden;
            margin-top: 40px;
            margin-bottom: 40px;
        }
        .header {
            background: linear-gradient(to bottom right, #a855f7, #6b21a8);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: 900;
            letter-spacing: -2px;
            color: #ffffff;
            text-decoration: none;
            text-transform: uppercase;
        }
        .content {
            padding: 40px;
        }
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #1e293b;
        }
        .button {
            display: inline-block;
            padding: 16px 32px;
            background: #a855f7;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 16px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 2px;
            font-size: 12px;
            margin-top: 24px;
            box-shadow: 0 10px 20px -5px rgba(168, 85, 247, 0.4);
        }
        .otp-box {
            background: #111111;
            border: 1px solid #a855f7;
            padding: 24px;
            border-radius: 16px;
            text-align: center;
            font-size: 32px;
            font-weight: 900;
            letter-spacing: 8px;
            color: #a855f7;
            margin: 24px 0;
        }
        .text-primary { color: #a855f7; }
        .text-muted { color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">CVTECH</div>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} CVTECH Architecture. All rights reserved.<br>
            Professional Digital Infrastructure & Assets
        </div>
    </div>
</body>
</html>
`;

exports.welcomeTemplate = (name) => getBaseTemplate(`
    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">WELCOME TO THE ECOSYSTEM</h1>
    <p>Hello <span class="text-primary">${name}</span>,</p>
    <p>Your identity has been successfully registered within the CVTECH digital infrastructure. You now have full access to our premium suite of architectural assets and professional workspaces.</p>
    
    <div style="background: #111111; padding: 24px; border-radius: 16px; margin: 24px 0;">
        <h3 style="font-size: 14px; margin-top: 0;">YOUR ACCESS PRIVILEGES:</h3>
        <ul style="padding-left: 20px; font-size: 14px; color: #94a3b8;">
            <li>Exclusive Project Marketplace</li>
            <li>Career Management Terminal</li>
            <li>Real-time Secure Messaging</li>
            <li>Personal Asset Vault</li>
        </ul>
    </div>

    <a href="\${process.env.FRONTEND_URL}/dashboard" class="button">ENTER DASHBOARD</a>
    
    <p style="margin-top: 32px; font-size: 14px;" class="text-muted">
        Need assistance? Our support architecture is ready at \${process.env.CONTACT_RECEIVER_EMAIL}
    </p>
`);

exports.otpTemplate = (otp) => getBaseTemplate(`
    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">ACCESS RECOVERY</h1>
    <p>A request to reset your CVTECH access key has been initiated. Use the secure authorization code below to proceed.</p>
    
    <div class="otp-box">${otp}</div>
    
    <p style="font-size: 14px; color: #ef4444;">Warning: This code will expire in 5 minutes.</p>
    <p style="font-size: 14px;" class="text-muted">If you did not initiate this request, please secure your identity immediately.</p>
`);

exports.passwordChangedTemplate = () => getBaseTemplate(`
    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">ACCESS KEY UPDATED</h1>
    <p>Your CVTECH account password has been successfully updated. Your previous sessions have been terminated for security.</p>
    
    <div style="background: #111111; padding: 24px; border-radius: 16px; margin: 24px 0; border-left: 4px solid #10b981;">
        <p style="margin: 0; font-weight: bold;">Security Status: Verified</p>
    </div>

    <a href="\${process.env.FRONTEND_URL}/login" class="button">LOGIN TO ACCOUNT</a>
`);

exports.purchaseTemplate = (orderData, adminContact) => getBaseTemplate(`
    <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px;">ASSET DEPLOYMENT COMPLETE</h1>
    <p>Thank you for your acquisition. Your architectural asset is now ready for deployment within your personal workspace.</p>
    
    <div style="background: #111111; padding: 24px; border-radius: 16px; margin: 24px 0;">
        <p style="margin: 0; font-size: 14px;"><strong>Order ID:</strong> ${orderData.orderId}</p>
        <p style="margin: 8px 0; font-size: 14px;"><strong>Project:</strong> ${orderData.projectName}</p>
        <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> <span style="color: #10b981;">Provisioned</span></p>
    </div>

    <h3 style="font-size: 14px;">DOWNLOAD INSTRUCTIONS:</h3>
    <ol style="font-size: 14px; color: #94a3b8; padding-left: 20px;">
        <li>Login to your dashboard</li>
        <li>Navigate to <span class="text-primary">"My Projects"</span></li>
        <li>Select the asset and trigger the secure download</li>
    </ol>

    <a href="\${process.env.FRONTEND_URL}/dashboard/my-projects" class="button">ACCESS ASSETS</a>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #1e293b;">
        <h3 style="font-size: 12px; margin-top: 0;">TECHNICAL SUPPORT:</h3>
        <p style="font-size: 12px;" class="text-muted">
            Email: ${adminContact.email}<br>
            Phone: ${adminContact.phone}
        </p>
    </div>
`);
