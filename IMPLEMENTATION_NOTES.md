# Implementation Notes - Multi-Wallet Support & Pricing Updates

## Summary

This implementation adds comprehensive multi-wallet support, new pricing tiers, and enhanced security features to Get On Blockchain.

## Changes Made

### 1. Pricing Tiers ✅

#### New Tiers Added:
- **Basic ($99/month)**: Points & rewards only, no blockchain complexity
  - QR-based loyalty
  - Redeem for products/discounts
  - Up to 1,000 active members
  - $199 one-time setup

- **Premium ($149/month)**: Blockchain-verified stablecoin rewards
  - Everything in Basic
  - Stablecoin rewards (USDC, USDT, DAI)
  - Multi-wallet support
  - Blockchain verification
  - Up to 5,000 active members
  - $249 one-time setup

#### Commented Out (for future):
- Growth ($249/month)
- Pro/Enterprise ($349/month)

**Files Modified**:
- `src/app/components/Pricing.tsx`
- `src/app/pricing/PricingPageClient.tsx`

### 2. Multi-Wallet Support ✅

#### Wallets Supported:
- ✅ **MetaMask** (already implemented)
- ✅ **Trust Wallet**
- ✅ **Coinbase Wallet**
- ✅ **BNB Wallet** (Binance Chain Wallet)
- ✅ **WalletConnect** (supports 300+ wallets)
- ❌ **Xaman/Xumm** (XRP Ledger) - documented for future implementation

#### Blockchains Supported:
- Ethereum Mainnet
- Polygon (MATIC)
- BNB Smart Chain (BSC)

**Files Modified**:
- `src/app/providers/WalletProviders.tsx` - Added RainbowKit configuration
- `src/app/components/WalletConnectButton.tsx` - Updated to use RainbowKit UI

**Dependencies Added**:
```json
{
  "@rainbow-me/rainbowkit": "^2.2.10"
}
```

### 3. Wallet Signature Verification ✅

Added cryptographic verification to prevent wallet address spoofing.

**Flow**:
1. User connects wallet
2. Backend generates random nonce
3. User signs message with nonce
4. Backend verifies signature matches address
5. Only then store wallet address

**Files Created**:
- `src/app/api/wallet/nonce/route.ts` - Nonce generation endpoint

**Files Modified**:
- `src/app/api/connect-wallet/route.ts` - Added signature verification using viem

**Security Benefits**:
- Prevents users from claiming arbitrary wallet addresses
- Cryptographically proves wallet ownership
- One-time nonce prevents replay attacks

### 4. Documentation ✅

**Files Created**:
- `.env.example` - Environment variable template
- `docs/XRP_WALLET_INTEGRATION.md` - XRP Ledger integration guide
- `IMPLEMENTATION_NOTES.md` (this file)

## Environment Variables Required

Create a `.env.local` file with:

```bash
# Database
DATABASE_URL="file:./dev.db"

# WalletConnect Project ID
# Get yours at: https://cloud.walletconnect.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your-project-id-here"
```

**Important**: You MUST create a WalletConnect project ID at https://cloud.walletconnect.com for the wallet modal to work properly.

## Schema Notes

The current schema uses a **per-business points system**:

- `Member` - Global user account
- `Business` - Actual business entity
- `BusinessMember` - Join table with per-business wallet & points
- `Merchant` - SaaS configuration (pricing plans)

This allows members to have different wallets/points at different businesses, which is more flexible for multi-location merchants.

## Known Issues

### Build Issue with Next.js 16 + Turbopack

**Problem**: Turbopack tries to bundle test files from `@wagmi/connectors` node_modules, causing build failures.

**Workaround**: The code works fine in development mode (`npm run dev`). For production builds, either:

1. Use webpack mode: `TURBOPACK=0 npm run build`
2. Wait for Next.js/Turbopack fixes
3. Downgrade to Next.js 15 (not recommended)

**Status**: This is a known issue with Turbopack + wagmi/RainbowKit and will be fixed in future versions.

## Testing Instructions

### 1. Development Mode
```bash
npm install
npm run dev
```

Visit http://localhost:3000 and test:
- Pricing page shows new Basic and Premium tiers
- Wallet connect button shows multiple wallet options
- Signature verification works when connecting

