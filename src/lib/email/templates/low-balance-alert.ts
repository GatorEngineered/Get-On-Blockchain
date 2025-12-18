// src/lib/email/templates/low-balance-alert.ts

 

export interface LowBalanceAlertEmailParams {

  businessName: string;

  currentBalance: number;

  threshold: number;

  walletAddress: string;

  dashboardUrl: string;

}

 

export function generateLowBalanceAlertEmail({

  businessName,

  currentBalance,

  threshold,

  walletAddress,

  dashboardUrl,

}: LowBalanceAlertEmailParams): string {

  return `

<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Low Wallet Balance Alert</title>

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

      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);

      color: #ffffff;

      padding: 30px;

      text-align: center;

    }

    .header h1 {

      margin: 0;

      font-size: 24px;

      font-weight: 600;

    }

    .warning-icon {

      font-size: 48px;

      margin-bottom: 10px;

    }

    .content {

      padding: 40px 30px;

    }

    .content h2 {

      margin-top: 0;

      color: #d97706;

      font-size: 20px;

    }

    .content p {

      margin: 16px 0;

      color: #555;

    }

    .alert-box {

      background: #fffbeb;

      border: 2px solid #f59e0b;

      border-radius: 8px;

      padding: 20px;

      margin: 24px 0;

    }

    .balance-display {

      font-size: 32px;

      font-weight: 700;

      color: #d97706;

      text-align: center;

      margin: 16px 0;

    }

    .detail-row {

      display: flex;

      justify-content: space-between;

      padding: 8px 0;

      border-bottom: 1px solid #fde68a;

    }

    .detail-row:last-child {

      border-bottom: none;

    }

    .detail-label {

      font-weight: 600;

      color: #374151;

    }

    .detail-value {

      color: #6b7280;

      font-family: monospace;

      text-align: right;

      word-break: break-all;

    }

    .button {

      display: inline-block;

      margin: 24px 0;

      padding: 14px 32px;

      background: #f59e0b;

      color: #ffffff !important;

      text-decoration: none;

      border-radius: 6px;

      font-weight: 600;

      text-align: center;

    }

    .button:hover {

      background: #d97706;

    }

    .action-steps {

      background: #f0f9ff;

      border-left: 4px solid #3b82f6;

      padding: 16px 20px;

      margin: 24px 0;

      border-radius: 4px;

    }

    .action-steps h3 {

      margin-top: 0;

      color: #1e40af;

      font-size: 16px;

    }

    .action-steps ol {

      margin: 8px 0;

      padding-left: 20px;

      color: #1e40af;

    }

    .action-steps li {

      margin: 8px 0;

    }

    .footer {

      background: #f9f9f9;

      padding: 20px 30px;

      text-align: center;

      font-size: 12px;

      color: #999;

      border-top: 1px solid #eee;

    }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

      <div class="warning-icon">⚠️</div>

      <h1>Low Wallet Balance Alert</h1>

    </div>

 

    <div class="content">

      <h2>Action Required: ${businessName}</h2>

 

      <p>Your merchant wallet balance has fallen below the recommended threshold. This may affect your ability to process customer reward payouts.</p>

 

      <div class="alert-box">

        <div class="balance-display">$${currentBalance.toFixed(2)} USDC</div>

 

        <div class="detail-row">

          <span class="detail-label">Alert Threshold:</span>

          <span class="detail-value">$${threshold.toFixed(2)} USDC</span>

        </div>

 

        <div class="detail-row">

          <span class="detail-label">Wallet Address:</span>

          <span class="detail-value">${walletAddress.slice(0, 10)}...${walletAddress.slice(-8)}</span>

        </div>

 

        <div class="detail-row">

          <span class="detail-label">Network:</span>

          <span class="detail-value">Polygon</span>

        </div>

      </div>

 

      <div class="action-steps">

        <h3>📋 Next Steps</h3>

        <ol>

          <li>Review your recent payout activity in the dashboard</li>

          <li>Transfer USDC to your merchant wallet address above</li>

          <li>Ensure you have sufficient balance for upcoming payouts</li>

          <li>Consider setting up automatic top-ups to prevent future alerts</li>

        </ol>

      </div>

 

      <div style="text-align: center;">

        <a href="${dashboardUrl}" class="button">

          Go to Dashboard

        </a>

      </div>

 

      <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">

        <strong>💡 Tip:</strong> We recommend maintaining a balance of at least $${(threshold * 2).toFixed(2)} USDC to ensure uninterrupted payout processing. You can purchase USDC on exchanges like Coinbase or Binance and transfer it to your wallet.

      </p>

 

      <p style="color: #ef4444; font-weight: 600; margin-top: 16px;">

        ⚡ Important: Customer payout requests will fail if your wallet balance is insufficient!

      </p>

    </div>

 

    <div class="footer">

      <p>© ${new Date().getFullYear()} Get On Blockchain. All rights reserved.</p>

      <p>Need help? Contact support or visit our documentation</p>

    </div>

  </div>

</body>

</html>

  `.trim();

}

 