// src/lib/email/notifications.ts

import nodemailer from 'nodemailer';
import { sendEmail } from './resend';
import { generateTrialExpiringEmail, type TrialExpiringEmailParams } from './templates/trial-expiring';
import { generateMerchantWelcomeEmail, type MerchantWelcomeEmailParams } from './templates/merchant-welcome';
import { generatePaymentFailedEmail, type PaymentFailedEmailParams } from './templates/payment-failed';
import { generateStaffInviteEmail, type StaffInviteEmailParams } from './templates/staff-invite';

 

/**

 * Email notification utility for sending alerts and updates

 *

 * Configure via environment variables:

 * - EMAIL_HOST (e.g., smtp.gmail.com)

 * - EMAIL_PORT (e.g., 587)

 * - EMAIL_USER

 * - EMAIL_PASS

 * - EMAIL_FROM (default: noreply@getonblockchain.com)

 */

 

type EmailConfig = {

  host?: string;

  port?: number;

  user?: string;

  pass?: string;

  from?: string;

};

 

function getEmailConfig(): EmailConfig {

  return {

    host: process.env.EMAIL_HOST || 'smtp.gmail.com',

    port: parseInt(process.env.EMAIL_PORT || '587'),

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS,

    from: process.env.EMAIL_FROM || 'Get On Blockchain <noreply@getonblockchain.com>',

  };

}

 

function createTransporter() {

  const config = getEmailConfig();

 

  // If no email credentials configured, use console logging for dev

  if (!config.user || !config.pass) {

    console.warn('[Email] No email credentials configured. Emails will be logged to console.');

    return null;

  }

 

  return nodemailer.createTransport({

    host: config.host,

    port: config.port,

    secure: config.port === 465, // true for 465, false for other ports

    auth: {

      user: config.user,

      pass: config.pass,

    },

  });

}

 

type LowBalanceEmailParams = {

  merchantName: string;

  merchantEmail: string;

  currentBalance: number;

  threshold: number;

  walletAddress: string;

  network: string;

};

 

export async function sendLowBalanceEmail(params: LowBalanceEmailParams): Promise<boolean> {

  const {

    merchantName,

    merchantEmail,

    currentBalance,

    threshold,

    walletAddress,

    network,

  } = params;

 

  const config = getEmailConfig();

  const transporter = createTransporter();

 

  const subject = `⚠️ Low Wallet Balance Alert - ${merchantName}`;

  const html = `

<!DOCTYPE html>

<html>

<head>

  <style>

    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }

    .container { max-width: 600px; margin: 0 auto; padding: 20px; }

    .header { background: linear-gradient(135deg, #244b7a, #8bbcff); color: white; padding: 30px; border-radius: 10px 10px 0 0; }

    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }

    .alert { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }

    .balance { font-size: 2em; font-weight: bold; color: #dc2626; margin: 10px 0; }

    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }

    .button { display: inline-block; background: #244b7a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px; }

    code { background: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace; }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

      <h1>💰 Low Wallet Balance Alert</h1>

    </div>

    <div class="content">

      <div class="alert">

        <strong>⚠️ Action Required:</strong> Your payout wallet balance is running low!

      </div>

 

      <h2>Current Balance</h2>

      <div class="balance">$${currentBalance.toFixed(2)} USDC</div>

      <p style="color: #6b7280;">Threshold: $${threshold.toFixed(2)} USDC</p>

 

      <div class="details">

        <h3>Wallet Details</h3>

        <p><strong>Merchant:</strong> ${merchantName}</p>

        <p><strong>Wallet Address:</strong><br><code>${walletAddress}</code></p>

        <p><strong>Network:</strong> ${network === 'mumbai' ? 'Mumbai Testnet' : 'Polygon Mainnet'}</p>

      </div>

 

      <h3>What should I do?</h3>

      <ol>

        <li>Purchase USDC on an exchange (Coinbase, Binance, etc.)</li>

        <li>Send USDC to your payout wallet address above</li>

        <li>Also send some MATIC for gas fees (~$5 worth)</li>

        <li>Wait for confirmation, then check your dashboard</li>

      </ol>

 

      <p><strong>Note:</strong> Customer payouts will fail if your wallet runs out of USDC!</p>

 

      <a href="https://app.getonblockchain.com/dashboard/settings" class="button">

        Manage Wallet →

      </a>

 

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

 

      <p style="font-size: 0.9em; color: #6b7280;">

        This is an automated alert from Get On Blockchain. Your wallet balance is checked periodically.

        <br>Questions? Contact support@getonblockchain.com

      </p>

    </div>

  </div>

</body>

</html>

  `;

 

  const text = `

LOW WALLET BALANCE ALERT

 

Merchant: ${merchantName}

Current Balance: $${currentBalance.toFixed(2)} USDC

Threshold: $${threshold.toFixed(2)} USDC

 

Wallet Address: ${walletAddress}

Network: ${network === 'mumbai' ? 'Mumbai Testnet' : 'Polygon Mainnet'}

 

Action Required:

1. Purchase USDC on an exchange

2. Send USDC to your payout wallet

3. Send MATIC for gas fees

4. Check your dashboard for confirmation

 

Customer payouts will fail if your wallet runs out of USDC!

 

Manage your wallet: https://app.getonblockchain.com/dashboard/settings

  `;

 

  // If no transporter (dev mode), log to console

  if (!transporter) {

    console.log('\n=== [Email] Low Balance Alert (DEV MODE) ===');

    console.log(`To: ${merchantEmail}`);

    console.log(`Subject: ${subject}`);

    console.log(text);

    console.log('===========================================\n');

    return true;

  }

 

  try {

    await transporter.sendMail({

      from: config.from,

      to: merchantEmail,

      subject,

      text,

      html,

    });

 

    console.log(`[Email] Low balance alert sent to ${merchantEmail}`);

    return true;

  } catch (error: any) {

    console.error('[Email] Failed to send low balance alert:', error.message);

    return false;

  }

}

 

