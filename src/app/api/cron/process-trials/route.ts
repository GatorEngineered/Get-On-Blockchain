// src/app/api/cron/process-trials/route.ts
// Cron job endpoint to process expired trials and send expiring notifications
// Can be called by Vercel Cron, external cron service, or manually

import { NextRequest, NextResponse } from 'next/server';
import { processExpiredTrials, sendTrialExpiringEmails } from '@/app/lib/trial';

export const dynamic = 'force-dynamic';

// Optional: Protect with a secret key
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Verify cron secret if configured
  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Send trial expiring warning emails (7, 3, 1 days before)
    const emailResults = await sendTrialExpiringEmails();

    // Process actually expired trials (downgrade to Starter)
    const expiredResults = await processExpiredTrials();

    return NextResponse.json({
      success: true,
      message: `Sent ${emailResults.sent} expiring emails, processed ${expiredResults.processed} expired trials`,
      emails: emailResults,
      expired: expiredResults,
    });
  } catch (error: any) {
    console.error('[Cron Process Trials] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process trials', details: error.message },
      { status: 500 }
    );
  }
}

// POST method for manual triggers
export async function POST(req: NextRequest) {
  return GET(req);
}
