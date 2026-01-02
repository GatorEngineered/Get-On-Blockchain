import { ethers } from "ethers";
import { getConnectedWallet, getPolygonProvider } from "./wallet";

const USDC_CONTRACT_ADDRESS = process.env.USDC_CONTRACT_ADDRESS || "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

// USDC ABI (only the functions we need)
const USDC_ABI = [
  // Read functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",

  // Write functions
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

/**
 * Get USDC contract instance
 */
function getUSDCContract(signer?: ethers.Wallet) {
  const provider = getPolygonProvider();

  if (signer) {
    return new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, signer);
  }

  return new ethers.Contract(USDC_CONTRACT_ADDRESS, USDC_ABI, provider);
}

/**
 * Get USDC balance for an address
 * Returns balance as a string in USDC (not wei)
 */
export async function getUSDCBalance(address: string): Promise<string> {
  try {
    const contract = getUSDCContract();
    const balance = await contract.balanceOf(address);

    // USDC has 6 decimals on Polygon
    return ethers.formatUnits(balance, 6);
  } catch (error) {
    console.error("Get USDC balance error:", error);
    throw new Error("Failed to get USDC balance");
  }
}

/**
 * Transfer USDC from one address to another
 * @param fromEncryptedKey - Encrypted private key of sender
 * @param toAddress - Recipient address
 * @param amountUSDC - Amount in USDC (e.g., "5.00" for $5)
 * @returns Transaction hash
 */
export async function transferUSDC(
  fromEncryptedKey: string,
  toAddress: string,
  amountUSDC: string
): Promise<{ txHash: string; success: boolean }> {
  try {
    // Get wallet connected to provider
    const wallet = getConnectedWallet(fromEncryptedKey);

    // Get contract with signer
    const contract = getUSDCContract(wallet);

    // Convert amount to wei (USDC has 6 decimals)
    const amountWei = ethers.parseUnits(amountUSDC, 6);

    // Check sender has enough balance
    const balance = await contract.balanceOf(wallet.address);
    if (balance < amountWei) {
      throw new Error(`Insufficient USDC balance. Have: ${ethers.formatUnits(balance, 6)}, Need: ${amountUSDC}`);
    }

    // Send transaction
    const tx = await contract.transfer(toAddress, amountWei);

    // Wait for confirmation
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      success: receipt.status === 1,
    };
  } catch (error: any) {
    console.error("Transfer USDC error:", error);

    // More detailed error messages
    if (error.message?.includes("insufficient funds")) {
      throw new Error("Insufficient MATIC for gas fees. Please add MATIC to merchant wallet.");
    }

    if (error.message?.includes("Insufficient USDC balance")) {
      throw error; // Re-throw our custom error
    }

    throw new Error(`Failed to transfer USDC: ${error.message}`);
  }
}

/**
 * Estimate gas cost for USDC transfer (in MATIC)
 */
export async function estimateTransferGas(
  fromEncryptedKey: string,
  toAddress: string,
  amountUSDC: string
): Promise<{ gasCostMATIC: string; gasCostUSD: string }> {
  try {
    const wallet = getConnectedWallet(fromEncryptedKey);
    const contract = getUSDCContract(wallet);
    const amountWei = ethers.parseUnits(amountUSDC, 6);

    // Estimate gas
    const gasEstimate = await contract.transfer.estimateGas(toAddress, amountWei);

    // Get gas price
    const provider = getPolygonProvider();
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("50", "gwei");

    // Calculate total gas cost
    const gasCost = gasEstimate * gasPrice;
    const gasCostMATIC = ethers.formatEther(gasCost);

    // Rough MATIC price estimate (you'd want to fetch this from an API)
    const maticPriceUSD = 0.80; // Update this or fetch from API
    const gasCostUSD = (parseFloat(gasCostMATIC) * maticPriceUSD).toFixed(6);

    return {
      gasCostMATIC,
      gasCostUSD,
    };
  } catch (error) {
    console.error("Estimate gas error:", error);
    throw new Error("Failed to estimate gas cost");
  }
}

/**
 * Check if an address has enough USDC
 */
export async function hasEnoughUSDC(address: string, requiredAmount: string): Promise<boolean> {
  try {
    const balance = await getUSDCBalance(address);
    return parseFloat(balance) >= parseFloat(requiredAmount);
  } catch (error) {
    console.error("Check USDC balance error:", error);
    return false;
  }
}

/**
 * Batch check USDC balances for multiple addresses
 */
export async function getBatchUSDCBalances(addresses: string[]): Promise<Map<string, string>> {
  const balances = new Map<string, string>();

  try {
    const contract = getUSDCContract();

    // Fetch all balances in parallel
    const promises = addresses.map(async (address) => {
      try {
        const balance = await contract.balanceOf(address);
        balances.set(address, ethers.formatUnits(balance, 6));
      } catch (error) {
        console.error(`Error fetching balance for ${address}:`, error);
        balances.set(address, "0");
      }
    });

    await Promise.all(promises);

    return balances;
  } catch (error) {
    console.error("Batch balance check error:", error);
    throw new Error("Failed to check balances");
  }
}