type PayoutSuccessEmailParams = {

  memberEmail: string;

  merchantName: string;

  amount: number;

  points: number;

  walletAddress: string;

  txHash: string;

  network: string;

};

 

export async function sendPayoutSuccessEmail(params: PayoutSuccessEmailParams): Promise<boolean> {

  const {

    memberEmail,

    merchantName,

    amount,

    points,

    walletAddress,

    txHash,

    network,

  } = params;

 

  const config = getEmailConfig();

  const transporter = createTransporter();

 

  const explorerUrl =

    network === 'mumbai'

      ? `https://mumbai.polygonscan.com/tx/${txHash}`

      : `https://polygonscan.com/tx/${txHash}`;

 

  const subject = `🎉 You received $${amount.toFixed(2)} USDC from ${merchantName}!`;

  const html = `

<!DOCTYPE html>

<html>

<head>

  <style>

    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }

    .container { max-width: 600px; margin: 0 auto; padding: 20px; }

    .header { background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }

    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }

    .amount { font-size: 3em; font-weight: bold; color: #10b981; margin: 20px 0; text-align: center; }

    .details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }

    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }

    code { background: #e5e7eb; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 0.9em; }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

      <h1>🎉 Payout Successful!</h1>

    </div>

    <div class="content">

      <p>Congratulations! You've earned a payout from <strong>${merchantName}</strong>.</p>

 

      <div class="amount">$${amount.toFixed(2)}</div>

      <p style="text-align: center; color: #6b7280;">USDC Stablecoin</p>

 

      <div class="details">

        <h3>Transaction Details</h3>

        <p><strong>Amount:</strong> ${amount.toFixed(2)} USDC</p>

        <p><strong>Points Redeemed:</strong> ${points} points</p>

        <p><strong>Your Wallet:</strong><br><code>${walletAddress}</code></p>

        <p><strong>Transaction Hash:</strong><br><code>${txHash.slice(0, 20)}...${txHash.slice(-20)}</code></p>

      </div>

 

      <center>

        <a href="${explorerUrl}" class="button" target="_blank">

          View on Blockchain Explorer →

        </a>

      </center>

 

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

 

      <p><strong>What's Next?</strong></p>

      <ul>

        <li>Your USDC has been sent to your wallet</li>

        <li>You can use it anywhere USDC is accepted</li>

        <li>Keep earning points for more rewards!</li>

      </ul>

 

      <p style="font-size: 0.9em; color: #6b7280; margin-top: 30px;">

        This is an automated notification from Get On Blockchain.

        <br>Questions? Contact support@getonblockchain.com

      </p>

    </div>

  </div>

</body>

</html>

  `;

 

  const text = `

PAYOUT SUCCESSFUL!

 

Congratulations! You've earned $${amount.toFixed(2)} USDC from ${merchantName}.

 

Transaction Details:

- Amount: ${amount.toFixed(2)} USDC

- Points Redeemed: ${points} points

- Your Wallet: ${walletAddress}

- Transaction Hash: ${txHash}

 

View on blockchain: ${explorerUrl}

 

What's Next?

- Your USDC has been sent to your wallet

- You can use it anywhere USDC is accepted

- Keep earning points for more rewards!

  `;

 

  if (!transporter) {

    console.log('\n=== [Email] Payout Success (DEV MODE) ===');

    console.log(`To: ${memberEmail}`);

    console.log(`Subject: ${subject}`);

    console.log(text);

    console.log('========================================\n');

    return true;

  }

 

  try {

    await transporter.sendMail({

      from: config.from,

      to: memberEmail,

      subject,

      text,

      html,

    });

 

    console.log(`[Email] Payout success notification sent to ${memberEmail}`);

    return true;

  } catch (error: any) {

    console.error('[Email] Failed to send payout notification:', error.message);

    return false;

  }

}

 

