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

/**
 * Get configured wallet and public clients for Polygon
 *
 * @param privateKey - Private key of the payout wallet (0x-prefixed)
 * @param network - Network to use ("polygon" or "mumbai"). Defaults to NODE_ENV-based.
 */
export function getPolygonClients(
  privateKey: string,
  network?: 'polygon' | 'mumbai'
) {
  if (!privateKey) {
    throw new Error('Private key is required for blockchain operations');
  }

  if (!privateKey.startsWith('0x')) {
    throw new Error('Private key must start with 0x');
  }

  // Determine network
  const isProduction = process.env.NODE_ENV === 'production';
  const useMainnet = network === 'polygon' || (network === undefined && isProduction);

  const chain = useMainnet ? polygon : polygonMumbai;
  const usdcAddress = useMainnet ? USDC_ADDRESSES.mainnet : USDC_ADDRESSES.testnet;

  const account = privateKeyToAccount(privateKey as `0x${string}`);

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

  return { walletClient, publicClient, account, usdcAddress };
}

/**
 * Send USDC to a customer wallet
 *
 * @param privateKey - Business owner's payout wallet private key
 * @param recipientAddress - Customer's wallet address
 * @param amountUSD - Amount in USD (e.g., 5 for $5)
 * @param network - Network to use ("polygon" or "mumbai")
 * @returns Transaction hash
 */
export async function sendUSDC(
  privateKey: string,
  recipientAddress: string,
  amountUSD: number,
  network?: 'polygon' | 'mumbai'
): Promise<{ success: true; txHash: string } | { success: false; error: string }> {
  try {
    const { walletClient, publicClient, account, usdcAddress } = getPolygonClients(
      privateKey,
      network
    );

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
 *
 * @param privateKey - Business owner's payout wallet private key
 * @param network - Network to use ("polygon" or "mumbai")
 */
export async function getPayoutWalletBalance(
  privateKey: string,
  network?: 'polygon' | 'mumbai'
): Promise<{
  usdcBalance: number;
  maticBalance: number;
  address: string;
}> {
  const { publicClient, account, usdcAddress } = getPolygonClients(privateKey, network);

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
 *
 * @param txHash - Transaction hash to check
 * @param network - Network to check on ("polygon" or "mumbai")
 */
export async function checkTransaction(
  txHash: string,
  network?: 'polygon' | 'mumbai'
): Promise<{
  status: 'success' | 'failed' | 'pending';
  blockNumber?: bigint;
  gasUsed?: bigint;
}> {
  // Determine network
  const isProduction = process.env.NODE_ENV === 'production';
  const useMainnet = network === 'polygon' || (network === undefined && isProduction);
  const chain = useMainnet ? polygon : polygonMumbai;

  // Only need public client for reading transaction data
  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    return {
      status: receipt.status === 'success' ? 'success' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    return { status: 'pending' };
  }
}
