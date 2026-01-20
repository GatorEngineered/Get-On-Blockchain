require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Validate private key format (should be 64 hex chars, optionally with 0x prefix)
function getAccounts() {
  const key = process.env.GOB_RELAYER_PRIVATE_KEY;
  if (!key) return [];

  // Remove 0x prefix if present
  const cleanKey = key.startsWith("0x") ? key.slice(2) : key;

  // Check if valid hex and correct length (64 chars = 32 bytes)
  if (cleanKey.length === 64 && /^[0-9a-fA-F]+$/.test(cleanKey)) {
    return [key.startsWith("0x") ? key : `0x${key}`];
  }

  console.warn("Warning: GOB_RELAYER_PRIVATE_KEY is not a valid 32-byte hex key");
  return [];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Polygon Amoy Testnet
    "polygon-amoy": {
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: getAccounts(),
    },
    // Polygon Mainnet (for future production)
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com/",
      chainId: 137,
      accounts: getAccounts(),
    },
  },
  etherscan: {
    apiKey: {
      polygonAmoy: process.env.POLYGONSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