export async function sendMagicLinkEmail(

  email: string,

  magicLink: string,

  merchantName?: string

): Promise<boolean> {

  const config = getEmailConfig();

  const transporter = createTransporter();

 

  const subject = merchantName

    ? `Sign in to ${merchantName} Rewards`

    : 'Sign in to Get On Blockchain';

 

  const html = `

<!DOCTYPE html>

<html>

<head>

  <style>

    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }

    .container { max-width: 600px; margin: 0 auto; padding: 20px; }

    .header { background: linear-gradient(135deg, #244b7a, #8bbcff); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }

    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }

    .button { display: inline-block; background: #244b7a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-size: 1.1em; }

    .expiry { background: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin: 15px 0; border-radius: 5px; font-size: 0.9em; }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

      <h1>🔐 Sign In to Your Account</h1>

    </div>

    <div class="content">

      <p>Click the button below to sign in${merchantName ? ` to ${merchantName}` : ''}:</p>

 

      <center>

        <a href="${magicLink}" class="button">

          Sign In →

        </a>

      </center>

 

      <p>Or copy and paste this link into your browser:</p>

      <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace; font-size: 0.85em;">

        ${magicLink}

      </p>

 

      <div class="expiry">

        <strong>⏰ This link expires in 15 minutes</strong> for security reasons.

      </div>

 

      <p>If you didn't request this email, you can safely ignore it.</p>

 

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

 

      <p style="font-size: 0.9em; color: #6b7280;">

        This is an automated email from Get On Blockchain.

        <br>Questions? Contact support@getonblockchain.com

      </p>

    </div>

  </div>

</body>

</html>

  `;

 

  const text = `

SIGN IN TO YOUR ACCOUNT

 

Click this link to sign in${merchantName ? ` to ${merchantName}` : ''}:

${magicLink}

 

This link expires in 15 minutes for security reasons.

 

If you didn't request this email, you can safely ignore it.

  `;

 

  if (!transporter) {

    console.log('\n=== [Email] Magic Link (DEV MODE) ===');

    console.log(`To: ${email}`);

    console.log(`Subject: ${subject}`);

    console.log(`Magic Link: ${magicLink}`);

    console.log('=====================================\n');

    return true;

  }

 

  try {

    await transporter.sendMail({

      from: config.from,

      to: email,

      subject,

      text,

      html,

    });

 

    console.log(`[Email] Magic link sent to ${email}`);

    return true;

  } catch (error: any) {

    console.error('[Email] Failed to send magic link:', error.message);

    return false;

  }

}

// =============================================================================
// Template-based emails using Resend
// =============================================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.getonblockchain.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@getonblockchain.com';

/**
 * Send trial expiring notification email
 */
