# XRP Ledger / Xaman Wallet Integration

## Overview

XRP Ledger (XRPL) is a separate blockchain from Ethereum/EVM chains. It requires different libraries and integration approaches.

## Current Implementation Status

✅ **EVM Chains Supported** (via RainbowKit + wagmi):
- Ethereum Mainnet
- Polygon (MATIC)
- BNB Smart Chain (BSC)

**Wallets Supported**:
- MetaMask
- Trust Wallet (EVM chains)
- Coinbase Wallet
- BNB Wallet
- WalletConnect (300+ wallets)

❌ **XRP Ledger / Xaman NOT YET IMPLEMENTED**

## To Add XRP Ledger Support

### 1. Install Dependencies

```bash
npm install xrpl xumm-sdk
```

### 2. Libraries Needed

- **`xrpl`** - Official XRP Ledger JavaScript library
- **`xumm-sdk`** - Xaman (formerly Xumm) wallet SDK

### 3. Integration Approach

Since XRPL is not EVM-compatible, it cannot use wagmi/RainbowKit. You'll need parallel integration:

**Option A: Separate XRP Button**
- Keep EVM wallets with RainbowKit
- Add separate "Connect Xaman" button for XRP
- Store XRP address separately in `BusinessMember.walletAddress`

**Option B: Unified Wallet Modal**
- Build custom modal that shows both EVM and XRP options
- Route to appropriate connection flow based on user choice

### 4. Example XRP Connection Code

```typescript
import { Client, Wallet } from 'xrpl';
import { Xumm } from 'xumm-sdk';

// Initialize Xaman SDK
const xumm = new Xumm('YOUR_API_KEY', 'YOUR_API_SECRET');

// Create sign-in request
const payload = await xumm.payload.create({
  txjson: {
    TransactionType: 'SignIn'
  }
});

// User scans QR or opens in Xaman
// payload.refs.qr_png - QR code image
// payload.refs.websocket - WebSocket for status updates

// Wait for signature
const result = await xumm.payload.subscribe(payload.uuid);

if (result.signed) {
  const xrpAddress = result.account;
  // Save to database
}
```

### 5. Backend Changes Needed

Update `src/app/api/connect-wallet/route.ts`:

```typescript
type ConnectWalletBody = {
  merchantSlug?: string;
  memberId?: string;
  address?: string;
  signature?: string;
  message?: string;
  network?: 'ethereum' | 'polygon' | 'bsc' | 'xrpl'; // Add network field
};
```

Update `BusinessMember` schema to track network:

```prisma
model BusinessMember {
  walletAddress String?
  walletNetwork String? // "ethereum", "polygon", "bsc", "xrpl"
  // ... existing fields
}
```

### 6. Stablecoin Support on XRP Ledger

XRPL supports native tokens. For stablecoins:
- **USDC**: Available on XRPL (Circle has issued USDC on XRP Ledger)
- **Other tokens**: Check https://xrpl.org for issued currencies

### 7. Resources

- [XRPL Docs](https://xrpl.org)
- [Xaman Docs](https://docs.xaman.app)
- [XRPL.js Library](https://js.xrpl.org)

## Recommendation

**Phase 1 (Current)**: Focus on EVM chains (Ethereum, Polygon, BSC)
- These cover 90%+ of users
- RainbowKit provides excellent UX
- Already implemented ✅

**Phase 2 (Future)**: Add XRP Ledger support
- Only if customer demand exists
- Requires separate development effort
- Adds complexity to UX (users need to choose chain)

## Questions to Answer Before Implementing XRP

1. **Do you have customers specifically requesting XRP?**
2. **What stablecoins do they want to use on XRP Ledger?**
3. **Should XRP be per-business option or global?**
4. **Do you want to support XRP for payouts or just tracking?**

## Current Workaround

For merchants who want XRP:
1. They can manually enter XRP address in member profile
2. Track XRP addresses separately
3. Send payouts manually via XRPL explorer or Xaman wallet

This avoids complexity until there's proven demand.
