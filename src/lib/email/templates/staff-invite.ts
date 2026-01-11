// src/lib/email/templates/staff-invite.ts

import { generateEmailFooter } from './email-footer';

export interface StaffInviteEmailParams {
  staffName: string;
  staffEmail: string;
  merchantName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
  permissions: {
    canManageMembers: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
  };
}

export function generateStaffInviteEmail({
  staffName,
  staffEmail,
  merchantName,
  inviterName,
  inviteUrl,
  expiresAt,
  permissions,
}: StaffInviteEmailParams): string {
  const formattedExpiry = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const permissionsList = [];
  if (permissions.canManageMembers) permissionsList.push('Manage members and points');
  if (permissions.canViewReports) permissionsList.push('View reports and analytics');
  if (permissions.canManageSettings) permissionsList.push('Manage business settings');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${merchantName}</title>
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
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff;
      padding: 40px 30px;
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
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
    }
    .button:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }
    .permissions-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin: 24px 0;
    }
    .permissions-title {
      font-weight: 600;
      color: #166534;
      margin: 0 0 12px 0;
    }
    .permissions-list {
      margin: 0;
      padding-left: 20px;
      color: #15803d;
    }
    .permissions-list li {
      margin: 8px 0;
    }
    .expiry-notice {
      background: #fef3c7;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 12px 16px;
      margin: 24px 0;
      font-size: 14px;
      color: #92400e;
    }
    .help-section {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      text-align: center;
    }
    .help-section p {
      margin: 0;
      color: #6b7280;
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-icon">👋</div>
      <h1>You're Invited!</h1>
      <p>Join ${merchantName} as a staff member</p>
    </div>

    <div class="content">
      <h2>Hi${staffName ? ` ${staffName}` : ''},</h2>

      <p><strong>${inviterName}</strong> has invited you to join <strong>${merchantName}</strong> as a staff member on Get On Blockchain.</p>

      <div class="info-box">
        <div class="info-row">
          <span class="info-label">Business:</span>
          <span class="info-value">${merchantName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Your Email:</span>
          <span class="info-value">${staffEmail}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Invited By:</span>
          <span class="info-value">${inviterName}</span>
        </div>
      </div>

      <div class="permissions-box">
        <p class="permissions-title">Your Access Permissions:</p>
        <ul class="permissions-list">
          ${permissionsList.map(p => `<li>${p}</li>`).join('\n          ')}
        </ul>
      </div>

      <div class="cta-section">
        <a href="${inviteUrl}" class="button">
          Accept Invitation
        </a>
      </div>

      <div class="expiry-notice">
        <strong>Note:</strong> This invitation expires on ${formattedExpiry}. After that, you'll need to request a new invitation.
      </div>

      <div class="help-section">
        <p>If you weren't expecting this invitation or have questions, please contact ${inviterName} directly.</p>
      </div>
    </div>

${generateEmailFooter({ recipientType: 'staff' })}
  </div>
</body>
</html>
  `.trim();
}
