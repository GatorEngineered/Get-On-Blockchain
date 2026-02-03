# GetOnBlockchain Platform Guide
## Sales & Technical Reference

---

## Pricing Plans

| Plan | Monthly | Annual | Member Limit |
|------|---------|--------|--------------|
| **STARTER** | Free | Free | 5 |
| **BASIC** | $55 | $550 | 1,000 |
| **PREMIUM** | $149 | $1,490 | 25,000 |
| **GROWTH** | $249 | $2,490 | 100,000 |

- Annual billing = **2 months free** (save 17%)
- All paid plans include **7-day free trial**
- No credit card required for STARTER

---

## Feature Comparison

### Core Features (All Plans)
- QR code-based check-ins
- Unlimited rewards catalog
- Points never expire
- Basic member dashboard
- Mobile-friendly member portal

### BASIC ($55/mo)
Everything in STARTER, plus:
- Up to 1,000 active members
- **Unlimited locations**
- 4-tier member system (Rookie → Soldier → Captain → General)
- Referral program with tracking
- Email announcements to members
- Points reminder emails
- Full analytics dashboard
- Email support

### PREMIUM ($149/mo) ⭐ Most Popular
Everything in BASIC, plus:
- Up to 25,000 active members
- 6-tier member system (Rookie → Soldier → Sergeant → Captain → Major → General)
- **POS Integration** (Square, Shopify)
- **USDC stablecoin payouts**
- Points-per-dollar configuration
- Direct individual member messaging
- Blockchain-verified rewards
- API access for custom integrations
- Priority email support

### GROWTH ($249/mo)
Everything in PREMIUM, plus:
- Up to 100,000 active members
- **Custom branded loyalty token**
- Non-custodial wallet option
- Custom tier names & thresholds
- Multiple payout milestones
- Happy Hour point multipliers
- Bulk email marketing campaigns
- Advanced member analytics
- Priority support

---

## How Members Earn Points

| Method | Available On | Description |
|--------|-------------|-------------|
| QR Scan | All plans | Scan QR at location = instant points |
| Welcome Bonus | All plans | First-time sign-up bonus |
| Spend-Based | PREMIUM+ | Points per dollar via POS |
| Referrals | BASIC+ | Share code, earn when friend joins |
| Birthday | BASIC+ | Special points on birthday |
| Anniversary | BASIC+ | Points on membership anniversary |
| Happy Hour | GROWTH+ | Double points during set hours |

**Default Settings:**
- Welcome points: 10
- Points per visit: 10
- Referral bonus: 50 points
- All configurable by merchant

---

## How Redemption Works

### Traditional Rewards (All Plans)
1. Member opens app/portal
2. Selects reward from catalog
3. Generates QR code (5-10 min expiry)
4. Shows QR to staff
5. Staff scans → Points deducted → Reward given

### USDC Crypto Payouts (PREMIUM+)
1. Member reaches payout milestone (e.g., 1000 pts = $10)
2. Clicks "Claim Payout"
3. Generates redemption QR
4. Staff confirms redemption
5. USDC sent instantly to member's wallet
6. Member receives confirmation email with blockchain link

**Key Points:**
- USDC is real money ($1 = 1 USDC)
- Members can cash out via Coinbase, etc.
- Polygon network = ~$0.01 transaction fees
- Instant settlement on blockchain

---

## POS Integration (PREMIUM+)

### Supported Systems
| POS | Status | Best For |
|-----|--------|----------|
| **Square** | ✅ Ready | Retail, restaurants, services |
| **Shopify** | ✅ Ready | E-commerce, online stores |
| **Toast** | ⏳ Pending | Restaurants |
| **Clover** | ⏳ Pending | Retail, restaurants |

### How It Works
```
Customer pays at POS
       ↓
Webhook sent to GetOnBlockchain
       ↓
System matches customer email
       ↓
Points awarded automatically
       ↓
Member notified (optional)
```

**Benefits:**
- Zero friction for customers
- No scanning required
- Works with online orders too
- Configurable points-per-dollar

---

## Blockchain Features

### Member Wallets
- Auto-created for every member
- Polygon network (low fees)
- Encrypted private key storage
- Export option for full control (GROWTH+)

### USDC Payouts
- Real stablecoin, not loyalty points
- Instant blockchain settlement
- Transaction verified on-chain
- Member owns the funds completely

### Branded Tokens (GROWTH)
- Your own ERC-20 token
- Custom name and symbol
- 1 million token supply
- Trade on blockchain
- True digital loyalty currency

---

## Merchant Dashboard

### Members Section
- Full member database
- Search and filter
- Individual member profiles
- Points history
- Manual point adjustments
- Direct messaging (PREMIUM+)

### Rewards Section
- Unlimited reward catalog
- Drag-to-reorder
- Custom point costs
- Three types: In-store, USDC, Token

### Analytics
- Total members
- Points awarded
- Redemption rate
- Referral tracking
- POS sync status

### Settings
- Business info & branding
- Points configuration
- Payout wallet setup
- POS integration
- Staff management
- Email preferences

---

## API Access (PREMIUM+)

### Available Endpoints
- `POST /api/v1/points` - Award/deduct points
- `GET /api/v1/points` - Check balance
- `POST /api/v1/orders` - Create order & award points
- `POST /api/v1/members` - Create member

### Use Cases
- Custom POS integration
- Website checkout integration
- Mobile app integration
- Automated rewards
- Third-party platforms

---

## Common Questions

**Q: Do points expire?**
A: No, points never expire.

**Q: What counts as an "active member"?**
A: Members with at least one interaction in the past 12 months.

**Q: Can I downgrade plans?**
A: Yes, with a 15-day grace period to manage member limits.

**Q: How do merchants fund USDC payouts?**
A: They transfer USDC to their payout wallet. System alerts when balance is low.

**Q: Can members cash out USDC?**
A: Yes, they fully own it. Transfer to Coinbase, exchange, or spend anywhere.

**Q: Is there a per-transaction fee?**
A: No platform fees. Only blockchain gas (~$0.01 on Polygon).

---

## Sales Talking Points

### For Retail (Square Users)
> "Connect Square once and every purchase automatically earns loyalty points. Your customers don't need to scan anything - it just works."

### For E-commerce (Shopify)
> "Every online order equals automatic points. Build loyalty without any extra checkout steps."

### For Crypto-Curious Merchants
> "Give your customers real money instead of locked-in points. They redeem for USDC they can spend anywhere."

### For Brand Builders
> "Create your own digital currency - a branded loyalty token your customers actually own and can trade."

### On Pricing
> "Flat monthly fee, no per-member charges, no hidden transaction fees. Premium is just $149/month for up to 25,000 members with full POS integration."

---

## Competitive Advantages

1. **Real Money Rewards** - USDC payouts, not locked points
2. **Blockchain Native** - Transparent, verifiable, owned by members
3. **POS Integration** - Automatic point awards, zero friction
4. **Branded Tokens** - Your own digital currency (GROWTH)
5. **Fair Pricing** - No per-member fees
6. **API Access** - Integrate with any system
7. **Multi-Location** - One dashboard, all locations
8. **Non-Custodial Option** - Members own their wallets

---

## Quick Reference

**Support:** support@getonblockchain.com

**Webhook URLs:**
- Square: `/api/webhooks/square`
- Shopify: `/api/webhooks/shopify`
- Toast: `/api/webhooks/toast`
- Clover: `/api/webhooks/clover`

**Blockchain:**
- Network: Polygon
- USDC Contract: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

---

*GetOnBlockchain - Loyalty Rewards on the Blockchain*
