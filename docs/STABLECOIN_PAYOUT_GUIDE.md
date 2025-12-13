# STABLECOIN PAYOUT IMPLEMENTATION GUIDE

## Phase 1: Set Up Testnet Environment (Day 1-4)

### Step 1: Get Test MATIC (Polygon Mumbai)

1. **Get Mumbai Testnet MATIC** (for gas fees):
   - Visit: https://faucet.polygon.technology/
   - Connect your wallet (MetaMask)
   - Select Mumbai network
   - Get 0.5 MATIC (free)

2. **Add Mumbai Network to MetaMask**:
   - Network Name: Polygon Mumbai
   - RPC URL: https://rpc-mumbai.maticvigil.com
   - Chain ID: 80001
   - Currency: MATIC
   - Block Explorer: https://mumbai.polygonscan.com/

3. **Get Test USDC**:
   - Mumbai USDC Address: `0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97`
   - Use Aave faucet: https://staging.aave.com/faucet/
   - Or we'll use a mock token for testing

---

## Phase 2: Create Payout Smart Contract Interaction (Day 5-7)

### Understanding USDC Contract

USDC is an ERC-20 token. To send it, we call the `transfer` function:

```typescript
// USDC Contract Interface
interface USDC {
  function transfer(address to, uint256 amount) returns (bool);
  function balanceOf(address account) returns (uint256);
}
```

We DON'T need to deploy our own contract - we just interact with existing USDC!

---

## Phase 3: Build the Payout Endpoint (Day 8-10)

### File: `src/app/api/rewards/payout/route.ts`

**What it does:**
1. Check if member has reached milestone (100 points)
2. Calculate USDC amount ($5 = 5 USDC)
3. Send USDC transaction to member's wallet
4. Deduct points
5. Store transaction hash
6. Return success/error

**Security checks:**
- Verify member owns wallet (signature verification already done)
- Check sufficient USDC balance in payout wallet
- Prevent double-payouts
- Handle transaction failures gracefully

---

## Phase 4: Create Payout Wallet (Day 11)

### What is a Payout Wallet?

This is YOUR wallet that holds USDC to distribute to customers.

**Setup:**
1. Create new wallet (KEEP PRIVATE KEY SAFE!)
2. Fund it with USDC ($500-1000 to start)
3. Store private key in environment variable (encrypted)
4. Use viem to sign transactions programmatically

**Security:**
- NEVER commit private key to git
- Use environment variable only
- Consider hardware wallet for large amounts
- Set up monitoring for low balance

---

## Phase 5: Testing Strategy (Day 12-14)

### Testnet Testing Checklist

- [ ] Send test USDC to test wallet
- [ ] Verify wallet receives it
- [ ] Test insufficient balance error
- [ ] Test invalid wallet address
- [ ] Test double-payout prevention
- [ ] Test transaction failure handling
- [ ] Test gas estimation
- [ ] Monitor transaction on Mumbai block explorer

### Mainnet Testing (Small Amounts First!)

- [ ] Send $0.10 USDC to test customer
- [ ] Verify they receive it
- [ ] Test with 5 different wallets
- [ ] Monitor gas costs
- [ ] Check transaction speed

---

## Phase 6: Production Deployment (Week 3)

### Pre-Launch Checklist

**Infrastructure:**
- [ ] PostgreSQL database migrated
- [ ] Redis rate limiting active
- [ ] Sentry error monitoring configured
- [ ] Email notifications working

**Payout System:**
- [ ] Testnet fully tested
- [ ] Mainnet tested with small amounts
- [ ] Payout wallet funded ($500-1000 USDC)
- [ ] Transaction monitoring dashboard
- [ ] Low balance alerts set up

**Security:**
- [ ] Private key encrypted
- [ ] Rate limiting on payout endpoint
- [ ] Double-payout prevention tested
- [ ] Error handling comprehensive

---

## Cost Estimates

### Polygon Mainnet (Recommended)

**Per Transaction:**
- Gas fee: ~$0.01-0.05
- USDC amount: $5.00
- Total cost per payout: **$5.01-5.05**

**Monthly (100 payouts):**
- USDC distributed: $500
- Gas fees: $1-5
- **Total: ~$505**

### Break-Even Analysis

If you charge $149/month for Premium:
- 1 customer = 100 point milestone every ~10 visits
- 1 payout per month per customer = $5 cost
- 20 Premium customers = $100/month in payouts
- Still profitable! ✅

---

## Smart Contract Addresses

### Polygon Mumbai (Testnet)
- USDC Mock: `0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97`
- Network: Mumbai
- Chain ID: 80001

### Polygon Mainnet (Production)
- USDC: `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`
- Network: Polygon
- Chain ID: 137

---

## Monitoring & Alerts

### Set Up Alerts For:

1. **Low Payout Wallet Balance**
   - Alert when < $100 USDC remaining
   - Refill before it runs out

2. **Failed Transactions**
   - Email when transaction fails
   - Retry logic with exponential backoff

3. **High Gas Fees**
   - Alert if gas > $0.10 (unusual for Polygon)
   - May indicate network congestion

4. **Unusual Activity**
   - More than 10 payouts in 1 hour
   - Possible abuse or bot

---

## Next Steps

1. Read this guide fully
2. Set up Mumbai testnet
3. Get test MATIC + USDC
4. I'll write the actual code for you
5. We'll test together on testnet
6. Deploy to production when ready

---

## Resources

- [Viem Documentation](https://viem.sh/)
- [Polygon Documentation](https://docs.polygon.technology/)
- [USDC on Polygon](https://polygonscan.com/token/0x2791bca1f2de4661ed88a30c99a7a9449aa84174)
- [ERC-20 Token Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
- [Gas Optimization Tips](https://www.alchemy.com/overviews/solidity-gas-optimization)
