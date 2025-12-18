// src/lib/email/notifications.ts
import nodemailer from 'nodemailer';

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