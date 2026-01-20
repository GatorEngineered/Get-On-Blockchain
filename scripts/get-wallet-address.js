// scripts/get-wallet-address.js
// Quick script to get your relayer wallet address

require("dotenv").config();
const { ethers } = require("ethers");

let key = process.env.GOB_RELAYER_PRIVATE_KEY;

if (!key) {
  console.log("ERROR: GOB_RELAYER_PRIVATE_KEY not set in .env");
  process.exit(1);
}

// Fix common double-prefix issue
if (key.startsWith("0x00x") || key.startsWith("0x0x")) {
  key = "0x" + key.slice(4);
  console.log("Note: Your key had a double 0x prefix - fixed automatically");
  console.log("Please update your .env file to remove the extra 0x");
  console.log("");
}

try {
  const wallet = new ethers.Wallet(key);
  console.log("========================================");
  console.log("Your GOB Relayer Wallet");
  console.log("========================================");
  console.log("");
  console.log("Address:", wallet.address);
  console.log("");
  console.log("========================================");
  console.log("Polygon Amoy Faucets (get free test MATIC)");
  console.log("========================================");
  console.log("");
  console.log("1. Alchemy (requires free account):");
  console.log("   https://www.alchemy.com/faucets/polygon-amoy");
  console.log("");
  console.log("2. QuickNode:");
  console.log("   https://faucet.quicknode.com/polygon/amoy");
  console.log("");
  console.log("3. Chainlink:");
  console.log("   https://faucets.chain.link/polygon-amoy");
  console.log("");
  console.log("Copy your address above and paste it into a faucet.");
  console.log("You need ~0.1 MATIC to deploy the contracts.");
  console.log("");
} catch (e) {
  console.log("ERROR: Invalid private key");
  console.log(e.message);
  console.log("");
  console.log("Your key should be 64 hex characters starting with 0x");
  console.log("Example: 0x1234567890abcdef...(64 chars total after 0x)");
}
