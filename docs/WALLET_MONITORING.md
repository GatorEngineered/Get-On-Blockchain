# Wallet Balance Monitoring System

This document explains how the automated wallet balance monitoring system works and how to set it up.

## Overview

The wallet balance monitoring system automatically checks all merchant payout wallet balances every 6 hours and sends alerts when balances are low.

## How It Works

1. **Cron Job**: Runs every 6 hours (configurable in `vercel.json`)
2. **Balance Check**: Queries blockchain for each merchant's USDC balance
3. **Low Balance Detection**: Compares balance to threshold (10x payout amount)
4. **Database Update**: Updates merchant records with current balances
5. **Alerts**: Logs warnings and sends email notifications (TODO) for low balances

## Setup

### 1. Local Development

The cron job can be tested locally by calling the API endpoint directly:

```bash
curl http://localhost:3000/api/cron/check-wallet-balances?token=your-secret-here
```

### 2. Vercel Deployment

Vercel Cron is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-wallet-balances",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

**Schedule Format**: [Cron expression](https://crontab.guru/)
- `0 */6 * * *` = Every 6 hours at minute 0
- `0 */4 * * *` = Every 4 hours
- `0 0 * * *` = Daily at midnight

**Note**: Vercel Cron is available on Pro and Enterprise plans. For Hobby plans, use an external cron service.

### 3. External Cron Services (Alternative)

If Vercel Cron is not available, use an external service:

#### Option A: GitHub Actions

Create `.github/workflows/cron-wallet-check.yml`:

```yaml
name: Check Wallet Balances
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Allow manual trigger

jobs:
  check-balances:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron Endpoint
        run: |
          curl -X GET \
            "${{ secrets.APP_URL }}/api/cron/check-wallet-balances?token=${{ secrets.CRON_SECRET }}"
```

Add secrets in GitHub repo settings:
- `APP_URL`: Your deployed app URL (e.g., https://your-app.vercel.app)
- `CRON_SECRET`: Same value as your `CRON_SECRET` env variable

#### Option B: Cron-Job.org

1. Sign up at [cron-job.org](https://cron-job.org)
2. Create new cron job:
   - URL: `https://your-app.vercel.app/api/cron/check-wallet-balances?token=YOUR_SECRET`
   - Schedule: Every 6 hours
   - Method: GET

#### Option C: EasyCron

1. Sign up at [easycron.com](https://www.easycron.com)
2. Create cron job with same URL and schedule

## Environment Variables

Add to your `.env` and Vercel environment variables:

```bash
# Optional: Secret token to authenticate cron requests
# Generate with: openssl rand -hex 32
CRON_SECRET="your-random-secret-here"
```

**Note**: If `CRON_SECRET` is not set, the endpoint will be publicly accessible (not recommended for production).

## Low Balance Thresholds

The system calculates low balance thresholds based on each merchant's payout settings:

```
Low Balance Threshold = Payout Amount × 10
```

**Examples**:
- Payout Amount: $5 → Low Balance Threshold: $50
- Payout Amount: $10 → Low Balance Threshold: $100

When balance falls below this threshold, the system:
1. Sets `lowBalanceAlertSent` to `true`
2. Logs a warning in the console
3. TODO: Sends email notification to merchant

## Monitoring Cron Jobs

### Check Last Run

Query the database to see when balances were last checked:

```sql
SELECT
  name,
  slug,
  usdcBalance,
  lastBalanceCheck,
  lowBalanceAlertSent
FROM Merchant
WHERE payoutEnabled = true
ORDER BY lastBalanceCheck DESC;
```

### Vercel Logs

View cron execution logs in Vercel Dashboard:
1. Go to your project
2. Click "Deployments"
3. Click on your deployment
4. Click "Functions"
5. Find `/api/cron/check-wallet-balances`

### Manual Trigger

Test the cron job manually:

```bash
# Local
curl http://localhost:3000/api/cron/check-wallet-balances?token=your-secret

# Production
curl https://your-app.vercel.app/api/cron/check-wallet-balances?token=your-secret
```

## Response Format

Successful response:

```json
{
  "success": true,
  "message": "Wallet balance check complete",
  "timestamp": "2025-01-15T12:00:00.000Z",
  "checked": 5,
  "updated": 5,
  "lowBalanceAlerts": 1,
  "errors": 0,
  "details": [
    {
      "merchant": "coffee-shop",
      "balance": 245.50,
      "lowBalance": false,
      "address": "0x123..."
    },
    {
      "merchant": "pizza-place",
      "balance": 25.00,
      "lowBalance": true,
      "address": "0x456..."
    }
  ]
}
```

Error response:

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Error message here",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel Plan**: Cron requires Pro or Enterprise
2. **Check vercel.json**: Ensure it's in the project root
3. **Redeploy**: Push a new commit to trigger cron setup
4. **Check Logs**: View function logs in Vercel dashboard

### Balance Not Updating

1. **Check Encryption**: Ensure `ENCRYPTION_KEY` is set correctly
2. **Check Network**: Verify merchants are using correct network (mumbai/polygon)
3. **Check RPC**: Ensure Polygon RPC endpoints are accessible
4. **Check Logs**: Review error messages in cron response

### Low Balance Alerts Not Sending

1. **Email Integration**: Email notifications are TODO - currently only console logs
2. **Check Threshold**: Verify balance is actually below threshold
3. **Check Flag**: `lowBalanceAlertSent` prevents duplicate alerts

## Next Steps

- [ ] Implement email notifications for low balance alerts
- [ ] Add SMS notifications (Twilio)
- [ ] Add webhook support for custom integrations
- [ ] Add Slack/Discord notifications
- [ ] Create dashboard widget showing cron job health
- [ ] Add retry logic for failed balance checks

## Security Considerations

1. **Authentication**: Always use `CRON_SECRET` in production
2. **Rate Limiting**: Consider adding rate limiting to prevent abuse
3. **Private Keys**: Never log or expose decrypted private keys
4. **Network Access**: Ensure only authorized services can trigger cron

## Cost Considerations

- **Vercel Cron**: Included in Pro/Enterprise plans
- **GitHub Actions**: 2,000 free minutes/month
- **Blockchain RPC**: Free tier sufficient for most use cases
- **External Cron**: Most services have free tiers
