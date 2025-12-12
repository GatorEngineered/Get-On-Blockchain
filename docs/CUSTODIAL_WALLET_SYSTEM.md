# 🏦 Custodial Wallet System - Business Model Documentation

## 📊 Business Model Overview

### ❌ OLD MODEL (Platform Pays)
- Platform owner pays for all USDC payouts
- $149/month covers service AND payouts
- Platform has payout liability
- Limited scalability (capped by platform budget)

### ✅ NEW MODEL (Business Owner Pays)
- **Platform charges $149/month for the SERVICE** (SaaS fee)
- **Business owner funds their own payout wallet** (custodial model)
- **Business owner sets their own milestone and payout amounts**
- Platform has ZERO payout liability
- Infinite scalability

---

## 💡 How It Works

### For Platform (You):
1. **You charge $149/month** for:
   - Access to loyalty system
   - QR code infrastructure
   - Points tracking engine
   - Blockchain integration service
   - Dashboard and analytics
   - Technical support
   - Hosting and maintenance

2. **You provide the technology** to:
   - Generate payout wallets for each business
   - Securely encrypt and store their private keys
   - Automate USDC transfers to customers
   - Track all payout transactions
   - Monitor wallet balances
   - Alert when balances are low

3. **You earn recurring revenue** with zero payout costs:
   - $149/month × N businesses = Predictable MRR
   - No variable costs (no USDC liability)
   - Pure SaaS margins

### For Business Owners:
1. **They pay $149/month** for your platform
2. **They fund their own payout wallet** with:
   - USDC (for customer rewards)
   - MATIC (for gas fees ~$0.02 per transaction)
3. **They control their reward budget**:
   - Set milestone: "100 points = payout"
   - Set amount: "$5 USDC per payout"
   - OR: "50 points = $2.50" (more frequent, smaller rewards)
   - OR: "200 points = $20" (bigger milestone rewards)
4. **They attract loyal customers** with real stablecoin rewards

### For Customers:
1. Earn points by visiting business (scan QR code)
2. Reach milestone (e.g., 100 points)
3. Connect their wallet (MetaMask, Trust Wallet, etc.)
4. Click "Claim $5 USDC"
5. **Receive real USDC** they can spend anywhere!

---

## 🏗️ Technical Architecture

### Database Schema

```prisma
model Merchant {
  // ... existing fields ...

  // 💰 Stablecoin Payout Configuration (Premium Plan Feature)
  payoutEnabled         Boolean   // Enabled after wallet setup
  payoutWalletAddress   String?   // Business owner's payout wallet
  payoutWalletEncrypted String?   // Encrypted private key
  payoutMilestonePoints Int       // Configurable (default: 100)
  payoutAmountUSD       Float     // Configurable (default: 5.0)
  payoutNetwork         String    // "polygon" or "mumbai"

  // Wallet balance tracking
  lastBalanceCheck      DateTime?
  usdcBalance           Float?
  lowBalanceAlertSent   Boolean
}
```

### Encryption System

**File:** `src/lib/crypto/encryption.ts`

- Uses **AES-256-GCM** encryption (industry standard)
- Private keys encrypted before storing in database
- `ENCRYPTION_KEY` environment variable (32-byte hex)
- **CRITICAL:** Never change encryption key after encrypting data!

**Security:**
- Private keys NEVER stored in plaintext
- Encrypted at rest in database
- Decrypted only during payout execution
- Encryption key stored in environment variables (Vercel encrypted)

### Payout Flow

**Step 1: Business Owner Setup (One-Time)**

```
Business Owner Dashboard
    ↓
Create new wallet in MetaMask (or use existing)
    ↓
Export private key
    ↓
POST /api/merchant/setup-payout-wallet
{
  merchantSlug: "my-business",
  privateKey: "0x...",
  milestonePoints: 100,
  payoutAmount: 5.0,
  network: "mumbai"
}
    ↓
Backend verifies wallet balance
    ↓
Encrypts private key using AES-256-GCM
    ↓
Stores encrypted key in database
    ↓
Returns: "Wallet configured! Balance: 500 USDC"
```

**Step 2: Business Owner Funds Wallet**

```
Business owner buys USDC on exchange
    ↓
Withdraws to Polygon network (NOT Ethereum!)
    ↓
Sends to payout wallet address
    ↓
Funds wallet with:
  - $500-1000 USDC (for customer rewards)
  - $10 MATIC (for gas fees)
    ↓
Ready to send payouts!
```

**Step 3: Customer Claims Payout**