export async function sendTrialExpiringEmail(
  email: string,
  params: Omit<TrialExpiringEmailParams, 'upgradeUrl' | 'dashboardUrl'>
): Promise<boolean> {
  try {
    const html = generateTrialExpiringEmail({
      ...params,
      upgradeUrl: `${APP_URL}/dashboard/settings?tab=plans`,
      dashboardUrl: `${APP_URL}/dashboard`,
    });

    const daysText = params.daysRemaining === 1 ? '1 day' : `${params.daysRemaining} days`;
    await sendEmail({
      to: email,
      subject: `Your ${params.currentPlan} trial expires in ${daysText}`,
      html,
    });

    console.log(`[Email] Trial expiring notification sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send trial expiring email:', error.message);
    return false;
  }
}

/**
 * Send merchant welcome email after registration
 */
export async function sendMerchantWelcomeEmail(
  email: string,
  params: Omit<MerchantWelcomeEmailParams, 'dashboardUrl' | 'qrCodeUrl' | 'supportEmail'>
): Promise<boolean> {
  try {
    const html = generateMerchantWelcomeEmail({
      ...params,
      dashboardUrl: `${APP_URL}/dashboard`,
      qrCodeUrl: `${APP_URL}/dashboard/settings?tab=qr`,
      supportEmail: SUPPORT_EMAIL,
    });

    await sendEmail({
      to: email,
      subject: `Welcome to Get On Blockchain, ${params.merchantName}!`,
      html,
    });

    console.log(`[Email] Welcome email sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send welcome email:', error.message);
    return false;
  }
}

/**
 * Send payment failed notification email
 */
export async function sendPaymentFailedNotification(
  email: string,
  params: Omit<PaymentFailedEmailParams, 'updatePaymentUrl' | 'dashboardUrl' | 'supportEmail'>
): Promise<boolean> {
  try {
    const html = generatePaymentFailedEmail({
      ...params,
      updatePaymentUrl: `${APP_URL}/dashboard/settings?tab=plans`,
      dashboardUrl: `${APP_URL}/dashboard`,
      supportEmail: SUPPORT_EMAIL,
    });

    await sendEmail({
      to: email,
      subject: `Payment failed for ${params.businessName} - Action required`,
      html,
    });

    console.log(`[Email] Payment failed notification sent to ${email}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send payment failed email:', error.message);
    return false;
  }
}

/**
 * Send staff invitation email
 */
export async function sendStaffInviteEmail(
  params: Omit<StaffInviteEmailParams, 'inviteUrl'> & { inviteToken: string }
): Promise<boolean> {
  try {
    const inviteUrl = `${APP_URL}/dashboard/accept-invite?token=${params.inviteToken}`;

    const html = generateStaffInviteEmail({
      staffName: params.staffName,
      staffEmail: params.staffEmail,
      merchantName: params.merchantName,
      inviterName: params.inviterName,
      inviteUrl,
      expiresAt: params.expiresAt,
      permissions: params.permissions,
    });

    await sendEmail({
      to: params.staffEmail,
      subject: `You're invited to join ${params.merchantName} on Get On Blockchain`,
      html,
    });

    console.log(`[Email] Staff invitation sent to ${params.staffEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send staff invitation:', error.message);
    return false;
  }
}

/**
 * Send admin notification when a new merchant registers
 */
type AdminNewMerchantParams = {
  merchantName: string;
  businessName: string;
  ownerEmail: string;
  plan: string;
  isTrialing: boolean;
  trialEndsAt?: Date;
};

export async function sendAdminNewMerchantNotification(
  params: AdminNewMerchantParams
): Promise<boolean> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!adminEmail) {
    console.log('[Email] ADMIN_NOTIFICATION_EMAIL not set, skipping admin notification');
    return false;
  }

  try {
    const trialInfo = params.isTrialing && params.trialEndsAt
      ? `Trial ends: ${params.trialEndsAt.toLocaleDateString()}`
      : 'No trial (Starter plan)';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #244b7a, #8bbcff); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .details p { margin: 8px 0; }
    .label { color: #6b7280; font-size: 0.9em; }
    .value { font-weight: 600; color: #111827; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; }
    .badge-trial { background: #fef3c7; color: #92400e; }
    .badge-starter { background: #e0e7ff; color: #3730a3; }
    .button { display: inline-block; background: #244b7a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">🎉 New Merchant Registration</h2>
    </div>
    <div class="content">
      <p>A new merchant has signed up for Get On Blockchain!</p>

      <div class="details">
        <p><span class="label">Business Name:</span><br><span class="value">${params.businessName}</span></p>
        <p><span class="label">Owner/Contact:</span><br><span class="value">${params.merchantName}</span></p>
        <p><span class="label">Email:</span><br><span class="value">${params.ownerEmail}</span></p>
        <p><span class="label">Plan:</span><br>
          <span class="badge ${params.isTrialing ? 'badge-trial' : 'badge-starter'}">${params.plan}${params.isTrialing ? ' (Trial)' : ''}</span>
        </p>
        <p><span class="label">Status:</span><br><span class="value">${trialInfo}</span></p>
      </div>

      <a href="${APP_URL}/admin/merchants" class="button">View in Admin Dashboard →</a>

      <p style="font-size: 0.85em; color: #6b7280; margin-top: 25px;">
        This is an automated notification from Get On Blockchain.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `🆕 New Merchant: ${params.businessName} signed up for ${params.plan}`,
      html,
    });

    console.log(`[Email] Admin notification sent for new merchant: ${params.businessName}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send admin notification:', error.message);
    return false;
  }
}

// =============================================================================
// Referral System Emails
// =============================================================================

type ReferralInviteParams = {
  referredEmail: string;
  referrerName: string;
  merchantName: string;
  merchantSlug: string;
};

/**
 * Send referral invitation email to the referred friend
 */
export async function sendReferralInviteEmail(params: ReferralInviteParams): Promise<boolean> {
  const { referredEmail, referrerName, merchantName, merchantSlug } = params;
  const signupUrl = `${APP_URL}/member/register?merchant=${merchantSlug}&ref=invite`;

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #244b7a, #8bbcff); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .highlight { background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background: linear-gradient(to right, #244b7a, #8bbcff); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 20px 0; }
    .button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎁 You've Been Invited!</h1>
    </div>
    <div class="content">
      <p>Hi there!</p>

      <p><strong>${referrerName}</strong> thinks you'd love the rewards program at <strong>${merchantName}</strong> and wanted to share it with you!</p>

      <div class="highlight">
        <strong>What you'll get:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Earn points on every visit</li>
          <li>Redeem rewards and exclusive offers</li>
          <li>Get real crypto payouts to your wallet</li>
        </ul>
      </div>

      <center>
        <a href="${signupUrl}" class="button">
          Join ${merchantName} Rewards →
        </a>
      </center>

      <p style="color: #6b7280; font-size: 0.9em; margin-top: 20px;">
        Simply sign up with this email address to start earning rewards!
      </p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 0.85em; color: #6b7280;">
        This invitation was sent by ${referrerName} via Get On Blockchain.
        <br>If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: referredEmail,
      subject: `${referrerName} invited you to join ${merchantName} Rewards!`,
      html,
    });

    console.log(`[Email] Referral invite sent to ${referredEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send referral invite:', error.message);
    return false;
  }
}

type MerchantReferralSentParams = {
  merchantEmail: string;
  merchantName: string;
  referrerName: string;
  referrerEmail: string;
  referredEmail: string;
};

/**
 * Notify merchant when a member sends a referral
 */
export async function sendMerchantReferralSentNotification(params: MerchantReferralSentParams): Promise<boolean> {
  const { merchantEmail, merchantName, referrerName, referrerEmail, referredEmail } = params;

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #244b7a, #8bbcff); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .label { color: #6b7280; font-size: 0.9em; }
    .value { font-weight: 600; color: #111827; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">📤 New Referral Sent</h2>
    </div>
    <div class="content">
      <p>Great news! A member just sent a referral invitation for <strong>${merchantName}</strong>.</p>

      <div class="details">
        <p><span class="label">Referrer:</span><br><span class="value">${referrerName}</span></p>
        <p><span class="label">Referrer Email:</span><br><span class="value">${referrerEmail}</span></p>
        <p><span class="label">Invited Friend:</span><br><span class="value">${referredEmail}</span></p>
      </div>

      <p style="color: #6b7280;">
        If the invited friend signs up with the same email, ${referrerName} will automatically earn referral points!
      </p>

      <p style="font-size: 0.85em; color: #6b7280; margin-top: 25px;">
        This is an automated notification from Get On Blockchain.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: merchantEmail,
      subject: `📤 ${referrerName} sent a referral for ${merchantName}`,
      html,
    });

    console.log(`[Email] Merchant notified of referral sent: ${merchantEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send merchant referral notification:', error.message);
    return false;
  }
}

