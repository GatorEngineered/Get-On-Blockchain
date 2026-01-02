# 💳 PayPal Subscriptions Setup Guide

Complete guide to setting up PayPal Subscriptions API for GetOnBlockchain.

---

## 📋 Prerequisites

1. **PayPal Business Account** (or Developer Sandbox account)
2. **PayPal REST API Credentials**
3. **Webhook URL** (for production)

---

## 🔑 Step 1: Get PayPal API Credentials

### For Development (Sandbox):

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Click **Apps & Credentials**
3. Select **Sandbox** tab
4. Click **Create App**
5. Name it: `GetOnBlockchain Subscriptions`
6. Copy your credentials:
   - **Client ID**
   - **Secret**

### For Production:

1. Same steps but select **Live** tab instead of Sandbox
2. Your live app will need approval from PayPal

---

## ⚙️ Step 2: Configure Environment Variables

Add these to your `.env` file:

```bash
# PayPal API Credentials
PAYPAL_CLIENT_ID="your_client_id_here"
PAYPAL_CLIENT_SECRET="your_secret_here"

# PayPal API Base URL
# Sandbox: https://api-m.sandbox.paypal.com
# Production: https://api-m.paypal.com
PAYPAL_API_BASE="https://api-m.sandbox.paypal.com"

# Your base URL (for return URLs)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# PayPal Product & Plan IDs (will be generated in Step 3)
PAYPAL_PRODUCT_ID=""
PAYPAL_PLAN_BASIC_MONTHLY=""
PAYPAL_PLAN_PREMIUM_MONTHLY=""
PAYPAL_PLAN_BASIC_ANNUAL=""
PAYPAL_PLAN_PREMIUM_ANNUAL=""

# PayPal Webhook ID (will be generated in Step 4)
PAYPAL_WEBHOOK_ID=""
```

---

## 🏗️ Step 3: Create Products and Plans

Run the setup script to create your PayPal products and subscription plans:

```bash
npx tsx scripts/setup-paypal-plans.ts
```

This will create:

### Product:
- **GetOnBlockchain Loyalty Platform**

### Plans:
1. **Basic Monthly** - $99/mo with 7-day free trial
2. **Premium Monthly** - $149/mo with 7-day free trial
3. **Basic Annual** - $990/year (save $198 vs monthly)
4. **Premium Annual** - $1490/year (save $298 vs monthly)

The script will output the IDs - **copy them to your `.env` file!**

Example output:
```
📋 Product ID:
   PROD-12345ABCDE

📋 Plan IDs:
   Basic Monthly         P-12345BASIC
   Premium Monthly       P-12345PREMIUM
   Basic Annual          P-12345BASICYEAR
   Premium Annual        P-12345PREMIUMYEAR
```

---

## 🪝 Step 4: Configure Webhooks

### Development (ngrok):

For local testing, use ngrok to expose your local server:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000
```

Your webhook URL will be:
```
https://YOUR-NGROK-ID.ngrok.io/api/webhooks/paypal
```

### Production:

Your webhook URL will be:
```
https://yourdomain.com/api/webhooks/paypal
```

### Set up webhook in PayPal:

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Click **Apps & Credentials**
3. Select your app
4. Scroll to **Webhooks**
5. Click **Add Webhook**
6. Enter your webhook URL
7. Select these events:
   - ✅ `BILLING.SUBSCRIPTION.ACTIVATED`
   - ✅ `BILLING.SUBSCRIPTION.UPDATED`
   - ✅ `BILLING.SUBSCRIPTION.CANCELLED`
   - ✅ `BILLING.SUBSCRIPTION.SUSPENDED`
   - ✅ `BILLING.SUBSCRIPTION.EXPIRED`
   - ✅ `PAYMENT.SALE.COMPLETED`
   - ✅ `PAYMENT.SALE.DENIED`
   - ✅ `PAYMENT.SALE.REFUNDED`

8. Save webhook
9. Copy the **Webhook ID** and add to `.env`:
   ```bash
   PAYPAL_WEBHOOK_ID="your_webhook_id_here"
   ```

---

## 🧪 Step 5: Test Subscription Flow

### 1. Start your dev server:
```bash
npm run dev
```

### 2. Test subscription creation:

Use your API endpoint:
```javascript
const response = await fetch('/api/merchant/subscription/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantId: 'YOUR_MERCHANT_ID',
    planType: 'BASIC_MONTHLY',
    email: 'customer@example.com',
    firstName: 'John',
    lastName: 'Doe',
  }),
});

