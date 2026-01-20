// src/app/lib/blockchain/polygon-client.ts
/**
 * Polygon Blockchain Client
 *
 * Handles all blockchain interactions for:
 * - Token deployment via TokenFactory
 * - Token minting
 * - Balance queries
 * - Transaction tracking
 *
 * Networks:
 * - polygon-amoy: Testnet for development
 * - polygon: Mainnet for production
 */

import { ethers } from 'ethers';

// Network configuration
const NETWORKS = {
  'polygon-amoy': {
    name: 'Polygon Amoy Testnet',
    chainId: 80002,
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology/',
    explorerUrl: 'https://amoy.polygonscan.com',
    nativeCurrency: 'MATIC',
  },
  polygon: {
    name: 'Polygon Mainnet',
    chainId: 137,
    rpcUrl: process.env.POLYGON_MAINNET_RPC_URL || 'https://polygon-rpc.com/',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'MATIC',
  },
};

export type NetworkId = keyof typeof NETWORKS;

// Default to testnet
const DEFAULT_NETWORK: NetworkId = 'polygon-amoy';

/**
 * Get provider for a network
 */
export function getProvider(network: NetworkId = DEFAULT_NETWORK): ethers.JsonRpcProvider {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  return new ethers.JsonRpcProvider(config.rpcUrl, {
    name: config.name,
    chainId: config.chainId,
  });
}

/**
 * Get signer for GOB relayer wallet
 * This wallet pays gas for all token operations
 */
export function getRelayerSigner(network: NetworkId = DEFAULT_NETWORK): ethers.Wallet {
  const privateKey = process.env.GOB_RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GOB_RELAYER_PRIVATE_KEY not configured');
  }
  const provider = getProvider(network);
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Get network configuration
 */
export function getNetworkConfig(network: NetworkId = DEFAULT_NETWORK) {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Unknown network: ${network}`);
  }
  return config;
}

/**
 * Get explorer URL for a transaction or address
 */
export function getExplorerUrl(
  hashOrAddress: string,
  type: 'tx' | 'address' | 'token',
  network: NetworkId = DEFAULT_NETWORK
): string {
  const config = NETWORKS[network];
  return `${config.explorerUrl}/${type}/${hashOrAddress}`;
}

/**
 * Check relayer wallet balance
 */
export async function getRelayerBalance(network: NetworkId = DEFAULT_NETWORK): Promise<{
  balanceWei: bigint;
  balanceMatic: string;
  isLow: boolean;
}> {
  const signer = getRelayerSigner(network);
  const balance = await signer.provider!.getBalance(signer.address);
  const balanceMatic = ethers.formatEther(balance);
  const isLow = balance < ethers.parseEther('0.1'); // Less than 0.1 MATIC

  return {
    balanceWei: balance,
    balanceMatic,
    isLow,
  };
}

/**
 * Get relayer wallet address
 */
export function getRelayerAddress(): string {
  const privateKey = process.env.GOB_RELAYER_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('GOB_RELAYER_PRIVATE_KEY not configured');
  }
  const wallet = new ethers.Wallet(privateKey);
  return wallet.address;
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  txHash: string,
  network: NetworkId = DEFAULT_NETWORK,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  const provider = getProvider(network);
  return provider.waitForTransaction(txHash, confirmations);
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(
  txHash: string,
  network: NetworkId = DEFAULT_NETWORK
): Promise<ethers.TransactionReceipt | null> {
  const provider = getProvider(network);
  return provider.getTransactionReceipt(txHash);
}

/**
 * Get current gas price
 */
export async function getGasPrice(network: NetworkId = DEFAULT_NETWORK): Promise<{
  gasPriceWei: bigint;
  gasPriceGwei: string;
}> {
  const provider = getProvider(network);
  const feeData = await provider.getFeeData();
  const gasPrice = feeData.gasPrice || BigInt(0);
  return {
    gasPriceWei: gasPrice,
    gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
  };
}

/**
 * Estimate gas cost for a transaction
 */
export async function estimateGasCost(
  gasLimit: bigint,
  network: NetworkId = DEFAULT_NETWORK
): Promise<{
  gasCostWei: bigint;
  gasCostMatic: string;
}> {
  const { gasPriceWei } = await getGasPrice(network);
  const gasCost = gasLimit * gasPriceWei;
  return {
    gasCostWei: gasCost,
    gasCostMatic: ethers.formatEther(gasCost),
  };
}

// ERC-20 ABI for token interactions
export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
];

// Token Factory ABI (we'll deploy this contract)
export const TOKEN_FACTORY_ABI = [
  'function createToken(string name, string symbol, uint8 decimals, address owner) returns (address)',
  'function getTokensByOwner(address owner) view returns (address[])',
  'event TokenCreated(address indexed tokenAddress, string name, string symbol, address indexed owner)',
];

// Merchant Token ABI (GOB branded token)
export const MERCHANT_TOKEN_ABI = [
  ...ERC20_ABI,
  'function mint(address to, uint256 amount)',
  'function burn(uint256 amount)',
  'function burnFrom(address from, uint256 amount)',
  'function pause()',
  'function unpause()',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
];

/**
 * Get ERC-20 token balance
 */
export async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string,
  network: NetworkId = DEFAULT_NETWORK
): Promise<bigint> {
  const provider = getProvider(network);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  return contract.balanceOf(walletAddress);
}

/**
 * Get token metadata
 */
export async function getTokenMetadata(
  tokenAddress: string,
  network: NetworkId = DEFAULT_NETWORK
): Promise<{
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: bigint;
}> {
  const provider = getProvider(network);
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);

  const [name, symbol, decimals, totalSupply] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
    contract.totalSupply(),
  ]);

  return { name, symbol, decimals: Number(decimals), totalSupply };
}

/**
 * Create a new Polygon wallet
 */
export function createWallet(): {
  address: string;
  privateKey: string;
} {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

/**
 * Validate Polygon address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Format address for display (0x1234...5678)
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Export network IDs for type safety
export const POLYGON_AMOY: NetworkId = 'polygon-amoy';
export const POLYGON_MAINNET: NetworkId = 'polygon';
