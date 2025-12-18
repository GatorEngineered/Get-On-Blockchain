// src/lib/email/templates/payout-success.ts

 

export interface PayoutSuccessEmailParams {

  firstName: string;

  lastName: string;

  businessName: string;

  amount: number;

  pointsDeducted: number;

  newPointsBalance: number;

  txHash: string;

  explorerUrl: string;

  walletAddress: string;

}

 

export function generatePayoutSuccessEmail({

  firstName,

  lastName,

  businessName,

  amount,

  pointsDeducted,

  newPointsBalance,

  txHash,

  explorerUrl,

  walletAddress,

}: PayoutSuccessEmailParams): string {

  return `

<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Payout Successful!</title>

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

      background: linear-gradient(135deg, #10b981 0%, #059669 100%);

      color: #ffffff;

      padding: 30px;

      text-align: center;

    }

    .header h1 {

      margin: 0;

      font-size: 24px;

      font-weight: 600;

    }

    .success-icon {

      font-size: 48px;

      margin-bottom: 10px;

    }

    .content {

      padding: 40px 30px;

    }

    .content h2 {

      margin-top: 0;

      color: #10b981;

      font-size: 20px;

    }

    .content p {

      margin: 16px 0;

      color: #555;

    }

    .payout-details {

      background: #f0fdf4;

      border: 2px solid #10b981;

      border-radius: 8px;

      padding: 20px;

      margin: 24px 0;

    }

    .payout-amount {

      font-size: 32px;

      font-weight: 700;

      color: #10b981;

      text-align: center;

      margin: 16px 0;

    }

    .detail-row {

      display: flex;

      justify-content: space-between;

      padding: 8px 0;

      border-bottom: 1px solid #d1fae5;

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

      text-align: right;

      word-break: break-all;

    }

    .button {

      display: inline-block;

      margin: 24px 0;

      padding: 14px 32px;

      background: #10b981;

      color: #ffffff !important;

      text-decoration: none;

      border-radius: 6px;

      font-weight: 600;

      text-align: center;

    }

    .button:hover {

      background: #059669;

    }

    .footer {

      background: #f9f9f9;

      padding: 20px 30px;

      text-align: center;

      font-size: 12px;

      color: #999;

      border-top: 1px solid #eee;

    }

    .info-box {

      background: #eff6ff;

      border-left: 4px solid #3b82f6;

      padding: 12px 16px;

      margin: 20px 0;

      border-radius: 4px;

    }

    .info-box p {

      margin: 0;

      color: #1e40af;

      font-size: 14px;

    }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

      <div class="success-icon">✅</div>

      <h1>Payout Successful!</h1>

    </div>

 

    <div class="content">

      <h2>Congratulations, ${firstName} ${lastName}!</h2>

 

      <p>Your reward payout from <strong>${businessName}</strong> has been successfully processed and sent to your wallet.</p>

 

      <div class="payout-details">

        <div class="payout-amount">$${amount.toFixed(2)} USDC</div>

 

        <div class="detail-row">

          <span class="detail-label">Points Redeemed:</span>

          <span class="detail-value">${pointsDeducted} points</span>

        </div>

 

        <div class="detail-row">

          <span class="detail-label">Remaining Balance:</span>

          <span class="detail-value">${newPointsBalance} points</span>

        </div>

 

        <div class="detail-row">

          <span class="detail-label">Sent to Wallet:</span>

          <span class="detail-value">${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}</span>

        </div>

 

        <div class="detail-row">

          <span class="detail-label">Network:</span>

          <span class="detail-value">Polygon</span>

        </div>

      </div>

 

      <div style="text-align: center;">

        <a href="${explorerUrl}" class="button" target="_blank" rel="noopener noreferrer">

          View Transaction on Polygonscan

        </a>

      </div>

 

      <div class="info-box">

        <p>💡 <strong>Transaction Hash:</strong></p>

        <p style="word-break: break-all; font-family: monospace; font-size: 12px; margin-top: 8px;">${txHash}</p>

      </div>

 

      <p style="margin-top: 24px;">The USDC should appear in your wallet within a few minutes. You can continue earning more points at ${businessName} to unlock additional rewards!</p>

 

      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">Need help? Contact ${businessName} or visit your dashboard to view all your transactions.</p>

    </div>

 

    <div class="footer">

      <p>© ${new Date().getFullYear()} Get On Blockchain. All rights reserved.</p>

      <p>Blockchain-powered loyalty rewards platform</p>

    </div>

  </div>

</body>

</html>

  `.trim();

}

 