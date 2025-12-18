# Wallet Balance Monitoring

 

This guide explains the automated wallet balance monitoring system that alerts merchants when their payout wallet balance is running low.

 

## Overview

 

The balance monitoring system:

- **Checks** all merchant payout wallets every 6 hours

- **Alerts** merchants via email when balance is low or critical

- **Tracks** balance history in the database

- **Prevents** payout failures due to insufficient funds

 

## How It Works

 

### 1. Scheduled Cron Job

 

The system uses a scheduled cron job that runs periodically:

 

**Endpoint**: `/api/cron/check-balances`

**Schedule**: Every 6 hours (can be customized)

**Authentication**: Protected by `CRON_SECRET` token

 

### 2. Balance Thresholds

 

```typescript

const LOW_BALANCE_THRESHOLD = 50;      // $50 USDC - Warning

const CRITICAL_BALANCE_THRESHOLD = 20; // $20 USDC - Urgent

```

 

- **OK** (≥ $50): No alert, business as usual

- **LOW** (< $50): Warning email sent to merchant

- **CRITICAL** (< $20): Urgent email sent to merchant

 

### 3. Alert Logic

 

- Alert is sent **once** when threshold is crossed

- No duplicate alerts until balance is restored

- Flag is reset when balance returns to healthy level

 

## Setup Instructions

 

### Vercel Deployment (Recommended)

 

Vercel provides built-in cron job support. The configuration is in `vercel.json`:

 

```json

{

  "crons": [

    {

      "path": "/api/cron/check-balances",

      "schedule": "0 */6 * * *"

    }

  ]

}

```

 

**Schedule format**: Uses standard cron syntax

- `0 */6 * * *` = Every 6 hours at minute 0

- `0 0 * * *` = Daily at midnight

- `0 */1 * * *` = Every hour

 

**Important**:

1. Cron jobs are only available on **Vercel Pro** plan ($20/month)

2. Free tier does not support cron jobs

3. Alternative: Use external cron services (see below)

 

### Alternative: External Cron Services

 

If not using Vercel Pro, use an external service to trigger the endpoint:

 

#### Option 1: Cron-job.org (Free)

 

