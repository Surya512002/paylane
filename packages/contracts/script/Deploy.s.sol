// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {PaylaneEscrow} from "../src/PaylaneEscrow.sol";

/// @notice Deploy PaylaneEscrow to Arc testnet (or local anvil).
/// @dev USDC on Arc testnet ERC-20 view: 0x3600000000000000000000000000000000000000
contract Deploy is Script {
    function run() external {
        address usdc = vm.envOr("USDC_ADDRESS", address(0x3600000000000000000000000000000000000000));
        address feeRecipient = vm.envOr("FEE_RECIPIENT", msg.sender);
        address arbitrator = vm.envOr("ARBITRATOR", msg.sender);

        vm.startBroadcast();
        PaylaneEscrow escrow = new PaylaneEscrow(usdc, feeRecipient, arbitrator);
        vm.stopBroadcast();

        console2.log("PaylaneEscrow", address(escrow));
        console2.log("USDC", usdc);
        console2.log("feeRecipient", feeRecipient);
        console2.log("arbitrator", arbitrator);
    }
}
