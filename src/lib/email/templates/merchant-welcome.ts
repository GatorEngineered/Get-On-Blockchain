// src/lib/email/templates/merchant-welcome.ts

export interface MerchantWelcomeEmailParams {
  merchantName: string;
  businessName: string;
  plan: string;
  trialDays: number;
  trialEndsAt: Date;
  dashboardUrl: string;
  qrCodeUrl: string;
  supportEmail: string;
}

export function generateMerchantWelcomeEmail({
  merchantName,
  businessName,
  plan,
  trialDays,
  trialEndsAt,
  dashboardUrl,
  qrCodeUrl,
  supportEmail,
}: MerchantWelcomeEmailParams): string {
  const formattedDate = trialEndsAt.toLocaleDateString('en-US', {
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
  <title>Welcome to Get On Blockchain</title>
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
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      margin-top: 0;
      color: #111827;
      font-size: 22px;
    }
    .content p {
      margin: 16px 0;
      color: #555;
    }
    .trial-badge {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      margin: 20px 0;
    }
    .info-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #dcfce7;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #166534;
    }
    .info-value {
      color: #15803d;
    }
    .steps-section {
      margin: 32px 0;
    }
    .steps-title {
      font-size: 18px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
    }
    .step {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      align-items: flex-start;
    }
    .step-number {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
      flex-shrink: 0;
    }
    .step-content h4 {
      margin: 0 0 4px 0;
      color: #111827;
      font-size: 16px;
    }
    .step-content p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
    .cta-section {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
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
    .features-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 24px 0;
    }
    .feature {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 8px;
    }
    .feature-title {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .feature-desc {
      color: #6b7280;
      font-size: 12px;
    }
    .help-section {
      background: #eff6ff;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .help-section h4 {
      margin: 0 0 8px 0;
      color: #1e40af;
    }
    .help-section p {
      margin: 0;
      color: #3730a3;
      font-size: 14px;
    }
    .help-section a {
      color: #2563eb;
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
    @media (max-width: 480px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Get On Blockchain!</h1>
      <p>Your journey to blockchain-powered loyalty rewards starts now</p>
    </div>

    <div class="content">
      <h2>Hi ${merchantName}!</h2>

      <p>Thank you for signing up <strong>${businessName}</strong> with Get On Blockchain. We're excited to help you create an amazing loyalty program with blockchain-powered rewards!</p>

      <div style="text-align: center;">
        <div class="trial-badge">
          ${trialDays}-Day Free Trial of ${plan} Plan
        </div>
      </div>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Business:</span>
          <span class="info-value">${businessName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Plan:</span>
          <span class="info-value">${plan} (Trial)</span>
        </div>
        <div class="info-row">
          <span class="info-label">Trial Ends:</span>
          <span class="info-value">${formattedDate}</span>
        </div>
      </div>

      <div class="steps-section">
        <div class="steps-title">Get Started in 3 Easy Steps</div>

        <div class="step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4>Print Your QR Code</h4>
            <p>Download and display your unique QR code at your point of sale for customers to scan.</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4>Customize Your Rewards</h4>
            <p>Set up your loyalty tiers, point values, and reward milestones in your dashboard.</p>
          </div>
        </div>

        <div class="step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4>Enable Crypto Payouts</h4>
            <p>Connect your wallet to send USDC rewards directly to your loyal customers.</p>
          </div>
        </div>
      </div>

      <div class="cta-section">
        <a href="${dashboardUrl}" class="button">
          Go to Dashboard
        </a>
        <br>
        <a href="${qrCodeUrl}" class="secondary-button">
          Download QR Code
        </a>
      </div>

      <div class="features-grid">
        <div class="feature">
          <div class="feature-icon">📱</div>
          <div class="feature-title">QR Code Check-ins</div>
          <div class="feature-desc">Customers earn points with a simple scan</div>
        </div>
        <div class="feature">
          <div class="feature-icon">💰</div>
          <div class="feature-title">USDC Rewards</div>
          <div class="feature-desc">Send stablecoin rewards on-chain</div>
        </div>
        <div class="feature">
          <div class="feature-icon">📊</div>
          <div class="feature-title">Analytics</div>
          <div class="feature-desc">Track visits, members, and engagement</div>
        </div>
        <div class="feature">
          <div class="feature-icon">🏪</div>
          <div class="feature-title">Multi-Location</div>
          <div class="feature-desc">Manage multiple business locations</div>
        </div>
      </div>

      <div class="help-section">
        <h4>Need Help Getting Started?</h4>
        <p>
          Our team is here to help! Reply to this email or contact us at
          <a href="mailto:${supportEmail}">${supportEmail}</a>
        </p>
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Get On Blockchain. All rights reserved.</p>
      <p>You're receiving this email because you signed up for Get On Blockchain.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