```
Customer reaches 100 points
    ↓
Clicks "Claim $5 USDC" button
    ↓
POST /api/rewards/payout
    ↓
Backend verifies:
  ✅ Merchant has Premium plan
  ✅ Merchant has payout wallet configured
  ✅ Member has 100+ points
  ✅ Member has wallet connected
  ✅ No recent payout (1-hour cooldown)
    ↓
Decrypt merchant's private key
    ↓
Call sendUSDC(merchantKey, customerWallet, $5)
    ↓
Polygon blockchain transfers USDC
    ↓
Deduct 100 points from customer
    ↓
Store transaction hash in database
    ↓
Customer receives $5 USDC!
```

---

## 🔒 Security Features

### Private Key Protection
- ✅ Encrypted with AES-256-GCM before database storage
- ✅ Encryption key stored in environment variables
- ✅ Decrypted only during payout execution
- ✅ Never exposed in API responses
- ✅ Never logged or transmitted

### Access Control
- ✅ Only Premium merchants can configure payouts
- ✅ Only merchant owner can set up wallet
- ✅ Wallet verification before accepting private key
- ✅ Balance checking before storing

### Transaction Security
- ✅ Double-payout prevention (1-hour cooldown)
- ✅ Rate limiting (10 requests per 10 minutes)
- ✅ Wallet signature verification (customers prove ownership)
- ✅ Points verification before sending USDC
- ✅ Transaction logging for audit trail

### Financial Security
- ✅ Each business has separate wallet (isolated funds)
- ✅ Low balance alerts (when USDC < threshold)
- ✅ Gas fee checking (ensures sufficient MATIC)
- ✅ Failed transactions logged with error details

---

## 💰 Economics

### Platform Revenue (You)
- **$149/month per Premium merchant**
- **Zero variable costs** (no payout liability)
- Example with 10 Premium merchants:
  - Monthly: $1,490
  - Annual: $17,880
  - Pure SaaS margins!

### Business Owner Costs
- **$149/month** platform fee
- **~$100-500/month** USDC for payouts (depends on customer volume)
- **~$0.40/month** gas fees (20 payouts × $0.02 each)
- **Total: ~$249-649/month** (still cheaper than traditional loyalty programs!)

### Customer Value
- **Real USDC** they can spend anywhere
- **Immediate liquidity** (no point expiration)
- **Blockchain verified** (transparent, trustless)

---

## 📈 Scalability

### Platform Scalability
- ✅ **Unlimited businesses** (each has own wallet)
- ✅ **No payout cap** (businesses pay their own costs)
- ✅ **Predictable costs** (only infrastructure/hosting)
- ✅ **Linear growth** (more merchants = more MRR)

### Business Scalability
- ✅ Control their own budget
- ✅ Adjust milestones/amounts as needed
- ✅ Start small, scale up
- ✅ Refill wallet when needed

---

## 🛠️ Implementation Guide

### Phase 1: Setup (Complete ✅)

**Files Created:**
- `src/lib/crypto/encryption.ts` - AES-256-GCM encryption
- `src/app/api/merchant/setup-payout-wallet/route.ts` - Wallet setup endpoint
- `docs/CUSTODIAL_WALLET_SYSTEM.md` - This document

**Schema Updates:**
- Added `payoutEnabled`, `payoutWalletAddress`, `payoutWalletEncrypted` to Merchant model
- Added configurable `payoutMilestonePoints` and `payoutAmountUSD`
- Added `usdcBalance` and `lastBalanceCheck` tracking

**Updated Files:**
- `src/lib/blockchain/polygon.ts` - Now accepts private key parameter
- `src/app/api/rewards/payout/route.ts` - Uses merchant's wallet and settings
- `.env.example` - Added `ENCRYPTION_KEY` documentation

### Phase 2: Business Dashboard (TODO)

Create merchant dashboard to:
- Set up payout wallet (input private key)
- View wallet balance (USDC and MATIC)
- Configure milestone and payout amount
- View payout history
- Get low balance alerts

**Endpoints Needed:**
- GET `/api/merchant/dashboard` - Get merchant info
- GET `/api/merchant/payout-history` - List all payouts
- PUT `/api/merchant/payout-settings` - Update milestone/amount
- GET `/api/merchant/wallet-balance` - Refresh balance

### Phase 3: Balance Monitoring (TODO)

- Scheduled job to check wallet balances daily
- Email alert when USDC < $100
- Email alert when MATIC < 1.0
- Dashboard warning banner

### Phase 4: Production Deployment (TODO)

- Migrate to PostgreSQL (Vercel Postgres)
- Set up Redis rate limiting (Upstash)
- Configure Sentry error monitoring
- Set up email notifications (Resend)
- Test on Polygon mainnet
- Deploy to Vercel

