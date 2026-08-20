// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {PaylaneEscrowUpgradeable} from "../src/PaylaneEscrowUpgradeable.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract PaylaneEscrowUpgradeableTest is Test {
    PaylaneEscrowUpgradeable escrow;
    MockUSDC usdc;

    address feeRecipient = address(0xFEE);
    address arbitrator = address(0xA11CE);
    address client = address(0xC1);
    address worker = address(0xB1);

    uint128 constant AMOUNT = 100e6;

    function setUp() public {
        usdc = new MockUSDC();
        PaylaneEscrowUpgradeable impl = new PaylaneEscrowUpgradeable();
        bytes memory initData = abi.encodeCall(
            PaylaneEscrowUpgradeable.initialize, (address(usdc), feeRecipient, arbitrator, address(this))
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        escrow = PaylaneEscrowUpgradeable(address(proxy));

        usdc.mint(client, 1_000_000e6);
        vm.prank(client);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function test_proxy_fund_and_accept() public {
        vm.prank(client);
        uint256 jobId = escrow.createJob(keccak256("j"), worker, AMOUNT, 0);
        vm.prank(client);
        escrow.fundJob(jobId);
        vm.prank(worker);
        escrow.markDelivered(jobId, keccak256("d"));
        vm.prank(client);
        escrow.accept(jobId);

        uint256 fee = (uint256(AMOUNT) * 10) / 10_000;
        assertEq(usdc.balanceOf(worker), AMOUNT - fee);
        assertEq(usdc.balanceOf(feeRecipient), fee);
    }

    function test_owner_can_upgrade() public {
        PaylaneEscrowUpgradeable newImpl = new PaylaneEscrowUpgradeable();
        escrow.upgradeToAndCall(address(newImpl), "");
        assertEq(address(escrow.usdc()), address(usdc));
    }
}