type ReferralConvertedMemberParams = {
  referrerEmail: string;
  referrerName: string;
  merchantName: string;
  referredEmail: string;
  pointsAwarded: number;
};

/**
 * Notify member when their referral converts (friend signed up)
 */
export async function sendReferralConvertedEmail(params: ReferralConvertedMemberParams): Promise<boolean> {
  const { referrerEmail, referrerName, merchantName, referredEmail, pointsAwarded } = params;

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .points { font-size: 3em; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
    .success { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Referral Bonus Earned!</h1>
    </div>
    <div class="content">
      <p>Hi ${referrerName}!</p>

      <div class="success">
        <strong>Great news!</strong> Your friend (<strong>${referredEmail}</strong>) just signed up for <strong>${merchantName}</strong> using your referral!
      </div>

      <p style="text-align: center;">You've earned:</p>
      <div class="points">+${pointsAwarded} pts</div>

      <p style="text-align: center; color: #6b7280;">These points have been added to your account!</p>

      <center>
        <a href="${APP_URL}/member/dashboard" class="button">
          View Your Points →
        </a>
      </center>

      <p style="margin-top: 30px;">Keep sharing! The more friends you refer, the more points you earn.</p>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

      <p style="font-size: 0.85em; color: #6b7280;">
        This is an automated notification from Get On Blockchain.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: referrerEmail,
      subject: `🎉 You earned ${pointsAwarded} points! Your friend joined ${merchantName}`,
      html,
    });

    console.log(`[Email] Referral converted notification sent to ${referrerEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send referral converted email:', error.message);
    return false;
  }
}

type MerchantReferralConvertedParams = {
  merchantEmail: string;
  merchantName: string;
  referrerName: string;
  referrerEmail: string;
  newMemberEmail: string;
  pointsAwarded: number;
};

/**
 * Notify merchant when a referral converts (new member signed up via referral)
 */
export async function sendMerchantReferralConvertedNotification(params: MerchantReferralConvertedParams): Promise<boolean> {
  const { merchantEmail, merchantName, referrerName, referrerEmail, newMemberEmail, pointsAwarded } = params;

  try {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .label { color: #6b7280; font-size: 0.9em; }
    .value { font-weight: 600; color: #111827; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 0.85em; font-weight: 600; background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">✅ Referral Converted!</h2>
    </div>
    <div class="content">
      <p>A referral just converted into a new member for <strong>${merchantName}</strong>!</p>

      <div class="details">
        <p><span class="label">New Member:</span><br><span class="value">${newMemberEmail}</span></p>
        <p><span class="label">Referred By:</span><br><span class="value">${referrerName} (${referrerEmail})</span></p>
        <p><span class="label">Referral Bonus:</span><br><span class="badge">+${pointsAwarded} points awarded to ${referrerName}</span></p>
      </div>

      <p style="color: #059669; font-weight: 500;">
        🎉 Your loyalty program is growing through word-of-mouth!
      </p>

      <a href="${APP_URL}/dashboard/members" style="display: inline-block; background: #244b7a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
        View Members →
      </a>

      <p style="font-size: 0.85em; color: #6b7280; margin-top: 25px;">
        This is an automated notification from Get On Blockchain.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    await sendEmail({
      to: merchantEmail,
      subject: `✅ New member from referral: ${newMemberEmail} joined ${merchantName}`,
      html,
    });

    console.log(`[Email] Merchant notified of referral conversion: ${merchantEmail}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Failed to send merchant referral converted notification:', error.message);
    return false;
  }
}
