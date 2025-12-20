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
    // Optional: Verify cron secret token
    const { searchParams } = new URL(req.url);
    const providedToken = searchParams.get('token');
    const expectedToken = process.env.CRON_SECRET;

    if (expectedToken && providedToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
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