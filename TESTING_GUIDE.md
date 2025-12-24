# Testing Guide - Get On Blockchain SaaS Platform

This guide walks you through testing your loyalty rewards platform end-to-end.

## 🚀 Quick Start

### 1. Seed Test Data

First, create test merchants and customers:

```bash
npx tsx scripts/seed-test-data.ts
```

This creates:
- **Merchant**: Test Coffee Shop (owner@testcoffee.com / password123)
- **Business**: Test Coffee Shop (slug: test-coffee-shop)
- **3 Test Members**: Alice, Bob, and Charlie with random points

### 2. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

---

## 📊 Testing the Merchant (Business Owner) Experience

### Access Business Dashboard

**URL**: http://localhost:3000/dashboard

**What you'll see:**
- Total members count
- Total scans (visits)
- Points earned/redeemed stats
- Recent activity
- QR code for customers to scan

**Key Features to Test:**
1. **Stats Overview**: Verify member counts and activity
2. **QR Code**: This is what customers scan in-store
3. **Member List**: Click to view all customers

### View All Members

**URL**: http://localhost:3000/dashboard/members

**What you'll see:**
- Table of all customers
- Their points balance
- Email and contact info
- Join date

### Merchant Login (Optional)

**URL**: http://localhost:3000/login

**Credentials:**
- Email: `owner@testcoffee.com`
- Password: `password123`

---

## 👥 Testing the Customer Experience

### Customer Scan Flow

**URL**: http://localhost:3000/m/test-coffee-shop/claim

This is the URL customers visit when they scan your QR code.

#### **Step 1: Customer Registration**

When a new customer scans:

1. **Modal appears** asking for:
   - First Name
   - Last Name
   - Email
   - Address (optional)
   - Phone (optional)

2. Customer clicks **"Sign Up"**

3. **Account created** and linked to your business

#### **Step 2: Choose Reward Mode**

Customer can choose:

**Option A: Email Mode**
- Simple email-based tracking
- No blockchain wallet required
- Good for non-crypto users

**Option B: Wallet Mode**
- Enter wallet address (e.g., MetaMask)
- Select network (Polygon, Ethereum, XRPL)
- Enables crypto payouts (Premium plan)

#### **Step 3: Earn Points**

After registration:
- **10 points awarded automatically** (default)
- Success message shows: "You earned 10 points!"
- Points balance displayed

#### **Step 4: Repeat Visits**

On subsequent visits:
- Customer visits same URL
- Browser remembers them (localStorage)
- **Earns 10 more points** each visit
- Balance updates automatically

---

## 🧪 Testing Scenarios

### Scenario 1: New Customer Visit

1. Open incognito/private browser window
2. Visit: `http://localhost:3000/m/test-coffee-shop/claim`
3. Fill in customer info:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
4. Click "Sign Up"
5. Choose "Email Mode"
6. ✅ Verify: "You earned 10 points" message
7. Check dashboard: New customer appears

### Scenario 2: Returning Customer

1. Same browser as Scenario 1
2. Visit same URL again
3. ✅ Should skip registration (already registered)
4. ✅ Earn 10 more points (balance: 20)
5. Check dashboard: Points updated

### Scenario 3: Wallet Mode Customer

1. New incognito window
2. Visit customer URL
3. Register as new customer
4. Choose "Wallet Mode"
5. Enter test wallet address:
   - Address: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - Network: `polygon`
6. ✅ Verify: Points earned
7. Check dashboard: Wallet address shown

### Scenario 4: Multiple Customers

1. Use different browsers (Chrome, Firefox, Safari)
2. Register 3+ customers with different emails
3. Visit customer URL from each browser
4. Check dashboard:
   - ✅ All customers listed
   - ✅ Points balances correct
   - ✅ Total members count accurate

---

## 🔍 How the System Works

### Customer Registration Flow

```
1. Customer scans QR code → /m/[merchant]/claim
2. Fills in info → POST /api/member/register-for-business
3. System creates:
   - Member (global account)
   - BusinessMember (link to your business)
4. Stores businessMemberId in localStorage
5. Modal closes, main page loads
```

### Points Earning Flow

