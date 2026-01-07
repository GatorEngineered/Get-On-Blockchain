// src/lib/email/templates/payment-failed.ts

export interface PaymentFailedEmailParams {
  merchantName: string;
  businessName: string;
  currentPlan: string;
  amount: string;
  failureReason?: string;
  retryDate?: Date;
  updatePaymentUrl: string;
  dashboardUrl: string;
  supportEmail: string;
}

export function generatePaymentFailedEmail({
  merchantName,
  businessName,
  currentPlan,
  amount,
  failureReason,
  retryDate,
  updatePaymentUrl,
  dashboardUrl,
  supportEmail,
}: PaymentFailedEmailParams): string {
  const formattedRetryDate = retryDate?.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - Action Required</title>
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
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 8px 0 0;
      font-size: 14px;
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
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .alert-title {
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 8px;
    }
    .alert-text {
      color: #7f1d1d;
      font-size: 14px;
      margin: 0;
    }
    .info-box {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 500;
      color: #6b7280;
    }
    .info-value {
      color: #111827;
      font-weight: 500;
    }
    .info-value.error {
      color: #dc2626;
    }
    .cta-section {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    }
    .secondary-button {
      display: inline-block;
      padding: 12px 24px;
      background: #f3f4f6;
      color: #374151 !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin-top: 12px;
    }
    .warning-section {
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .warning-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 8px;
    }
    .warning-list {
      margin: 0;
      padding-left: 20px;
      color: #854d0e;
      font-size: 14px;
    }
    .warning-list li {
      margin: 8px 0;
    }
    .retry-info {
      background: #eff6ff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      text-align: center;
    }
    .retry-info p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
    }
    .retry-info strong {
      color: #1e3a8a;
    }
    .help-section {
      background: #f0fdf4;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .help-section h4 {
      margin: 0 0 8px 0;
      color: #166534;
    }
    .help-section p {
      margin: 0;
      color: #15803d;
      font-size: 14px;
    }
    .help-section a {
      color: #16a34a;
      font-weight: 500;
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
      <div class="header-icon">⚠️</div>
      <h1>Payment Failed</h1>
      <p>Action required to keep your subscription active</p>
    </div>

    <div class="content">
      <h2>Hi ${merchantName},</h2>

      <p>We were unable to process your payment for <strong>${businessName}</strong>'s ${currentPlan} subscription. Please update your payment method to avoid any interruption to your service.</p>

      <div class="alert-box">
        <div class="alert-title">Payment Unsuccessful</div>
        <p class="alert-text">
          ${failureReason
            ? `Reason: ${failureReason}`
            : 'Your payment could not be processed. This may be due to insufficient funds, an expired card, or a temporary issue with your payment method.'}
        </p>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Business:</span>
          <span class="info-value">${businessName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Plan:</span>
          <span class="info-value">${currentPlan}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Amount Due:</span>
          <span class="info-value error">${amount}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value error">Payment Failed</span>
        </div>
      </div>

      <div class="cta-section">
        <a href="${updatePaymentUrl}" class="button">
          Update Payment Method
        </a>
        <br>
        <a href="${dashboardUrl}" class="secondary-button">
          View Dashboard
        </a>
      </div>

      ${retryDate ? `
      <div class="retry-info">
        <p>
          We'll automatically retry your payment on <strong>${formattedRetryDate}</strong>.
          Update your payment method before then to avoid service interruption.
        </p>
      </div>
      ` : ''}

      <div class="warning-section">
        <div class="warning-title">What happens if payment isn't resolved?</div>
        <ul class="warning-list">
          <li>Your subscription will be marked as past due</li>
          <li>After multiple failed attempts, your account will be downgraded to the Starter plan</li>
          <li>Premium features like stablecoin rewards and multi-location support will be disabled</li>
          <li>Your members and their points will be preserved, but some features may be limited</li>
        </ul>
      </div>

      <div class="help-section">
        <h4>Need Help?</h4>
        <p>
          If you believe this is an error or need assistance, please contact us at
          <a href="mailto:${supportEmail}">${supportEmail}</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Get On Blockchain. All rights reserved.</p>
      <p>You're receiving this email because you have an active subscription with Get On Blockchain.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
