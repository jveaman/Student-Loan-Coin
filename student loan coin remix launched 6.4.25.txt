// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts@4.9.2/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts@4.9.2/access/Ownable.sol";

contract StudentLoanCoin is ERC20, Ownable {
    uint256 public taxPercentage = 4; // 4% total tax
    address public forgivenessWallet;
    address public marketingWallet;
    address public liquidityWallet;
    bool public isLocked = false; // Emergency lock switch
    bool public walletsAreLocked = false; // Prevent wallet updates after lock
    bool public lockControlDisabled = false; // Prevent toggleLock from being abused
    bool public taxAdjustmentLocked = false; // Allow tax update only once

    event FundsAllocated(uint256 forgivenessAmount, uint256 marketingAmount, uint256 liquidityAmount);
    event LockToggled(bool status);
    event WalletsLocked();
    event LockControlDisabled();
    event TaxAdjustmentLocked();

    constructor(
        address _forgivenessWallet,
        address _marketingWallet,
        address _liquidityWallet
    ) ERC20("Student Loan Coin", "SLC") {
        uint256 totalSupply = 6_900_000_000 * 10 ** decimals();
        uint256 founderSupply = (totalSupply * 15) / 100; // 15% founder reserve

        _mint(msg.sender, founderSupply); // Founder tokens to deployer
        _mint(address(this), totalSupply - founderSupply); // Remaining tokens for circulation or liquidity

        forgivenessWallet = _forgivenessWallet;
        marketingWallet = _marketingWallet;
        liquidityWallet = _liquidityWallet;
    }

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal override {
        require(!isLocked, "Transfers currently locked");

        uint256 taxAmount = (amount * taxPercentage) / 100;
        uint256 forgivenessPart = (taxAmount * 50) / 100; // 2%
        uint256 marketingPart = (taxAmount * 25) / 100; // 1%
        uint256 liquidityPart = taxAmount - forgivenessPart - marketingPart; // 1%
        uint256 finalAmount = amount - taxAmount;

        super._transfer(sender, forgivenessWallet, forgivenessPart);
        super._transfer(sender, marketingWallet, marketingPart);
        super._transfer(sender, liquidityWallet, liquidityPart);
        super._transfer(sender, recipient, finalAmount);

        emit FundsAllocated(forgivenessPart, marketingPart, liquidityPart);
    }

    function toggleLock() external onlyOwner {
        require(!lockControlDisabled, "Lock control permanently disabled");
        isLocked = !isLocked;
        emit LockToggled(isLocked);
    }

    function disableLockControl() external onlyOwner {
        lockControlDisabled = true;
        emit LockControlDisabled();
    }

    function updateWallets(
        address _forgivenessWallet,
        address _marketingWallet,
        address _liquidityWallet
    ) external onlyOwner {
        require(!walletsAreLocked, "Wallet updates are locked");
        forgivenessWallet = _forgivenessWallet;
        marketingWallet = _marketingWallet;
        liquidityWallet = _liquidityWallet;
    }

    function lockWalletUpdates() external onlyOwner {
        walletsAreLocked = true;
        emit WalletsLocked();
    }

    function updateTaxPercentage(uint256 newTax) external onlyOwner {
        require(!taxAdjustmentLocked, "Tax updates are locked");
        require(newTax <= 5, "Tax too high");
        taxPercentage = newTax;
        taxAdjustmentLocked = true;
        emit TaxAdjustmentLocked();
    }

    function getWalletDistribution() external view returns (address, address, address) {
        return (forgivenessWallet, marketingWallet, liquidityWallet);
    }
}