const { approvalUrl } = await response.json();
// Redirect user to approvalUrl
window.location.href = approvalUrl;
```

### 3. Complete payment:

- You'll be redirected to PayPal checkout
- In sandbox, use [PayPal test credentials](https://developer.paypal.com/tools/sandbox/accounts/)
- Complete the subscription

### 4. Verify webhook:

- Check your server logs for webhook events
- Verify merchant status updated in database

---

## 📊 Subscription Lifecycle

```
1. Trial (7 days)
   ├─ Status: TRIAL
   ├─ paymentVerified: false
   └─ User can test all features

2. Active (paying)
   ├─ Status: ACTIVE
   ├─ paymentVerified: true
   └─ Full access

3. Past Due (payment failed)
   ├─ Status: PAST_DUE
   ├─ Grace period (3 attempts)
   └─ Limited features

4. Cancelled
   ├─ Status: CANCELED
   └─ Access until period end

5. Expired
   ├─ Status: EXPIRED
   └─ No access
```

---

## 🔐 Webhook Event Handling

Our webhook handler (`/api/webhooks/paypal`) processes these events:

| Event | Action |
|-------|--------|
| `BILLING.SUBSCRIPTION.ACTIVATED` | Set status to TRIAL or ACTIVE |
| `BILLING.SUBSCRIPTION.UPDATED` | Sync subscription status |
| `BILLING.SUBSCRIPTION.CANCELLED` | Mark as CANCELED |
| `BILLING.SUBSCRIPTION.SUSPENDED` | Mark as PAST_DUE |
| `BILLING.SUBSCRIPTION.EXPIRED` | Mark as EXPIRED |
| `PAYMENT.SALE.COMPLETED` | Mark as ACTIVE, paymentVerified=true |
| `PAYMENT.SALE.DENIED` | Mark as PAST_DUE |

---

## 🛠️ Troubleshooting

### "PayPal credentials not configured"
- Check `.env` file has `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET`
- Restart your dev server after adding credentials

### "Plan not configured"
- Run `npx tsx scripts/setup-paypal-plans.ts`
- Copy plan IDs to `.env`
- Restart server

### Webhook not receiving events
- Check ngrok is running (for local dev)
- Verify webhook URL in PayPal dashboard
- Check webhook events are selected
- Look for webhook logs in PayPal dashboard

### Subscription status not updating
- Check webhook handler logs
- Verify `PAYPAL_WEBHOOK_ID` in `.env`
- Test webhook signature verification is passing

---

## 📚 API Reference

### Create Subscription
```typescript
POST /api/merchant/subscription/create

Body:
{
  merchantId: string;
  planType: 'BASIC_MONTHLY' | 'PREMIUM_MONTHLY' | 'BASIC_ANNUAL' | 'PREMIUM_ANNUAL';
  email: string;
  firstName?: string;
  lastName?: string;
}

Response:
{
  subscriptionId: string;
  approvalUrl: string; // Redirect here
  status: string;
}
```

### Webhook Endpoint
```typescript
POST /api/webhooks/paypal

Headers:
- paypal-transmission-id
- paypal-transmission-time
- paypal-transmission-sig
- paypal-cert-url
- paypal-auth-algo

Body: PayPal webhook event
```

---

## 🚀 Going Live

1. **Switch to Production API**:
   ```bash
   PAYPAL_API_BASE="https://api-m.paypal.com"
   ```

2. **Get Live Credentials**:
   - Create live app in PayPal dashboard
   - Copy live Client ID and Secret

3. **Run setup script again** (for live environment):
   ```bash
   npx tsx scripts/setup-paypal-plans.ts
   ```

4. **Update webhook URL**:
   - Point to your production domain
   - Update in PayPal dashboard

5. **Test thoroughly** with real PayPal accounts

---

## 💡 Next Steps

- [ ] Set up email notifications (Resend)
- [ ] Build billing portal UI
- [ ] Add subscription upgrade/downgrade
- [ ] Implement trial expiration reminders
- [ ] Add analytics tracking

---

## 📖 Resources

- [PayPal Subscriptions API Docs](https://developer.paypal.com/docs/subscriptions/)
- [PayPal Webhook Events](https://developer.paypal.com/api/rest/webhooks/event-names/)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)
- [PayPal REST API Reference](https://developer.paypal.com/api/rest/)
