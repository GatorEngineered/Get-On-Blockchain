// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MerchantToken.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for deploying MerchantToken contracts
 *
 * Features:
 * - Deploy new branded tokens for merchants
 * - Track all deployed tokens
 * - Only owner (GOB) can create tokens
 *
 * Gas efficiency: Deploying via factory is cheaper than
 * deploying individual contracts.
 */
contract TokenFactory is Ownable {
    // All deployed tokens
    address[] public deployedTokens;

    // Merchant ID -> Token address mapping
    mapping(string => address) public merchantTokens;

    // Token address -> exists check
    mapping(address => bool) public isDeployedToken;

    // Events
    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        uint8 decimals,
        address indexed owner,
        string merchantId
    );

    /**
     * @dev Constructor
     * Owner is the GOB relayer wallet
     */
    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a new merchant token
     * @param name Token name (e.g., "Orlando Cafe Token")
     * @param symbol Token symbol (e.g., "ORCA")
     * @param decimals Number of decimals (usually 0)
     * @param merchantId Off-chain merchant identifier
     * @return tokenAddress Address of the new token contract
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        uint8 decimals,
        string calldata merchantId
    ) external onlyOwner returns (address tokenAddress) {
        // Check merchant doesn't already have a token
        require(
            merchantTokens[merchantId] == address(0),
            "TokenFactory: Merchant already has a token"
        );

        // Deploy new token
        // Owner is this factory's owner (GOB relayer)
        MerchantToken token = new MerchantToken(
            name,
            symbol,
            decimals,
            owner(),
            merchantId
        );

        tokenAddress = address(token);

        // Track the deployment
        deployedTokens.push(tokenAddress);
        merchantTokens[merchantId] = tokenAddress;
        isDeployedToken[tokenAddress] = true;

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            decimals,
            owner(),
            merchantId
        );

        return tokenAddress;
    }

    /**
     * @dev Get token address by merchant ID
     * @param merchantId Off-chain merchant identifier
     * @return Token contract address (or zero if none)
     */
    function getTokenByMerchant(
        string calldata merchantId
    ) external view returns (address) {
        return merchantTokens[merchantId];
    }

    /**
     * @dev Get total number of deployed tokens
     */
    function getTokenCount() external view returns (uint256) {
        return deployedTokens.length;
    }

    /**
     * @dev Get all deployed token addresses
     */
    function getAllTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    /**
     * @dev Get deployed tokens with pagination
     * @param offset Starting index
     * @param limit Number of tokens to return
     */
    function getTokensPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (address[] memory tokens) {
        uint256 total = deployedTokens.length;

        if (offset >= total) {
            return new address[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        tokens = new address[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            tokens[i] = deployedTokens[offset + i];
        }

        return tokens;
    }

    /**
     * @dev Check if an address is a deployed token
     */
    function isToken(address tokenAddress) external view returns (bool) {
        return isDeployedToken[tokenAddress];
    }
}
