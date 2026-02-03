// src/app/lib/token/token-factory-service.ts
/**
 * Token Factory Service
 *
 * Handles deploying branded ERC-20 tokens for Growth plan merchants:
 * - Deploy new merchant token via TokenFactory contract
 * - Track deployment in database
 * - Auto-generate token symbols from names
 *
 * Architecture:
 * - TokenFactory contract deployed once by GOB
 * - Merchants create tokens via factory.createToken()
 * - GOB relayer pays all gas fees
 */

import { ethers } from 'ethers';
import { prisma } from '@/app/lib/prisma';
import {
  getRelayerSigner,
  getNetworkConfig,
  getExplorerUrl,
  waitForTransaction,
  MERCHANT_TOKEN_ABI,
  type NetworkId,
  POLYGON_AMOY,
} from '@/app/lib/blockchain/polygon-client';

// Token Factory contract address (deployed by GOB)
// Will be set after initial deployment
const TOKEN_FACTORY_ADDRESS = process.env.TOKEN_FACTORY_ADDRESS || '';

// Token Factory ABI - must match TokenFactory.sol
const TOKEN_FACTORY_ABI = [
  'function createToken(string name, string symbol, uint8 decimals, string merchantId) returns (address)',
  'function getTokenByMerchant(string merchantId) view returns (address)',
  'function getTokenCount() view returns (uint256)',
  'event TokenCreated(address indexed tokenAddress, string name, string symbol, uint8 decimals, address indexed owner, string merchantId)',
];

export interface DeployTokenResult {
  success: boolean;
  merchantTokenId?: string;
  contractAddress?: string;
  txHash?: string;
  explorerUrl?: string;
  error?: string;
}

export interface TokenConfig {
  merchantId: string;
  tokenName: string;
  tokenSymbol: string;
}

/**
 * Generate a token symbol from merchant/token name
 * Examples: "Joe's Coffee" -> "JCOF", "Orlando Cafe" -> "ORCA"
 */
export function generateTokenSymbol(name: string): string {
  // Remove non-alphanumeric, split into words
  const words = name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  if (words.length === 0) {
    return 'TOKEN';
  }

  if (words.length === 1) {
    // Single word: take first 4 chars
    return words[0].substring(0, 4).toUpperCase();
  }

  // Multiple words: take first letter of each (up to 4)
  let symbol = words
    .slice(0, 4)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // If too short, add more chars from first word
  if (symbol.length < 3 && words[0].length > 1) {
    symbol = (words[0].substring(0, 2) + symbol.substring(1)).toUpperCase();
  }

  return symbol.substring(0, 5); // Max 5 chars
}

/**
 * Create a merchant token record (without deployment)
 * Used when merchant configures token settings
 */
export async function createMerchantToken(config: TokenConfig): Promise<{
  success: boolean;
  merchantTokenId?: string;
  error?: string;
}> {
  const { merchantId, tokenName, tokenSymbol } = config;

  try {
    // Check merchant exists and has Growth plan
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, plan: true, name: true },
    });

    if (!merchant) {
      return { success: false, error: 'Merchant not found' };
    }

    if (merchant.plan !== 'GROWTH' && merchant.plan !== 'PRO') {
      return { success: false, error: 'Branded tokens require Growth or Pro plan' };
    }

    // Check if token already exists
    const existing = await prisma.merchantToken.findUnique({
      where: { merchantId },
    });

    if (existing) {
      return { success: false, error: 'Merchant already has a branded token' };
    }

    // Validate symbol
    const symbol = tokenSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (symbol.length < 2 || symbol.length > 5) {
      return { success: false, error: 'Token symbol must be 2-5 characters' };
    }

    // Create token record
    const token = await prisma.merchantToken.create({
      data: {
        merchantId,
        tokenName,
        tokenSymbol: symbol,
        decimals: 0, // Whole tokens only
        network: 'polygon-amoy', // Start on testnet
        isActive: true,
      },
    });

    console.log(`[TokenFactory] Created token record: ${tokenName} (${symbol}) for merchant ${merchantId}`);

    return {
      success: true,
      merchantTokenId: token.id,
    };
  } catch (error: any) {
    console.error('[TokenFactory] Create error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create token',
    };
  }
}

