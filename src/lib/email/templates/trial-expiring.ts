// src/lib/email/templates/trial-expiring.ts

export interface TrialExpiringEmailParams {
  merchantName: string;
  daysRemaining: number;
  trialEndsAt: Date;
  currentPlan: string;
  upgradeUrl: string;
  dashboardUrl: string;
}

export function generateTrialExpiringEmail({
  merchantName,
  daysRemaining,
  trialEndsAt,
  currentPlan,
  upgradeUrl,
  dashboardUrl,
}: TrialExpiringEmailParams): string {
  const formattedDate = trialEndsAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const urgencyColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 3 ? '#f59e0b' : '#3b82f6';
  const urgencyText = daysRemaining <= 1 ? 'expires tomorrow' : daysRemaining <= 3 ? 'ending soon' : 'ending';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Trial is ${urgencyText}</title>
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
      background: linear-gradient(135deg, ${urgencyColor} 0%, ${daysRemaining <= 1 ? '#b91c1c' : daysRemaining <= 3 ? '#d97706' : '#2563eb'} 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .countdown {
      font-size: 64px;
      font-weight: 700;
      margin: 10px 0;
    }
    .countdown-label {
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin-top: 0;
      color: #111827;
      font-size: 20px;
    }
    .content p {
      margin: 16px 0;
      color: #555;
    }
    .info-box {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0f2fe;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #0369a1;
    }
    .info-value {
      color: #0c4a6e;
    }
    .cta-section {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 8px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
    }
    .cta-section h3 {
      color: #ffffff;
      margin: 0 0 12px 0;
      font-size: 18px;
    }
    .cta-section p {
      color: rgba(255, 255, 255, 0.9);
      margin: 0 0 16px 0;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: #ffffff;
      color: #059669 !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: #f0fdf4;
    }
    .features-list {
      background: #fefce8;
      border-left: 4px solid #eab308;
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 4px;
    }
    .features-list h4 {
      margin: 0 0 12px 0;
      color: #854d0e;
    }
    .features-list ul {
      margin: 0;
      padding-left: 20px;
      color: #713f12;
    }
    .features-list li {
      margin: 8px 0;
    }
    .secondary-button {
      display: inline-block;
      padding: 12px 24px;
      background: #f3f4f6;
      color: #374151 !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 16px;
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
      <div class="countdown">${daysRemaining}</div>
      <div class="countdown-label">${daysRemaining === 1 ? 'day' : 'days'} remaining</div>
      <h1>Your ${currentPlan} Trial is ${urgencyText}</h1>
    </div>

    <div class="content">
      <h2>Hi ${merchantName},</h2>

      <p>Your free trial of the ${currentPlan} plan will end on <strong>${formattedDate}</strong>. After this date, your account will be downgraded to the Starter plan unless you upgrade.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Current Plan:</span>
          <span class="info-value">${currentPlan} (Trial)</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trial Ends:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">After Trial:</span>
          <span class="info-value">Downgrades to Starter</span>
        </div>
      </div>

      <div class="cta-section">
        <h3>Keep Your Premium Features</h3>
        <p>Continue enjoying stablecoin rewards, multi-location support, and advanced analytics.</p>
        <a href="${upgradeUrl}" class="button">
          Upgrade Now
        </a>
      </div>

      <div class="features-list">
        <h4>What you'll lose if you don't upgrade:</h4>
        <ul>
          <li>Stablecoin (USDC) reward payouts to customers</li>
          <li>Multiple business locations</li>
          <li>Advanced member analytics</li>
          <li>Custom reward milestones</li>
          <li>Priority email support</li>
        </ul>
      </div>

      <p style="color: #6b7280; font-size: 14px;">
        <strong>Note:</strong> Your existing members and their points will be preserved. However, some features may become unavailable based on Starter plan limits.
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="${dashboardUrl}" class="secondary-button">
          View Dashboard
        </a>
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Get On Blockchain. All rights reserved.</p>
      <p>Questions? Reply to this email or visit our support center.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