### 2. Test Wallet Connection

1. Navigate to a merchant claim page (e.g., `/m/[merchant]/claim`)
2. Click "Connect Wallet"
3. Choose a wallet (MetaMask, Trust Wallet, Coinbase Wallet, etc.)
4. Sign the verification message
5. Wallet address should be saved to database

### 3. Verify Database

Check that `Member.walletAddress` is updated after connection:

```bash
npx prisma studio
```

## Phase 1 Launch Checklist

Based on your Phase 1 requirements:

- [x] QR scan rewards
- [x] Points system
- [x] Basic dashboard
- [x] Simple POS receipt QR
- [x] Blockchain backend (points tracking)
- [x] Stablecoin rewards option (differentiator)
  - [x] Multi-wallet support
  - [x] Signature verification
  - [ ] **TODO**: Actual stablecoin payout implementation
  - [ ] **TODO**: Milestone tracking (100 points = $5 USDC)

## Next Steps Recommended

### Immediate (Week 1):
1. **Create WalletConnect Project ID**
   - Visit https://cloud.walletconnect.com
   - Create free project
   - Add project ID to `.env.local`

2. **Test Wallet Connections**
   - Test with MetaMask
   - Test with Trust Wallet mobile
   - Test with Coinbase Wallet

3. **Implement Stablecoin Payout Logic**
   - Create `/api/rewards/payout` endpoint
   - Integrate with USDC smart contract
   - Add transaction tracking

### Week 2-3:
4. **Add Integration Tests**
   - Auth flow tests
   - Wallet connection tests
   - Signature verification tests

5. **Error Monitoring**
   - Set up Sentry
   - Set up LogRocket (optional)

6. **Rate Limiting**
   - Set up Redis (Upstash recommended)
   - Add rate limiting middleware

### Future Enhancements:
7. **XRP Ledger Support**
   - Only if customer demand exists
   - See `docs/XRP_WALLET_INTEGRATION.md`

8. **Solana/Phantom Support**
   - Different blockchain, similar to XRP approach
   - Would need separate wallet connector

## Architecture Decisions

### Why RainbowKit?
- Best-in-class wallet connection UX
- Supports 300+ wallets via WalletConnect
- Actively maintained by Rainbow team
- Works seamlessly with wagmi v2

### Why Per-Business Points?
- More flexible for franchises
- Members can have different tiers at different locations
- Wallet can be different per business
- Easier to implement business-specific rewards

### Why Signature Verification?
- **Security**: Prevents address spoofing
- **Trust**: Cryptographically proves ownership
- **Compliance**: Audit trail of verified wallets
- **Industry Standard**: Used by OpenSea, Uniswap, etc.

## Support

For issues or questions:
1. Check `docs/XRP_WALLET_INTEGRATION.md` for XRP/Xaman
2. Check RainbowKit docs: https://rainbowkit.com
3. Check wagmi docs: https://wagmi.sh

## Migration Notes

### From Old WalletConnectButton to New:

**Before** (MetaMask only):
```tsx
<WalletConnectButton merchantSlug="..." memberId="..." />
// Only MetaMask support
```

**After** (Multi-wallet):
```tsx
<WalletConnectButton merchantSlug="..." memberId="..." />
// Now shows wallet modal with:
// - MetaMask
// - Trust Wallet
// - Coinbase Wallet
// - WalletConnect (300+ wallets)
// - Automatic signature verification
```

No code changes needed - component API is the same!

## Commit Message

```
feat: Add multi-wallet support and new pricing tiers

- Add $99 Basic tier (points only, no crypto)
- Add $149 Premium tier (stablecoin rewards)
- Comment out Growth and Pro tiers for Phase 1
- Implement RainbowKit for multi-wallet support
  - MetaMask, Trust Wallet, Coinbase Wallet, WalletConnect
  - Support for Ethereum, Polygon, BSC
- Add wallet signature verification for security
- Create XRP Ledger integration documentation
- Add .env.example with WalletConnect project ID

Known issue: Turbopack build fails due to wagmi test files.
Workaround: Use `npm run dev` for development.
```