1. Visit [https://cron-job.org](https://cron-job.org)

2. Create account

3. Create new cron job:

   - **URL**: `https://yourdomain.com/api/cron/check-balances?token=YOUR_CRON_SECRET`

   - **Schedule**: `0 */6 * * *`

   - **Method**: GET

 

#### Option 2: EasyCron (Free tier available)

 

1. Visit [https://www.easycron.com](https://www.easycron.com)

2. Create account (free tier: 1 cron job)

3. Add cron job:

   - **URL**: `https://yourdomain.com/api/cron/check-balances?token=YOUR_CRON_SECRET`

   - **Schedule**: Every 6 hours

 

#### Option 3: GitHub Actions (Free)

 

Create `.github/workflows/check-balances.yml`:

 

```yaml

name: Check Merchant Balances

 

on:

  schedule:

    # Runs every 6 hours

    - cron: '0 */6 * * *'

  workflow_dispatch: # Manual trigger

 

jobs:

  check-balances:

    runs-on: ubuntu-latest

    steps:

      - name: Trigger balance check

        run: |

          curl -X GET "https://yourdomain.com/api/cron/check-balances?token=${{ secrets.CRON_SECRET }}"

```

 

Add `CRON_SECRET` to GitHub repository secrets.

 

#### Option 4: Railway Cron (If using Railway)

 

Railway has built-in cron support. Add to `railway.json`:

 

```json

{

  "crons": [

    {

      "schedule": "0 */6 * * *",

      "command": "curl https://yourdomain.com/api/cron/check-balances?token=$CRON_SECRET"

    }

  ]

}

```

 

### Environment Variables

 

Ensure these are set in your production environment:

 

```bash

# Required for cron authentication

CRON_SECRET="your-secure-secret-here"

 

# Required for email alerts

RESEND_API_KEY="re_..."

FROM_EMAIL="noreply@yourdomain.com"

 

# Required for blockchain queries

ENCRYPTION_KEY="..." # To decrypt merchant wallet keys

```

 

## Testing the Cron Job

 

### Manual Test

 

Trigger the endpoint manually:

 

```bash

curl "http://localhost:3000/api/cron/check-balances?token=YOUR_CRON_SECRET"

```

 

Expected response:

 

```json

{

  "success": true,

  "message": "Balance check complete",

  "timestamp": "2025-01-15T10:30:00.000Z",

  "summary": {

    "totalChecked": 5,

    "ok": 3,

    "low": 1,

    "critical": 1,

    "errors": 0,

    "alertsSent": 2

  },

  "results": [

    {

      "merchantId": "cm1abc...",

      "merchantSlug": "coffee-shop",

      "balance": 125.50,

      "status": "ok",

      "alertSent": false

    },

    {

      "merchantId": "cm1def...",

      "merchantSlug": "pizza-place",

      "balance": 35.00,

      "status": "low",

      "alertSent": true

    }

  ]

}

```

 

### Test with Low Balance

 

To test the alert system without draining a real wallet:

 

1. Temporarily lower the threshold in the code:

   ```typescript

   const LOW_BALANCE_THRESHOLD = 1000; // Set higher than current balance

   ```

 

2. Run the cron job manually

 

3. Check that email alert is sent

 

4. Restore the original threshold

 

## Monitoring Dashboard

 

### View Current Balances

 

Check merchant balances in the database:

 

```sql

SELECT

  slug,

  name,

  usdcBalance,

  lastBalanceCheck,

  lowBalanceAlertSent

FROM Merchant

WHERE payoutEnabled = true

ORDER BY usdcBalance ASC;

```

 

### Check Alert Status

 

```sql

-- Merchants with active low balance alerts

SELECT slug, name, usdcBalance, lastBalanceCheck

FROM Merchant

WHERE lowBalanceAlertSent = true;

 

-- Merchants that haven't been checked recently (potential issue)

SELECT slug, name, lastBalanceCheck

FROM Merchant

WHERE payoutEnabled = true

  AND (lastBalanceCheck IS NULL OR lastBalanceCheck < datetime('now', '-12 hours'));

```

 

## Email Alert Example

 

Merchants receive an email like this when balance is low:

 

**Subject**: ⚠️ Low Wallet Balance Alert - Coffee Shop

 

**Body**:

```

⚠️ Low Wallet Balance Alert

 

Action Required: Coffee Shop

 

Your merchant wallet balance has fallen below the recommended threshold.

This may affect your ability to process customer reward payouts.

 

Current Balance: $35.00 USDC

Alert Threshold: $50.00 USDC

 

Wallet Address: 0x1234...5678

Network: Polygon

 

Next Steps:

1. Review your recent payout activity in the dashboard

2. Transfer USDC to your merchant wallet address above

3. Ensure you have sufficient balance for upcoming payouts

4. Consider setting up automatic top-ups to prevent future alerts

 

[Go to Dashboard]

 

💡 Tip: We recommend maintaining a balance of at least $100.00 USDC

to ensure uninterrupted payout processing.

 

⚡ Important: Customer payout requests will fail if your wallet balance

is insufficient!

```

 

## Customization

 

### Adjust Check Frequency

 

Edit `vercel.json`:

 

```json

{

  "crons": [

    {

      "path": "/api/cron/check-balances",

      "schedule": "0 */1 * * *"  // Every hour

    }

  ]

}

```

 

**Common schedules**:

- `0 */1 * * *` - Every hour

- `0 */6 * * *` - Every 6 hours (default)

- `0 0 * * *` - Daily at midnight

- `0 0,12 * * *` - Twice daily (midnight and noon)

 

### Adjust Balance Thresholds

 

Edit `/src/app/api/cron/check-balances/route.ts`:

 

```typescript

// Customize thresholds based on your business needs

const LOW_BALANCE_THRESHOLD = 100;     // $100 USDC

const CRITICAL_BALANCE_THRESHOLD = 50; // $50 USDC

```

 

### Add Additional Alerts

 

Add Slack, Discord, or SMS alerts:

 

```typescript

// After email alert

if (status !== 'ok') {

  // Send Slack notification

  await fetch(process.env.SLACK_WEBHOOK_URL!, {

    method: 'POST',

    body: JSON.stringify({

      text: `⚠️ Low balance alert: ${merchant.name} - $${balance} USDC`,

    }),

  });

 

  // Send SMS via Twilio

  if (status === 'critical') {

    await twilioClient.messages.create({

      to: merchant.phone,

      from: process.env.TWILIO_PHONE,

      body: `URGENT: Your ${merchant.name} wallet balance is critically low ($${balance})`,

    });

  }

}

```

 

### Per-Merchant Thresholds

 

Allow merchants to set their own thresholds:

 

1. Add fields to Prisma schema:

   ```prisma

   model Merchant {

     // ... existing fields

     lowBalanceThreshold     Float? @default(50.0)

     criticalBalanceThreshold Float? @default(20.0)

   }

   ```

 

2. Update cron job to use merchant-specific thresholds:

   ```typescript

   const LOW_BALANCE_THRESHOLD = merchant.lowBalanceThreshold || 50;

   const CRITICAL_BALANCE_THRESHOLD = merchant.criticalBalanceThreshold || 20;

   ```

 

## Logs and Debugging

 

### View Cron Logs in Vercel

 

1. Go to Vercel Dashboard → Your Project

2. Click **Deployments** → Select latest deployment

3. Click **Functions** → Find `api/cron/check-balances`

4. View execution logs

 

### Check Recent Executions

 

```bash

# Search Vercel logs for cron executions

vercel logs --filter="[Cron] Starting balance check"

```

 

### Debug Failed Checks

 

Common issues:

 

1. **Authentication failed**

   - Check `CRON_SECRET` is set correctly

   - Verify URL includes `?token=` parameter

 

2. **Decryption failed**

   - Check `ENCRYPTION_KEY` matches production

   - Verify merchant wallet was encrypted with same key

 

3. **Blockchain query failed**

   - Check network RPC is responding

   - Verify wallet address is valid

   - Check Polygon/Mumbai network status

 

4. **Email failed**

   - Verify `RESEND_API_KEY` is valid

   - Check Resend quota hasn't been exceeded

   - Verify `FROM_EMAIL` domain is verified

 

## Security Considerations

 

### Protect Cron Endpoint

 

The cron endpoint is protected by token authentication:

 

```typescript

if (token !== process.env.CRON_SECRET) {

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

}

```

 

**Best practices**:

- Use a strong, random `CRON_SECRET` (32+ characters)

- Never commit the secret to git

- Rotate the secret periodically

- Monitor for unauthorized access attempts

 

### Rate Limiting

 

Consider adding rate limiting to prevent abuse:

 

```typescript

// At top of route handler

import { checkRateLimit } from '@/lib/redis/upstash';

 

const ip = req.headers.get('x-forwarded-for') || 'unknown';

const rateLimit = await checkRateLimit(`cron:${ip}`, 10, 3600);

 

if (!rateLimit.allowed) {

  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

}

```

 

## Performance Optimization

 

### Parallel Balance Checks

 

For many merchants, check balances in parallel:

 

```typescript

const results = await Promise.allSettled(

  merchants.map(merchant => checkMerchantBalance(merchant))

);

```

 

### Cache Balance Checks

 

Skip check if recently updated:

 

```typescript

const ONE_HOUR = 60 * 60 * 1000;

const lastCheck = merchant.lastBalanceCheck?.getTime() || 0;

 

if (Date.now() - lastCheck < ONE_HOUR) {

  console.log(`[Cron] Skipping ${merchant.slug} - checked recently`);

  continue;

}

```

 

## Next Steps

 

After setting up balance monitoring:

 

1. ✅ Test cron job manually

2. ✅ Verify email alerts are sent

3. ✅ Monitor first few automated runs

4. ✅ Set up Sentry alerts for cron failures

5. ✅ Document process for merchants

 

## Resources

 

- [Vercel Cron Jobs Documentation](https://vercel.com/docs/cron-jobs)

- [Cron Syntax Reference](https://crontab.guru/)

- [GitHub Actions Cron](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)

 

---

 

Need help? Check troubleshooting section or open an issue on GitHub.

 