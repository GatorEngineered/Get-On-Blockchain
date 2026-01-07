// src/app/api/cron/check-wallet-balances/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getPayoutWalletBalance } from '@/lib/blockchain/polygon';
import { decrypt } from '@/lib/crypto/encryption';
import { sendEmail } from '@/lib/email/resend';
import { sendLowBalanceEmail } from '@/lib/email/notifications';
import { generateLowBalanceAlertEmail } from '@/lib/email/templates/low-balance-alert';

const prisma = new PrismaClient();

/**
 * GET /api/cron/check-wallet-balances
 *
 * Cron job to check all merchant payout wallet balances
 * and send alerts if balance is low.
 *
 * This should be called periodically (e.g., every 6 hours) by:
 * - Vercel Cron (vercel.json)
 * - External cron service (cron-job.org, etc.)
 * - GitHub Actions scheduled workflow
 *
 * Optional query params:
 * - token: Secret token for authentication (recommended for production)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret - supports both header (Vercel Cron) and query param
    const expectedToken = process.env.CRON_SECRET;
    if (expectedToken) {
      const authHeader = req.headers.get('authorization');
      const { searchParams } = new URL(req.url);
      const queryToken = searchParams.get('token');

      const isValidHeader = authHeader === `Bearer ${expectedToken}`;
      const isValidQuery = queryToken === expectedToken;

      if (!isValidHeader && !isValidQuery) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    console.log('[Cron] Starting wallet balance check...');

    // Get all merchants with payout wallets configured
    const merchants = await prisma.merchant.findMany({
      where: {
        payoutEnabled: true,
        payoutWalletEncrypted: {
          not: null,
        },
      },
    });

    console.log(`[Cron] Found ${merchants.length} merchants with payout wallets`);

    const results = {
      checked: 0,
      updated: 0,
      lowBalanceAlerts: 0,
      errors: 0,
      details: [] as any[],
    };

    // Check each merchant's wallet balance
    for (const merchant of merchants) {
      try {
        results.checked++;

        // Decrypt private key
        const privateKey = decrypt(merchant.payoutWalletEncrypted!);

        // Get current balance
        const balance = await getPayoutWalletBalance(
          privateKey,
          merchant.payoutNetwork as 'polygon' | 'mumbai'
        );

        // Use configured low balance threshold (default $50)
        const lowBalanceThreshold = merchant.lowBalanceThreshold || 50.0;
        const isLowBalance = balance.usdcBalance < lowBalanceThreshold;

        // Update merchant record
        await prisma.merchant.update({
          where: { id: merchant.id },
          data: {
            usdcBalance: balance.usdcBalance,
            lastBalanceCheck: new Date(),
            // Only set lowBalanceAlertSent if balance is actually low
            // Reset it if balance is back to normal
            lowBalanceAlertSent: isLowBalance ? true : false,
          },
        });

        results.updated++;

        // Send low balance alert email
        if (isLowBalance && !merchant.lowBalanceAlertSent) {
          results.lowBalanceAlerts++;
          console.warn(
            `[Cron] LOW BALANCE ALERT: ${merchant.name} (${merchant.slug}) - ` +
            `$${balance.usdcBalance.toFixed(2)} USDC ` +
            `(threshold: $${lowBalanceThreshold.toFixed(2)})`
          );

          // Send email notification to merchant
          const emailSent = await sendLowBalanceEmail({
            merchantName: merchant.name,
            merchantEmail: merchant.notificationEmail || merchant.loginEmail,
            currentBalance: balance.usdcBalance,
            threshold: lowBalanceThreshold,
            walletAddress: balance.address,
            network: merchant.payoutNetwork,
          });

          // Log email event
          if (emailSent) {
            await prisma.event.create({
              data: {
                merchantId: merchant.id,
                type: 'LOW_BALANCE_ALERT',
                source: 'cron',
                metadata: {
                  balance: balance.usdcBalance,
                  threshold: lowBalanceThreshold,
                  walletAddress: balance.address,
                  emailSent: true,
                },
              },
            });
          }
        }

        // Check if balance is now sufficient for waiting members
        if (balance.usdcBalance >= merchant.payoutAmountUSD) {
          // Find members waiting for notification
          const waitingMembers = await prisma.payoutNotificationRequest.findMany({
            where: {
              merchantId: merchant.id,
              notified: false,
            },
            include: {
              member: {
                select: { firstName: true },
              },
            },
          });

          // Notify waiting members
          for (const request of waitingMembers) {
            try {
              await sendEmail({
                to: request.memberEmail,
                subject: `🎉 Your ${merchant.name} payout is ready to claim!`,
                html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .amount { font-size: 2.5em; font-weight: bold; color: #10b981; margin: 20px 0; text-align: center; }
    .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 1.1em; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Great News!</h1>
    </div>
    <div class="content">
      <p>Hi ${request.member.firstName || 'there'}!</p>
      <p>Your <strong>${merchant.name}</strong> payout is now ready to claim!</p>

      <div class="amount">$${request.payoutAmount.toFixed(2)} USDC</div>

      <p>You earned this with your <strong>${request.pointsEarned} points</strong>. Head to your dashboard to claim it now!</p>

      <center>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://app.getonblockchain.com'}/member/dashboard" class="button">
          Claim Your Reward →
        </a>
      </center>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 0.9em; color: #6b7280;">
        You received this because you requested to be notified when your payout was ready.
      </p>
    </div>
  </div>
</body>
</html>
                `,
              });

              // Mark as notified
              await prisma.payoutNotificationRequest.update({
                where: { id: request.id },
                data: {
                  notified: true,
                  notifiedAt: new Date(),
                },
              });

              console.log(`[Cron] Notified ${request.memberEmail} - payout ready for ${merchant.slug}`);
            } catch (notifyError) {
              console.error(`[Cron] Failed to notify ${request.memberEmail}:`, notifyError);
            }
          }

          if (waitingMembers.length > 0) {
            console.log(`[Cron] Notified ${waitingMembers.length} waiting members for ${merchant.slug}`);
          }
        }

        results.details.push({
          merchant: merchant.slug,
          balance: balance.usdcBalance,
          lowBalance: isLowBalance,
          address: balance.address,
        });

        console.log(
          `[Cron] ✓ ${merchant.slug}: $${balance.usdcBalance.toFixed(2)} USDC`
        );

      } catch (error: any) {
        results.errors++;
        console.error(
          `[Cron] ✗ Error checking ${merchant.slug}:`,
          error.message
        );

        results.details.push({
          merchant: merchant.slug,
          error: error.message,
        });
      }
    }

    console.log('[Cron] Wallet balance check complete:', {
      checked: results.checked,
      updated: results.updated,
      lowBalanceAlerts: results.lowBalanceAlerts,
      errors: results.errors,
    });

    return NextResponse.json({
      success: true,
      message: 'Wallet balance check complete',
      timestamp: new Date().toISOString(),
      ...results,
    });

  } catch (error: any) {
    console.error('[Cron] Fatal error during wallet balance check:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: error.message }),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}