```
1. Customer visits after registration
2. System calls: POST /api/rewards/earn
3. Creates RewardTransaction (type: EARN)
4. Updates BusinessMember.points
5. Shows success message with balance
```

### Dashboard Data Flow

```
1. Dashboard loads → GET /api/dashboard-summary
2. Fetches:
   - All merchants you own
   - Member counts per business
   - Event stats (scans, wallet connects, etc.)
3. Renders stats and charts
```

---

## 🗂️ Database Structure

### Key Tables

**Merchant** (You, the SaaS customer)
- Business owner account
- Login credentials
- Plan settings (BASIC, PREMIUM)
- Points configuration

**Business** (Your actual business)
- Business name and slug
- Contact info
- Links to members

**Member** (End customer)
- Customer's global account
- Email, name, phone
- Can be member of multiple businesses

**BusinessMember** (Join table)
- Links Member ↔ Business
- **Points balance (per business)**
- Wallet address (optional)
- Wallet network (optional)

**RewardTransaction**
- Tracks all point movements
- Types: EARN, REDEEM, PAYOUT
- Audit trail for compliance

---

## 🎯 Key Testing Points

### ✅ Must Test

- [ ] Customer registration (new user)
- [ ] Points earning (first visit)
- [ ] Points earning (repeat visit)
- [ ] Dashboard stats accuracy
- [ ] Member list display
- [ ] QR code generation
- [ ] Email vs Wallet mode
- [ ] Multiple customers in parallel

### 🚀 Advanced Testing

- [ ] Merchant login/logout
- [ ] Multiple businesses per merchant
- [ ] Points redemption flow
- [ ] Member dashboard (customer view)
- [ ] Magic link email authentication
- [ ] Wallet signature authentication

---

## 📱 QR Code Testing

### Generate QR Code

Your customer scan URL:
```
http://localhost:3000/m/test-coffee-shop/claim
```

**Option 1: Use QR Code Generator**
- Visit: https://qr.io/ or https://www.qr-code-generator.com/
- Paste your URL
- Download QR code image

**Option 2: Mobile Testing**
- Share URL via text/email to your phone
- Open on mobile browser
- Test mobile UX

**Option 3: Print & Scan**
- Generate QR code
- Print it
- Scan with phone camera
- Should open browser to your URL

---

## 🐛 Troubleshooting

### Customer not earning points?

**Check:**
1. Is `businessMemberId` in localStorage?
   - Open DevTools → Application → Local Storage
   - Look for `gob_businessMember_test-coffee-shop`
2. Check browser console for errors
3. Verify API call: Network tab → `/api/rewards/earn`

### Dashboard shows no data?

**Check:**
1. Did you run seed script?
2. Check database: `ls prisma/dev.db` (should exist)
3. Check API: http://localhost:3000/api/dashboard-summary
4. Look for errors in terminal

### Member registration fails?

**Check:**
1. Email must be unique
2. All required fields filled
3. Browser console for error messages
4. Terminal for API errors

---

## 🎓 Understanding the Business Model

### How It Works

1. **You (Merchant)** pay monthly fee ($99-$149)
2. **Your customers (Members)** scan QR code in your store
3. **They earn points** for each visit
4. **They redeem** points for rewards
5. **You configure** point values and rewards

### Plans

- **BASIC ($99/mo)**: Points-only system
- **PREMIUM ($149/mo)**: Points + USDC stablecoin payouts
- **GROWTH/PRO**: Multi-location (future)

### Default Settings (Configurable)

- Welcome Points: 10
- Points per Visit: 10
- VIP Threshold: 100 points

---

## 🔄 Next Steps: Automation

Once testing is complete, you can:

1. **Add Merchant Signup** - Let businesses self-register
2. **Add Payment Integration** - Stripe for subscriptions
3. **Add Email Notifications** - Welcome emails, rewards alerts
4. **Add Admin Panel** - Manage all merchants
5. **Add Analytics** - Advanced reporting
6. **Add Mobile App** - Native iOS/Android apps

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console (F12)
2. Check terminal for errors
3. Verify database with Prisma Studio: `npx prisma studio`
4. Check API responses in Network tab

---

Happy Testing! 🎉