---

## 🎯 Business Owner Onboarding Flow

### Step 1: Sign Up for Premium
1. Business owner visits `/pricing`
2. Clicks "Get Started" on Premium ($149/mo)
3. Creates account and subscribes

### Step 2: Set Up Payout Wallet
1. Dashboard shows: "⚠️ Set up payout wallet to enable stablecoin rewards"
2. Click "Set Up Wallet"
3. Instructions:
   - "Create a new wallet in MetaMask"
   - "Export private key (Settings → Show private key)"
   - "Paste private key below"
   - "Choose network: Mumbai (testing) or Polygon (production)"
4. Optional: Configure milestone and amount
5. Click "Save Wallet"
6. System verifies wallet and shows balance

### Step 3: Fund Wallet
1. Dashboard shows: "✅ Wallet configured! Address: 0x..."
2. Shows current balance: "0 USDC, 0 MATIC"
3. Instructions:
   - "Buy USDC on Coinbase/Binance"
   - "Withdraw to Polygon network (important!)"
   - "Send to: 0x... (copy address)"
   - "Also send $10 of MATIC for gas fees"
4. Refresh balance button
5. Once funded: "✅ Ready to send payouts!"

### Step 4: Test Payout
1. Dashboard shows: "Test your payout system"
2. Create test customer account
3. Give customer 100 points manually
4. Customer claims $5 USDC
5. Verify transaction on Polygonscan
6. Dashboard shows: "✅ Payout successful!"

### Step 5: Go Live
1. Share QR code with customers
2. Customers earn points
3. Automatic payouts when they reach milestones
4. Monitor wallet balance in dashboard

---

## ❓ FAQ

### Business Owner Questions

**Q: How much USDC do I need to start?**
A: We recommend $500-1000 USDC to start. If you expect 20 customers to reach the milestone in the first month, that's 20 × $5 = $100 in payouts.

**Q: What if my wallet runs out of USDC?**
A: You'll receive an email alert when your balance drops below $100. Customers won't be able to claim payouts until you refill.

**Q: Can I change the milestone or payout amount?**
A: Yes! Update anytime in your dashboard. Changes apply to future payouts, not past ones.

**Q: Is my private key safe?**
A: Yes. We encrypt it with AES-256-GCM before storing. Only decrypted during payout execution. Never exposed in logs or API responses.

**Q: Can I use my existing business wallet?**
A: We recommend creating a dedicated payout wallet for security and accounting purposes. This way, customer rewards are separated from business funds.

**Q: What networks are supported?**
A: Polygon (mainnet) and Mumbai (testnet). We recommend testing on Mumbai first with free test tokens.

### Platform (Your) Questions

**Q: How do I make money?**
A: You charge $149/month for the platform. Business owners pay their own USDC costs. Pure SaaS revenue with no variable payout costs!

**Q: What if a business owner's wallet gets hacked?**
A: That's their responsibility, not yours. They control their own wallet. Include this in your Terms of Service. Recommend they:
- Use a dedicated payout wallet (not their main wallet)
- Start with small amounts ($100-500)
- Keep most funds in a separate wallet and refill as needed

**Q: How do I handle encryption key rotation?**
A: Don't! The encryption key should NEVER change after you start encrypting data. Store it securely in Vercel environment variables. If you ever need to rotate:
1. Decrypt all existing wallets with old key
2. Re-encrypt with new key
3. Update database
This is complex - better to keep one key forever.

**Q: What's my liability?**
A: Zero! Business owners fund their own wallets. You're providing software infrastructure, not financial services. Include clear disclaimers in Terms of Service.

---

## 🚀 Next Steps

1. **Run database migration** to add new payout fields
2. **Generate encryption key**: `openssl rand -hex 32`
3. **Add to .env**: `ENCRYPTION_KEY="..."`
4. **Build merchant dashboard** for wallet setup
5. **Test on Mumbai testnet** with free tokens
6. **Deploy to production** on Polygon mainnet
7. **Onboard first Premium customer!**

---

## 📚 Related Documentation

- `docs/STABLECOIN_PAYOUT_GUIDE.md` - Original implementation plan
- `docs/PAYOUT_IMPLEMENTATION_COMPLETE.md` - Setup instructions
- `docs/XRP_WALLET_INTEGRATION.md` - Future XRP support

---

**This is your competitive advantage!** You're not just offering points - you're enabling businesses to reward customers with real money, while you earn predictable SaaS revenue with zero payout liability. 🎉
