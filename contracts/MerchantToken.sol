// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MerchantToken
 * @dev ERC-20 token for Get On Blockchain branded loyalty tokens
 *
 * Features:
 * - Mintable by owner (GOB relayer)
 * - Burnable (for redemptions)
 * - Pausable (emergency stop)
 * - Transferable (members can send to each other)
 * - 0 decimals (whole tokens only)
 *
 * Each Growth plan merchant gets one of these tokens.
 * Deployed via TokenFactory contract.
 */
contract MerchantToken is ERC20, ERC20Burnable, Ownable, Pausable {
    uint8 private immutable _decimals;

    // Merchant identifier (for off-chain reference)
    string public merchantId;

    // Events
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);

    /**
     * @dev Constructor
     * @param name_ Token name (e.g., "Orlando Cafe Token")
     * @param symbol_ Token symbol (e.g., "ORCA")
     * @param decimals_ Number of decimals (0 for whole tokens)
     * @param owner_ Address that controls minting (GOB relayer)
     * @param merchantId_ Off-chain merchant identifier
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_,
        address owner_,
        string memory merchantId_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        _decimals = decimals_;
        merchantId = merchantId_;
    }

    /**
     * @dev Returns the number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint new tokens
     * Only callable by owner (GOB relayer)
     * @param to Recipient address
     * @param amount Number of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner whenNotPaused {
        _mint(to, amount);
    }

    /**
     * @dev Mint with reason (for logging)
     * @param to Recipient address
     * @param amount Number of tokens to mint
     * @param reason Description (e.g., "Earned from visit")
     */
    function mintWithReason(
        address to,
        uint256 amount,
        string calldata reason
    ) public onlyOwner whenNotPaused {
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }

    /**
     * @dev Burn tokens with reason (for logging)
     * @param amount Number of tokens to burn
     * @param reason Description (e.g., "Redeemed: Free Coffee")
     */
    function burnWithReason(
        uint256 amount,
        string calldata reason
    ) public whenNotPaused {
        _burn(_msgSender(), amount);
        emit TokensBurned(_msgSender(), amount, reason);
    }

    /**
     * @dev Burn tokens from account (requires approval)
     * Used by GOB for custodial wallet redemptions
     * @param from Account to burn from
     * @param amount Number of tokens to burn
     * @param reason Description
     */
    function burnFromWithReason(
        address from,
        uint256 amount,
        string calldata reason
    ) public whenNotPaused {
        _spendAllowance(from, _msgSender(), amount);
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }

    /**
     * @dev Pause token transfers (emergency)
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @dev Override transfer to check pause state
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override whenNotPaused {
        super._update(from, to, value);
    }
}
