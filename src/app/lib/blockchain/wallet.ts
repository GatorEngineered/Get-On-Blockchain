import { ethers } from "ethers";
import crypto from "crypto";

const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || "default-key-change-in-production";
const ALGORITHM = "aes-256-gcm";

/**
 * Generate a new Ethereum wallet
 * Returns wallet address and encrypted private key
 */
export function generateWallet(): {
  address: string;
  encryptedPrivateKey: string;
  privateKey: string; // Don't store this! Only for initial setup
} {
  const wallet = ethers.Wallet.createRandom();

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    encryptedPrivateKey: encryptPrivateKey(wallet.privateKey),
  };
}

/**
 * Encrypt a private key for secure storage in database
 */
export function encryptPrivateKey(privateKey: string): string {
  try {
    // Generate a random IV (Initialization Vector)
    const iv = crypto.randomBytes(16);

    // Create cipher
    const key = crypto
      .createHash("sha256")
      .update(ENCRYPTION_KEY)
      .digest();

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the private key
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get the auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const result = iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;

    return result;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt private key");
  }
}

/**
 * Decrypt a private key from database
 */
export function decryptPrivateKey(encryptedData: string): string {
  try {
    // Split the stored data
    const parts = encryptedData.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    // Create decipher
    const key = crypto
      .createHash("sha256")
      .update(ENCRYPTION_KEY)
      .digest();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt private key");
  }
}

/**
 * Get a wallet instance from encrypted private key
 */
export function getWalletFromEncrypted(encryptedPrivateKey: string): ethers.Wallet {
  const privateKey = decryptPrivateKey(encryptedPrivateKey);
  return new ethers.Wallet(privateKey);
}

/**
 * Get provider for Polygon network
 */
export function getPolygonProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Get wallet connected to Polygon provider
 */
export function getConnectedWallet(encryptedPrivateKey: string): ethers.Wallet {
  const wallet = getWalletFromEncrypted(encryptedPrivateKey);
  const provider = getPolygonProvider();
  return wallet.connect(provider);
}

/**
 * Validate if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * Get MATIC balance for an address
 */
export async function getMaticBalance(address: string): Promise<string> {
  try {
    const provider = getPolygonProvider();
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error("Get balance error:", error);
    throw new Error("Failed to get MATIC balance");
  }
}
