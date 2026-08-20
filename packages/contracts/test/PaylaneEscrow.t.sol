// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {PaylaneEscrow} from "../src/PaylaneEscrow.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract PaylaneEscrowTest is Test {
    PaylaneEscrow escrow;
    MockUSDC usdc;

    address owner = address(this);
    address feeRecipient = address(0xFEE);
    address arbitrator = address(0xA11CE);
    address client = address(0xC1);
    address worker = address(0xB1);
    address stranger = address(0xBAD);

    uint128 constant AMOUNT = 100e6; // $100 USDC
    bytes32 constant JOB_REF = keccak256("job-1");

    function setUp() public {
        usdc = new MockUSDC();
        escrow = new PaylaneEscrow(address(usdc), feeRecipient, arbitrator);

        usdc.mint(client, 1_000_000e6);
        vm.prank(client);
        usdc.approve(address(escrow), type(uint256).max);
    }

    function _createAndFund(address worker_) internal returns (uint256 jobId) {
        vm.prank(client);
        jobId = escrow.createJob(JOB_REF, worker_, AMOUNT, 0);
        vm.prank(client);
        escrow.fundJob(jobId);
    }

    function _deliver(uint256 jobId) internal {
        vm.prank(worker);
        escrow.markDelivered(jobId, keccak256("delivery"));
    }

    // 1) Accept → worker paid
    function test_accept_releasesToWorkerMinusFee() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);

        vm.prank(client);
        escrow.accept(jobId);

        uint256 fee = (uint256(AMOUNT) * 10) / 10_000;
        assertEq(usdc.balanceOf(worker), AMOUNT - fee);
        assertEq(usdc.balanceOf(feeRecipient), fee);
        (,,,,,, PaylaneEscrow.JobStatus status,,) = escrow.jobs(jobId);
        assertEq(uint256(status), uint256(PaylaneEscrow.JobStatus.Accepted));
    }

    // 2) Silence → auto-release
    function test_autoRelease_afterReviewWindow() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);

        vm.warp(block.timestamp + 3 days);
        escrow.autoRelease(jobId);

        uint256 fee = (uint256(AMOUNT) * 10) / 10_000;
        assertEq(usdc.balanceOf(worker), AMOUNT - fee);
        (,,,,,, PaylaneEscrow.JobStatus status,,) = escrow.jobs(jobId);
        assertEq(uint256(status), uint256(PaylaneEscrow.JobStatus.AutoReleased));
    }

    function test_autoRelease_revertsBeforeWindow() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.expectRevert(PaylaneEscrow.ReviewWindowActive.selector);
        escrow.autoRelease(jobId);
    }

    // 5) Dispute freezes auto-release
    function test_dispute_blocksAutoRelease() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);

        vm.prank(client);
        escrow.openDispute(jobId);

        vm.warp(block.timestamp + 3 days);
        vm.expectRevert(PaylaneEscrow.InvalidStatus.selector);
        escrow.autoRelease(jobId);
    }

    // 6) Admin refund / release / split
    function test_resolveDispute_fullRefund() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.prank(client);
        escrow.openDispute(jobId);

        uint256 clientBefore = usdc.balanceOf(client);
        vm.prank(arbitrator);
        escrow.resolveDispute(jobId, 0, AMOUNT);

        assertEq(usdc.balanceOf(client), clientBefore + AMOUNT);
        assertEq(usdc.balanceOf(worker), 0);
        assertEq(usdc.balanceOf(feeRecipient), 0);
    }

    function test_resolveDispute_fullRelease() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.prank(worker);
        escrow.openDispute(jobId);

        vm.prank(arbitrator);
        escrow.resolveDispute(jobId, AMOUNT, 0);

        uint256 fee = (uint256(AMOUNT) * 10) / 10_000;
        assertEq(usdc.balanceOf(worker), AMOUNT - fee);
        assertEq(usdc.balanceOf(feeRecipient), fee);
    }

    function test_resolveDispute_split() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.prank(client);
        escrow.openDispute(jobId);

        uint128 toWorker = 60e6;
        uint128 toClient = 40e6;
        uint256 clientBefore = usdc.balanceOf(client);

        vm.prank(arbitrator);
        escrow.resolveDispute(jobId, toWorker, toClient);

        uint256 fee = (uint256(toWorker) * 10) / 10_000;
        assertEq(usdc.balanceOf(worker), toWorker - fee);
        assertEq(usdc.balanceOf(client), clientBefore + toClient);
        assertEq(usdc.balanceOf(feeRecipient), fee);
    }

    function test_resolveDispute_onlyArbitrator() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.prank(client);
        escrow.openDispute(jobId);

        vm.prank(stranger);
        vm.expectRevert(PaylaneEscrow.Unauthorized.selector);
        escrow.resolveDispute(jobId, AMOUNT, 0);
    }

    // 7) Missed deadline refund
    function test_expireRefund_afterDeadline() public {
        uint64 deadline = uint64(block.timestamp + 1 days);
        vm.prank(client);
        uint256 jobId = escrow.createJob(JOB_REF, worker, AMOUNT, deadline);
        vm.prank(client);
        escrow.fundJob(jobId);

        uint256 clientBefore = usdc.balanceOf(client);
        vm.warp(deadline + 1);
        escrow.expireRefund(jobId);
        assertEq(usdc.balanceOf(client), clientBefore + AMOUNT);
    }

    // 8) Worker cancel refund
    function test_workerCancel_fullRefund() public {
        uint256 jobId = _createAndFund(worker);
        uint256 clientBefore = usdc.balanceOf(client);
        vm.prank(worker);
        escrow.cancel(jobId);
        assertEq(usdc.balanceOf(client), clientBefore + AMOUNT);
    }

    // 9) Cancel before hire refund
    function test_clientCancel_beforeWorker_fullRefund() public {
        vm.prank(client);
        uint256 jobId = escrow.createJob(JOB_REF, address(0), AMOUNT, 0);
        vm.prank(client);
        escrow.fundJob(jobId);

        uint256 clientBefore = usdc.balanceOf(client);
        vm.prank(client);
        escrow.cancel(jobId);
        assertEq(usdc.balanceOf(client), clientBefore + AMOUNT);
    }

    function test_clientCannotCancel_afterWorkerAssigned() public {
        uint256 jobId = _createAndFund(worker);
        vm.prank(client);
        vm.expectRevert(PaylaneEscrow.Unauthorized.selector);
        escrow.cancel(jobId);
    }

    // 10) Unfunded cannot deliver
    function test_unfunded_cannotDeliver() public {
        vm.prank(client);
        uint256 jobId = escrow.createJob(JOB_REF, worker, AMOUNT, 0);
        vm.prank(worker);
        vm.expectRevert(PaylaneEscrow.InvalidStatus.selector);
        escrow.markDelivered(jobId, bytes32(0));
    }

    // 11) Wrong wallet cannot act
    function test_wrongWallet_cannotAccept() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.prank(stranger);
        vm.expectRevert(PaylaneEscrow.Unauthorized.selector);
        escrow.accept(jobId);
    }

    // 12) Double-accept no double-pay
    function test_doubleAccept_reverts() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.prank(client);
        escrow.accept(jobId);
        vm.prank(client);
        vm.expectRevert(PaylaneEscrow.InvalidStatus.selector);
        escrow.accept(jobId);
    }

    // 13) Dispute after auto-release rejected
    function test_disputeAfterAutoRelease_reverts() public {
        uint256 jobId = _createAndFund(worker);
        _deliver(jobId);
        vm.warp(block.timestamp + 3 days);
        escrow.autoRelease(jobId);
        vm.prank(client);
        vm.expectRevert(PaylaneEscrow.InvalidStatus.selector);
        escrow.openDispute(jobId);
    }

    function test_fund_wrongCaller() public {
        vm.prank(client);
        uint256 jobId = escrow.createJob(JOB_REF, worker, AMOUNT, 0);
        vm.prank(stranger);
        vm.expectRevert(PaylaneEscrow.Unauthorized.selector);
        escrow.fundJob(jobId);
    }

    function test_pause_blocksFund() public {
        vm.prank(client);
        uint256 jobId = escrow.createJob(JOB_REF, worker, AMOUNT, 0);
        escrow.pause();
        vm.prank(client);
        vm.expectRevert();
        escrow.fundJob(jobId);
    }

    function test_feeOnFullRefund_isZero() public {
        uint256 jobId = _createAndFund(address(0));
        uint256 feeBefore = usdc.balanceOf(feeRecipient);
        vm.prank(client);
        escrow.cancel(jobId);
        assertEq(usdc.balanceOf(feeRecipient), feeBefore);
    }

    function test_assignWorker() public {
        vm.prank(client);
        uint256 jobId = escrow.createJob(JOB_REF, address(0), AMOUNT, 0);
        vm.prank(client);
        escrow.fundJob(jobId);
        vm.prank(client);
        escrow.assignWorker(jobId, worker);
        (, address w,,,,,,,) = escrow.jobs(jobId);
        assertEq(w, worker);
    }
}
