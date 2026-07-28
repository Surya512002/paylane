// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {PaylaneEscrowUpgradeable} from "../src/PaylaneEscrowUpgradeable.sol";

/// @notice Deploy UUPS PaylaneEscrow to Arc (testnet or mainnet via env).
/// @dev Required env: PRIVATE_KEY. Optional: USDC_ADDRESS, FEE_RECIPIENT, ARBITRATOR, OWNER
contract DeployUpgradeable is Script {
    function run() external returns (address proxy, address impl) {
        address usdc = vm.envOr("USDC_ADDRESS", address(0x3600000000000000000000000000000000000000));
        address deployer = msg.sender;
        address feeRecipient = vm.envOr("FEE_RECIPIENT", deployer);
        address arbitrator = vm.envOr("ARBITRATOR", deployer);
        address owner_ = vm.envOr("OWNER", deployer);

        vm.startBroadcast();
        PaylaneEscrowUpgradeable implementation = new PaylaneEscrowUpgradeable();
        bytes memory initData = abi.encodeCall(
            PaylaneEscrowUpgradeable.initialize, (usdc, feeRecipient, arbitrator, owner_)
        );
        ERC1967Proxy p = new ERC1967Proxy(address(implementation), initData);
        vm.stopBroadcast();

        proxy = address(p);
        impl = address(implementation);

        console2.log("PaylaneEscrow proxy", proxy);
        console2.log("implementation", impl);
        console2.log("USDC", usdc);
        console2.log("owner", owner_);
        console2.log("feeRecipient", feeRecipient);
        console2.log("arbitrator", arbitrator);
    }
}
