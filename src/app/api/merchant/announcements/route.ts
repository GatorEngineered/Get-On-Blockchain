// src/app/api/merchant/announcements/route.ts
// API for merchants to send announcements/promotions to members
// Respects member email preferences and includes CAN-SPAM compliant footers

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { sendEmail } from '@/app/lib/email/resend';

export const dynamic = 'force-dynamic';

// Email type mapping to member preference fields
const EMAIL_TYPE_TO_PREFERENCE: Record<string, string> = {
  PROMOTIONAL: 'emailMerchantPromotional',
  ANNOUNCEMENT: 'emailMerchantAnnouncements',
  POINTS_UPDATE: 'emailMerchantPointsUpdates',
};

// Generate CAN-SPAM compliant email HTML
function generateEmailHtml({
  merchantName,
  emailType,
  subject,
  messageBody,
  memberEmail,
}: {
  merchantName: string;
  emailType: string;
  subject: string;
  messageBody: string;
  memberEmail: string;
}): string {
  const emailTypeLabel = {
    PROMOTIONAL: 'Promotional Offer',
    ANNOUNCEMENT: 'Business Announcement',
    POINTS_UPDATE: 'Points Update',
  }[emailType] || 'Message';

  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://getonblockchain.com'}/member/settings?tab=notifications`;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; max-width: 100%;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #244b7a 0%, #3b6ea5 100%); padding: 32px 40px; text-align: center;">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'https://getonblockchain.com'}/getonblockchain-logo-resized.png" alt="Get On Blockchain" width="48" height="48" style="margin-bottom: 16px; border-radius: 8px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                ${merchantName}
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">
                via Get On Blockchain
              </p>
            </td>
          </tr>

          <!-- Email Type Badge -->
          <tr>
            <td style="padding: 24px 40px 0 40px; text-align: center;">
              <span style="display: inline-block; padding: 6px 16px; background-color: #eff6ff; color: #1e40af; font-size: 12px; font-weight: 600; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${emailTypeLabel}
              </span>
            </td>
          </tr>

          <!-- Subject Line -->
          <tr>
            <td style="padding: 24px 40px 0 40px;">
              <h2 style="margin: 0; color: #1f2937; font-size: 22px; font-weight: 600; line-height: 1.4;">
                ${subject}
              </h2>
            </td>
          </tr>

          <!-- Message Body -->
          <tr>
            <td style="padding: 24px 40px;">
              <div style="color: #374151; font-size: 16px; line-height: 1.7;">
                ${messageBody.replace(/\n/g, '<br>')}
              </div>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 0 40px 32px 40px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://getonblockchain.com'}/member/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #244b7a 0%, #3b6ea5 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                View Your Rewards
              </a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 0;">
            </td>
          </tr>

          <!-- Footer - CAN-SPAM Compliance -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center;">
                    <!-- Why you received this -->
                    <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; line-height: 1.5;">
                      You received this email because you're a loyalty member of <strong>${merchantName}</strong>
                      and have opted in to receive ${emailTypeLabel.toLowerCase()} emails.
                    </p>

                    <!-- Unsubscribe Link -->
                    <p style="margin: 0 0 24px 0;">
                      <a href="${unsubscribeUrl}" style="color: #244b7a; font-size: 13px; text-decoration: underline;">
                        Manage your email preferences
                      </a>
                    </p>

                    <!-- Company Info - CAN-SPAM Required -->
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                      Sent via <strong>Get On Blockchain</strong>
                    </p>
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px;">
                      Get On Blockchain LLC<br>
                      123 Business Ave, Suite 100<br>
                      Orlando, FL 32801, USA
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      <a href="mailto:support@getonblockchain.com" style="color: #9ca3af; text-decoration: none;">
                        support@getonblockchain.com
                      </a>
                    </p>

                    <!-- Copyright -->
                    <p style="margin: 24px 0 0 0; color: #d1d5db; font-size: 11px;">
                      &copy; ${currentYear} Get On Blockchain. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// POST - Send announcement to member(s)
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await req.json();
    const { emailType, subject, messageBody, memberIds, sendToAll } = body;

    // Validate required fields
    if (!emailType || !['PROMOTIONAL', 'ANNOUNCEMENT', 'POINTS_UPDATE'].includes(emailType)) {
      return NextResponse.json(
        { error: 'Invalid email type. Must be PROMOTIONAL, ANNOUNCEMENT, or POINTS_UPDATE.' },
        { status: 400 }
      );
    }

    if (!subject || subject.trim().length === 0) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    if (!messageBody || messageBody.trim().length === 0) {
      return NextResponse.json({ error: 'Message body is required' }, { status: 400 });
    }

    if (!sendToAll && (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0)) {
      return NextResponse.json(
        { error: 'Either sendToAll must be true or memberIds must be provided' },
        { status: 400 }
      );
    }

    // Get merchant info
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // Get the preference field name for this email type
    const preferenceField = EMAIL_TYPE_TO_PREFERENCE[emailType];

    // Build query for members
    let membersQuery: any = {
      where: {
        merchantMembers: {
          some: {
            merchantId: merchantId,
          },
        },
        // Only include members who have opted in for this email type
        [preferenceField]: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
      },
    };

    // If not sending to all, filter by specific member IDs
    if (!sendToAll && memberIds) {
      membersQuery.where.id = { in: memberIds };
    }

    const eligibleMembers = await prisma.member.findMany(membersQuery);

    if (eligibleMembers.length === 0) {
      return NextResponse.json(
        {
          error: 'No eligible recipients found. Members may have opted out of this type of email.',
          sentCount: 0,
          skippedCount: sendToAll ? 0 : (memberIds?.length || 0),
        },
        { status: 400 }
      );
    }

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const member of eligibleMembers) {
      try {
        const html = generateEmailHtml({
          merchantName: merchant.name,
          emailType,
          subject,
          messageBody,
          memberEmail: member.email,
        });

        await sendEmail({
          to: member.email,
          subject: `${merchant.name}: ${subject}`,
          html,
        });

        results.sent++;
      } catch (err: any) {
        console.error(`[Announcements] Failed to send to ${member.email}:`, err);
        results.failed++;
        results.errors.push(`Failed to send to ${member.firstName || member.email}: ${err.message}`);
      }
    }

    // Log the announcement activity
    console.log(`[Announcements] Merchant ${merchantId} sent ${emailType} to ${results.sent} members`);

    return NextResponse.json({
      success: true,
      message: `Announcement sent to ${results.sent} member${results.sent !== 1 ? 's' : ''}`,
      sentCount: results.sent,
      failedCount: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error: any) {
    console.error('[Announcements POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send announcement', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get count of eligible recipients for preview
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gob_merchant_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const merchantId = session.merchantId;

    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const emailType = searchParams.get('emailType') || 'ANNOUNCEMENT';

    const preferenceField = EMAIL_TYPE_TO_PREFERENCE[emailType];
    if (!preferenceField) {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    // Count members who have opted in for this email type
    const eligibleCount = await prisma.member.count({
      where: {
        merchantMembers: {
          some: {
            merchantId: merchantId,
          },
        },
        [preferenceField]: true,
      },
    });

    const totalCount = await prisma.member.count({
      where: {
        merchantMembers: {
          some: {
            merchantId: merchantId,
          },
        },
      },
    });

    return NextResponse.json({
      eligibleCount,
      totalCount,
      optedOutCount: totalCount - eligibleCount,
      emailType,
    });
  } catch (error: any) {
    console.error('[Announcements GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get recipient count', details: error.message },
      { status: 500 }
    );
  }
}
