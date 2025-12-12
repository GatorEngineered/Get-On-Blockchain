# 🔧 Quick Fix Guide - TypeScript Errors

## Problem

You're seeing TypeScript errors because **Prisma Client hasn't been regenerated** after we updated the schema. The database schema has the new payout fields, but the TypeScript types are out of date.

## Solution (Run these commands in your terminal)

### Step 1: Regenerate Prisma Client

```powershell
npx prisma generate
```

This will update the TypeScript types to include:
- `payoutEnabled`
- `payoutWalletEncrypted`
- `payoutWalletAddress`
- `payoutMilestonePoints`
- `payoutAmountUSD`
- `payoutNetwork`
- `usdcBalance`
- `lastBalanceCheck`
- `lowBalanceAlertSent`

### Step 2: Restart TypeScript Server in VS Code

After running `npx prisma generate`:

1. **Press**: `Ctrl + Shift + P` (Windows) or `Cmd + Shift + P` (Mac)
2. **Type**: "TypeScript: Restart TS Server"
3. **Press**: Enter

This reloads the TypeScript language server with the new types.

### Step 3: Verify Errors Are Gone

All these errors should disappear:
- ✅ `Property 'payoutEnabled' does not exist`
- ✅ `Property 'payoutWalletEncrypted' does not exist`
- ✅ `Property 'payoutMilestonePoints' does not exist`
- ✅ `This comparison appears to be unintentional` (Plan vs "PREMIUM")
- ✅ `Type 'PAYOUT' is not assignable to type 'RewardType'`
- ✅ polygon.ts status type error (I already fixed this!)

---

## What I Already Fixed

✅ **Fixed polygon.ts status type issue**
- Changed `receipt.status` to map `'reverted'` → `'failed'`
- Line 225 in `src/lib/blockchain/polygon.ts`

---

## If `npx prisma generate` Fails

If you get an error like "Failed to fetch sha256 checksum", try:

```powershell
# Option 1: Use environment variable
$env:PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING="1"
npx prisma generate

# Option 2: Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
npx prisma generate
```

---

## After Prisma Generate Succeeds

### Next Step: Run Migration

```powershell
npx prisma migrate dev --name add_custodial_wallets
```

This will:
1. Create migration SQL file
2. Apply it to your database
3. Add all new payout columns to Merchant table

---

## Verification Checklist

After running the commands:

- [ ] `npx prisma generate` completed successfully
- [ ] Restarted TS Server in VS Code
- [ ] No TypeScript errors in VS Code
- [ ] `npx prisma migrate dev` completed successfully
- [ ] Can see new fields in Prisma Studio: `npx prisma studio`

---

## Quick Test

After migration, test that it worked:

```powershell
npx prisma studio
```

1. Open "Merchant" table
2. You should see new columns:
   - payoutEnabled
   - payoutWalletAddress
   - payoutWalletEncrypted
   - payoutMilestonePoints
   - payoutAmountUSD
   - payoutNetwork
   - usdcBalance
   - lastBalanceCheck
   - lowBalanceAlertSent

---

## Summary

**What you need to run:**

```powershell
# 1. Regenerate Prisma types
npx prisma generate

# 2. Apply database migration
npx prisma migrate dev --name add_custodial_wallets

# 3. Restart VS Code TypeScript server
# Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

**Then all TypeScript errors will disappear!** ✨

---

## Need Help?

If you still see errors after this, let me know which specific error and I'll help troubleshoot!
