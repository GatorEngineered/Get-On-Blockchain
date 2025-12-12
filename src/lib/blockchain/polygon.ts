// src/lib/blockchain/polygon.ts
import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from 'viem';
import { polygon, polygonMumbai } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// USDC Contract ABI (ERC-20 standard - only what we need)
const USDC_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Contract Addresses
const USDC_ADDRESSES = {
  // Polygon Mainnet (Production)
  mainnet: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const,
  // Polygon Mumbai Testnet (Testing)
  testnet: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97' as const,
};

// Choose network based on environment
const isProduction = process.env.NODE_ENV === 'production';
const chain = isProduction ? polygon : polygonMumbai;
const usdcAddress = isProduction ? USDC_ADDRESSES.mainnet : USDC_ADDRESSES.testnet;

// Create clients
export function getPolygonClients() {
  // Get private key from environment (KEEP THIS SECRET!)
  const privateKey = process.env.PAYOUT_WALLET_PRIVATE_KEY as `0x${string}`;

  if (!privateKey) {
    throw new Error('PAYOUT_WALLET_PRIVATE_KEY not set in environment variables');
  }

  const account = privateKeyToAccount(privateKey);

  // Wallet client (for sending transactions)
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  // Public client (for reading blockchain data)
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  return { walletClient, publicClient, account };
}

/**
 * Send USDC to a customer wallet
 *
 * @param recipientAddress - Customer's wallet address
 * @param amountUSD - Amount in USD (e.g., 5 for $5)
 * @returns Transaction hash
 */
export async function sendUSDC(
  recipientAddress: string,
  amountUSD: number
): Promise<{ success: true; txHash: string } | { success: false; error: string }> {
  try {
    const { walletClient, publicClient, account } = getPolygonClients();

    // USDC has 6 decimals (not 18 like most tokens!)
    // $5.00 = 5000000 (5 * 10^6)
    const amount = parseUnits(amountUSD.toString(), 6);

    console.log(`[Polygon] Sending ${amountUSD} USDC to ${recipientAddress}`);

    // 1. Check payout wallet has enough USDC
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [account.address],
    });

    const balanceUSD = Number(formatUnits(balance, 6));
    console.log(`[Polygon] Payout wallet balance: ${balanceUSD} USDC`);

    if (balance < amount) {
      return {
        success: false,
        error: `Insufficient USDC balance. Have: ${balanceUSD}, Need: ${amountUSD}`,
      };
    }

    // 2. Estimate gas (to check if we have enough MATIC)
    const { request } = await publicClient.simulateContract({
      account,
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, amount],
    });

    // 3. Send the transaction
    const txHash = await walletClient.writeContract(request);

    console.log(`[Polygon] Transaction sent: ${txHash}`);

    // 4. Wait for confirmation (optional - can do this async)
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1, // Wait for 1 confirmation (~2 seconds on Polygon)
    });

    if (receipt.status === 'success') {
      console.log(`[Polygon] Transaction confirmed! Gas used: ${receipt.gasUsed}`);
      return { success: true, txHash };
    } else {
      return { success: false, error: 'Transaction reverted' };
    }
  } catch (error: any) {
    console.error('[Polygon] Error sending USDC:', error);
    return {
      success: false,
      error: error.message || 'Unknown error sending USDC',
    };
  }
}

/**
 * Get payout wallet balance (USDC and MATIC)
 */
export async function getPayoutWalletBalance(): Promise<{
  usdcBalance: number;
  maticBalance: number;
  address: string;
}> {
  const { publicClient, account } = getPolygonClients();

  // Get USDC balance
  const usdcBalance = await publicClient.readContract({
    address: usdcAddress,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [account.address],
  });

  // Get MATIC balance (for gas fees)
  const maticBalance = await publicClient.getBalance({
    address: account.address,
  });

  return {
    usdcBalance: Number(formatUnits(usdcBalance, 6)),
    maticBalance: Number(formatUnits(maticBalance, 18)),
    address: account.address,
  };
}

/**
 * Check if a transaction was successful
 */
export async function checkTransaction(txHash: string): Promise<{
  status: 'success' | 'failed' | 'pending';
  blockNumber?: bigint;
  gasUsed?: bigint;
}> {
  const { publicClient } = getPolygonClients();

  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    return {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    return { status: 'pending' };
  }
}