/**
 * Deploy a merchant token to the blockchain
 * Called after merchant has configured their token
 */
export async function deployMerchantToken(
  merchantTokenId: string,
  network: NetworkId = POLYGON_AMOY
): Promise<DeployTokenResult> {
  try {
    // Get token record
    const token = await prisma.merchantToken.findUnique({
      where: { id: merchantTokenId },
      include: {
        merchant: { select: { id: true, name: true } },
      },
    });

    if (!token) {
      return { success: false, error: 'Token not found' };
    }

    if (token.contractAddress) {
      return {
        success: false,
        error: 'Token already deployed',
      };
    }

    // Check factory is configured
    if (!TOKEN_FACTORY_ADDRESS) {
      return {
        success: false,
        error: 'Token factory not configured. Contact support.',
      };
    }

    // Get relayer signer
    const signer = getRelayerSigner(network);
    const relayerAddress = await signer.getAddress();

    // Connect to factory contract
    const factory = new ethers.Contract(TOKEN_FACTORY_ADDRESS, TOKEN_FACTORY_ABI, signer);

    console.log(
      `[TokenFactory] Deploying ${token.tokenName} (${token.tokenSymbol}) for ${token.merchant.name}...`
    );

    // Create token transaction record
    const txRecord = await prisma.tokenTransaction.create({
      data: {
        merchantTokenId: token.id,
        type: 'DEPLOY',
        amount: 0,
        status: 'PENDING',
        reason: `Deploy ${token.tokenName} token`,
      },
    });

    try {
      // Deploy token via factory with retry for rate limits
      // Pass merchantId as the 4th parameter (contract uses it for tracking)
      let tx;
      let retries = 3;
      while (retries > 0) {
        try {
          tx = await factory.createToken(
            token.tokenName,
            token.tokenSymbol,
            token.decimals,
            token.merchantId // Pass merchant ID for on-chain tracking
          );
          break; // Success, exit retry loop
        } catch (rpcError: any) {
          const errorMsg = rpcError.message || '';
          if (errorMsg.includes('rate limit') || errorMsg.includes('Too many requests')) {
            retries--;
            if (retries > 0) {
              console.log(`[TokenFactory] Rate limited, waiting 15s before retry (${retries} retries left)...`);
              await new Promise((resolve) => setTimeout(resolve, 15000));
            } else {
              throw new Error('RPC rate limit exceeded. Please try again in a few minutes.');
            }
          } else {
            throw rpcError; // Not a rate limit error, rethrow
          }
        }
      }

      if (!tx) {
        throw new Error('Failed to send transaction after retries');
      }

      // Update with tx hash
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: { txHash: tx.hash },
      });

      console.log(`[TokenFactory] Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await waitForTransaction(tx.hash, network);

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed');
      }

      // Parse event to get token address
      const factoryInterface = new ethers.Interface(TOKEN_FACTORY_ABI);
      let tokenAddress: string | null = null;

      console.log(`[TokenFactory] Receipt has ${receipt.logs.length} logs`);
      console.log(`[TokenFactory] Looking for events from factory: ${TOKEN_FACTORY_ADDRESS}`);

      for (const log of receipt.logs) {
        console.log(`[TokenFactory] Log from ${log.address}, topic0: ${log.topics[0]}`);

        // Only try to parse logs from the factory contract
        if (log.address.toLowerCase() !== TOKEN_FACTORY_ADDRESS.toLowerCase()) {
          continue;
        }

        try {
          const parsed = factoryInterface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          });
          console.log(`[TokenFactory] Parsed event: ${parsed?.name}`);
          if (parsed?.name === 'TokenCreated') {
            tokenAddress = parsed.args[0]; // First arg is tokenAddress
            console.log(`[TokenFactory] Found token address: ${tokenAddress}`);
            break;
          }
        } catch (parseError: any) {
          console.log(`[TokenFactory] Parse error: ${parseError.message}`);
        }
      }

      // Fallback: Query factory directly if event parsing failed
      if (!tokenAddress) {
        console.log(`[TokenFactory] Event parsing failed, querying factory directly...`);
        try {
          tokenAddress = await factory.getTokenByMerchant(token.merchantId);
          if (tokenAddress && tokenAddress !== ethers.ZeroAddress) {
            console.log(`[TokenFactory] Got token from factory: ${tokenAddress}`);
          } else {
            tokenAddress = null;
          }
        } catch (queryError: any) {
          console.log(`[TokenFactory] Factory query error: ${queryError.message}`);
        }
      }

      if (!tokenAddress) {
        // Include tx hash in error for debugging
        throw new Error(`Could not find token address in transaction ${tx.hash}. Check logs on block explorer.`);
      }

      // Update token record
      await prisma.merchantToken.update({
        where: { id: merchantTokenId },
        data: {
          contractAddress: tokenAddress,
          deployTxHash: tx.hash,
          deployedAt: new Date(),
          network,
        },
      });

      // Update transaction record
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'CONFIRMED',
          toAddress: tokenAddress,
          blockNumber: receipt.blockNumber,
          gasUsed: Number(receipt.gasUsed),
          confirmedAt: new Date(),
        },
      });

      const networkConfig = getNetworkConfig(network);
      const explorerUrl = getExplorerUrl(tokenAddress, 'token', network);

      console.log(`[TokenFactory] Token deployed at ${tokenAddress}`);
      console.log(`[TokenFactory] Explorer: ${explorerUrl}`);

      return {
        success: true,
        merchantTokenId,
        contractAddress: tokenAddress,
        txHash: tx.hash,
        explorerUrl,
      };
    } catch (txError: any) {
      // Update transaction as failed
      await prisma.tokenTransaction.update({
        where: { id: txRecord.id },
        data: {
          status: 'FAILED',
          errorMessage: txError.message,
        },
      });
      throw txError;
    }
  } catch (error: any) {
    console.error('[TokenFactory] Deploy error:', error);
    return {
      success: false,
      error: error.message || 'Failed to deploy token',
    };
  }
}

/**
 * Get merchant token info
 */
export async function getMerchantToken(merchantId: string) {
  return prisma.merchantToken.findUnique({
    where: { merchantId },
    select: {
      id: true,
      tokenName: true,
      tokenSymbol: true,
      decimals: true,
      contractAddress: true,
      network: true,
      deployedAt: true,
      totalMinted: true,
      totalBurned: true,
      circulatingSupply: true,
      isActive: true,
      isPaused: true,
      createdAt: true,
    },
  });
}

/**
 * Update merchant token settings (name/symbol)
 * Only allowed before deployment
 */
export async function updateMerchantToken(
  merchantTokenId: string,
  updates: { tokenName?: string; tokenSymbol?: string }
): Promise<{ success: boolean; error?: string }> {
  const token = await prisma.merchantToken.findUnique({
    where: { id: merchantTokenId },
  });

  if (!token) {
    return { success: false, error: 'Token not found' };
  }

  if (token.contractAddress) {
    return { success: false, error: 'Cannot modify token after deployment' };
  }

  const data: any = {};
  if (updates.tokenName) {
    data.tokenName = updates.tokenName;
  }
  if (updates.tokenSymbol) {
    const symbol = updates.tokenSymbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (symbol.length < 2 || symbol.length > 5) {
      return { success: false, error: 'Token symbol must be 2-5 characters' };
    }
    data.tokenSymbol = symbol;
  }

  await prisma.merchantToken.update({
    where: { id: merchantTokenId },
    data,
  });

  return { success: true };
}

/**
 * Get token contract instance
 */
export function getTokenContract(
  contractAddress: string,
  network: NetworkId = POLYGON_AMOY
): ethers.Contract {
  const signer = getRelayerSigner(network);
  return new ethers.Contract(contractAddress, MERCHANT_TOKEN_ABI, signer);
}

/**
 * Check if token factory is configured
 */
export function isTokenFactoryConfigured(): boolean {
  return !!TOKEN_FACTORY_ADDRESS;
}

/**
 * Get token factory address
 */
export function getTokenFactoryAddress(): string | null {
  return TOKEN_FACTORY_ADDRESS || null;
}
