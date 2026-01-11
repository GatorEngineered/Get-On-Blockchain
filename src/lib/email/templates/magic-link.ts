// src/lib/email/templates/magic-link.ts

import { generateEmailFooter } from './email-footer';

export interface MagicLinkEmailParams {

  firstName: string;

  lastName: string;

  magicLink: string;

  expiresInMinutes?: number;

}

 

export function generateMagicLinkEmail({

  firstName,

  lastName,

  magicLink,

  expiresInMinutes = 15,

}: MagicLinkEmailParams): string {

  return `

<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Your Login Link</title>

  <style>

    body {

      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

      line-height: 1.6;

      color: #333;

      background-color: #f4f4f4;

      margin: 0;

      padding: 0;

    }

    .container {

      max-width: 600px;

      margin: 40px auto;

      background: #ffffff;

      border-radius: 8px;

      overflow: hidden;

      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    }

    .header {

      background: linear-gradient(135deg, #244b7a 0%, #1a3a5f 100%);

      color: #ffffff;

      padding: 30px;

      text-align: center;

    }

    .header h1 {

      margin: 0;

      font-size: 24px;

      font-weight: 600;

    }

    .content {

      padding: 40px 30px;

    }

    .content h2 {

      margin-top: 0;

      color: #244b7a;

      font-size: 20px;

    }

    .content p {

      margin: 16px 0;

      color: #555;

    }

    .button {

      display: inline-block;

      margin: 24px 0;

      padding: 14px 32px;

      background: #244b7a;

      color: #ffffff !important;

      text-decoration: none;

      border-radius: 6px;

      font-weight: 600;

      text-align: center;

    }

    .button:hover {

      background: #1a3a5f;

    }

    .expiry-notice {

      background: #fff8e1;

      border-left: 4px solid #ffc107;

      padding: 12px 16px;

      margin: 20px 0;

      border-radius: 4px;

    }

    .expiry-notice p {

      margin: 0;

      color: #f57c00;

      font-size: 14px;

    }

    .footer {

      background: #f9f9f9;

      padding: 20px 30px;

      text-align: center;

      font-size: 12px;

      color: #999;

      border-top: 1px solid #eee;

    }

    .security-notice {

      margin-top: 20px;

      padding-top: 20px;

      border-top: 1px solid #eee;

      font-size: 14px;

      color: #666;

    }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

      <h1>🔐 Get On Blockchain</h1>

    </div>

 

    <div class="content">

      <h2>Hello ${firstName} ${lastName}!</h2>

 

      <p>You requested a login link for your Get On Blockchain account. Click the button below to securely access your dashboard:</p>

 

      <div style="text-align: center;">

        <a href="${magicLink}" class="button">

          Access Your Dashboard

        </a>

      </div>

 

      <div class="expiry-notice">

        <p>⏱️ This link expires in ${expiresInMinutes} minutes for your security.</p>

      </div>

 

      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>

      <p style="word-break: break-all; color: #244b7a; font-size: 13px;">

        ${magicLink}

      </p>

 

      <div class="security-notice">

        <p><strong>🔒 Security Notice</strong></p>

        <p>If you didn't request this login link, please ignore this email. Someone may have entered your email address by mistake.</p>

      </div>

    </div>

 

${generateEmailFooter({ recipientType: 'member', showUnsubscribe: false })}

  </div>

</body>

</html>

  `.trim();

}

 