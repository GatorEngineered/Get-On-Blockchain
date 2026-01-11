// src/lib/email/templates/email-footer.ts

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.getonblockchain.com';

export type EmailFooterParams = {
  recipientType: 'member' | 'merchant' | 'admin' | 'staff';
  unsubscribeUrl?: string;
  showUnsubscribe?: boolean;
};

/**
 * Generate a consistent email footer with company info and unsubscribe link
 * Required by CAN-SPAM for commercial emails
 */
export function generateEmailFooter(params: EmailFooterParams): string {
  const { recipientType, unsubscribeUrl, showUnsubscribe = true } = params;
  const year = new Date().getFullYear();

  // Determine the appropriate settings URL based on recipient type
  let settingsUrl = '';
  let settingsLabel = '';

  switch (recipientType) {
    case 'member':
      settingsUrl = unsubscribeUrl || `${APP_URL}/member/settings?tab=notifications`;
      settingsLabel = 'Manage your email preferences';
      break;
    case 'merchant':
      settingsUrl = unsubscribeUrl || `${APP_URL}/dashboard/settings?tab=email`;
      settingsLabel = 'Manage your email preferences';
      break;
    case 'staff':
      settingsUrl = unsubscribeUrl || `${APP_URL}/dashboard/settings`;
      settingsLabel = 'Manage your notifications';
      break;
    case 'admin':
      // Admin emails don't have unsubscribe
      settingsUrl = '';
      settingsLabel = '';
      break;
  }

  const unsubscribeSection = showUnsubscribe && settingsUrl && recipientType !== 'admin'
    ? `
      <p style="margin: 0 0 12px 0;">
        <a href="${settingsUrl}" style="color: #6b7280; text-decoration: underline;">${settingsLabel}</a>
      </p>
    `
    : '';

  return `
    <div style="background: #f9fafb; padding: 24px 30px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
      <div style="margin-bottom: 16px;">
        <img src="${APP_URL}/logo.png" alt="Get On Blockchain" style="height: 24px; opacity: 0.7;" onerror="this.style.display='none'">
      </div>

      ${unsubscribeSection}

      <p style="margin: 0 0 8px 0;">
        Get On Blockchain is a product of Gator Engineered Technologies
      </p>

      <p style="margin: 0 0 8px 0;">
        7901 4th St N STE 300, St. Petersburg, FL 33702
      </p>

      <p style="margin: 0 0 16px 0;">
        <a href="mailto:support@getonblockchain.com" style="color: #244b7a; text-decoration: none;">support@getonblockchain.com</a>
      </p>

      <p style="margin: 0; font-size: 11px; color: #9ca3af;">
        &copy; ${year} Get On Blockchain. All rights reserved.
      </p>
    </div>
  `.trim();
}

/**
 * Generate a plain text version of the footer
 */
export function generateEmailFooterText(params: EmailFooterParams): string {
  const { recipientType, unsubscribeUrl, showUnsubscribe = true } = params;
  const year = new Date().getFullYear();

  let settingsUrl = '';
  switch (recipientType) {
    case 'member':
      settingsUrl = unsubscribeUrl || `${APP_URL}/member/settings?tab=notifications`;
      break;
    case 'merchant':
      settingsUrl = unsubscribeUrl || `${APP_URL}/dashboard/settings?tab=email`;
      break;
    case 'staff':
      settingsUrl = unsubscribeUrl || `${APP_URL}/dashboard/settings`;
      break;
  }

  const unsubscribeLine = showUnsubscribe && settingsUrl && recipientType !== 'admin'
    ? `\nManage email preferences: ${settingsUrl}\n`
    : '';

  return `
---
${unsubscribeLine}
Get On Blockchain - A product of Gator Engineered Technologies
7901 4th St N STE 300, St. Petersburg, FL 33702
support@getonblockchain.com

(c) ${year} Get On Blockchain. All rights reserved.
  `.trim();
}
