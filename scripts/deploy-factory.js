// scripts/deploy-factory.js
/**
 * Deploy TokenFactory contract to Polygon Amoy testnet
 *
 * Usage:
 *   npx hardhat run scripts/deploy-factory.js --network polygon-amoy
 *
 * After deployment:
 *   1. Copy the factory address
 *   2. Add to .env: TOKEN_FACTORY_ADDRESS=<address>
 *   3. Verify on PolygonScan (optional)
 */

const hre = require("hardhat");

async function main() {
  console.log("Deploying TokenFactory to", hre.network.name, "...\n");

  // Get deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "MATIC\n");

  if (balance < hre.ethers.parseEther("0.01")) {
    console.error("ERROR: Insufficient balance. Need at least 0.01 MATIC for deployment.");
    console.log("\nGet testnet MATIC from: https://faucet.polygon.technology/");
    process.exit(1);
  }

  // Deploy TokenFactory
  console.log("Deploying TokenFactory...");
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");
  const factory = await TokenFactory.deploy();

  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();

  console.log("\n========================================");
  console.log("TokenFactory deployed successfully!");
  console.log("========================================");
  console.log("Contract Address:", factoryAddress);
  console.log("Network:", hre.network.name);
  console.log("Owner:", deployer.address);
  console.log("");
  console.log("Explorer URL:");
  if (hre.network.name === "polygon-amoy") {
    console.log(`https://amoy.polygonscan.com/address/${factoryAddress}`);
  } else if (hre.network.name === "polygon") {
    console.log(`https://polygonscan.com/address/${factoryAddress}`);
  }
  console.log("");
  console.log("NEXT STEPS:");
  console.log("1. Add to your .env file:");
  console.log(`   TOKEN_FACTORY_ADDRESS=${factoryAddress}`);
  console.log("");
  console.log("2. (Optional) Verify contract on PolygonScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${factoryAddress}`);
  console.log("========================================\n");

  // Return for testing
  return { factory, factoryAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
