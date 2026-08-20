// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "openzeppelin-contracts/contracts/utils/Pausable.sol";
import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title PaylaneEscrow — USDC — Paylane freelance escrow for Arc (Mode A)
/// @notice Non-custodial job escrow: fund → deliver → accept / auto-release / dispute / cancel / expire.
contract PaylaneEscrow is ReentrancyGuard, Pausable, Ownable {
    using SafeERC20 for IERC20;

    enum JobStatus {
        None,
        Created,
        Funded,
        Delivered,
        Accepted,
        Disputed,
        Resolved,
        AutoReleased,
        Cancelled,
        Expired
    }

    struct Job {
        address client;
        address worker;
        uint128 amount;
        uint64 deadline;
        uint64 deliveredAt;
        uint64 reviewWindow;
        JobStatus status;
        bytes32 deliveryHash;
        bool funded;
    }

    IERC20 public immutable usdc;

    uint16 public platformFeeBps = 10; // 0.1%
    address public feeRecipient;
    address public arbitrator;
    uint64 public defaultReviewWindow = 3 days;
    uint256 public nextJobId = 1;

    mapping(uint256 => Job) public jobs;

    uint16 public constant MAX_FEE_BPS = 1000;
    uint64 public constant MIN_REVIEW_WINDOW = 1 hours;
    uint64 public constant MAX_REVIEW_WINDOW = 14 days;

    event JobCreated(
        uint256 indexed jobId,
        bytes32 jobRef,
        address indexed client,
        address worker,
        uint128 amount,
        uint64 deadline
    );
    event JobFunded(uint256 indexed jobId, address indexed client, uint128 amount);
    event WorkerAssigned(uint256 indexed jobId, address indexed worker);
    event JobDelivered(uint256 indexed jobId, address indexed worker, bytes32 deliveryHash, uint64 deliveredAt);
    event JobAccepted(uint256 indexed jobId, address indexed client);
    event JobAutoReleased(uint256 indexed jobId, address indexed caller);
    event DisputeOpened(uint256 indexed jobId, address indexed opener);
    event DisputeResolved(uint256 indexed jobId, uint128 workerAmount, uint128 clientAmount);
    event JobCancelled(uint256 indexed jobId, address indexed caller);
    event JobExpired(uint256 indexed jobId);
    event FundsReleased(uint256 indexed jobId, address indexed worker, uint128 net, uint128 fee);
    event FundsRefunded(uint256 indexed jobId, address indexed client, uint128 amount);
    event PlatformFeeBpsUpdated(uint16 bps);
    event FeeRecipientUpdated(address indexed recipient);
    event ArbitratorUpdated(address indexed arbitrator);
    event DefaultReviewWindowUpdated(uint64 window);

    error InvalidAmount();
    error InvalidAddress();
    error InvalidStatus();
    error Unauthorized();
    error AlreadyFunded();
    error NotFunded();
    error ReviewWindowActive();
    error DeadlineNotPassed();
    error InvalidSplit();
    error FeeTooHigh();
    error InvalidReviewWindow();
    error WorkerAlreadySet();
    error WorkerNotSet();

    constructor(address usdc_, address feeRecipient_, address arbitrator_) Ownable(msg.sender) {
        if (usdc_ == address(0) || feeRecipient_ == address(0) || arbitrator_ == address(0)) {
            revert InvalidAddress();
        }
        usdc = IERC20(usdc_);
        feeRecipient = feeRecipient_;
        arbitrator = arbitrator_;
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setPlatformFeeBps(uint16 bps) external onlyOwner {
        if (bps > MAX_FEE_BPS) revert FeeTooHigh();
        platformFeeBps = bps;
        emit PlatformFeeBpsUpdated(bps);
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        if (recipient == address(0)) revert InvalidAddress();
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    function setArbitrator(address arbitrator_) external onlyOwner {
        if (arbitrator_ == address(0)) revert InvalidAddress();
        arbitrator = arbitrator_;
        emit ArbitratorUpdated(arbitrator_);
    }

    function setDefaultReviewWindow(uint64 window) external onlyOwner {
        if (window < MIN_REVIEW_WINDOW || window > MAX_REVIEW_WINDOW) revert InvalidReviewWindow();
        defaultReviewWindow = window;
        emit DefaultReviewWindowUpdated(window);
    }

    // ─── Job lifecycle ───────────────────────────────────────────────────────

    function createJob(bytes32 jobRef, address worker, uint128 amount, uint64 deadline)
        external
        whenNotPaused
        returns (uint256 jobId)
    {
        if (amount == 0) revert InvalidAmount();
        jobId = nextJobId++;
        Job storage j = jobs[jobId];
        j.client = msg.sender;
        j.worker = worker;
        j.amount = amount;
        j.deadline = deadline;
        j.reviewWindow = defaultReviewWindow;
        j.status = JobStatus.Created;
        emit JobCreated(jobId, jobRef, msg.sender, worker, amount, deadline);
    }

    function fundJob(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Created) revert InvalidStatus();
        if (msg.sender != j.client) revert Unauthorized();
        if (j.funded) revert AlreadyFunded();

        j.funded = true;
        j.status = JobStatus.Funded;
        usdc.safeTransferFrom(msg.sender, address(this), j.amount);
        emit JobFunded(jobId, msg.sender, j.amount);
    }

    function assignWorker(uint256 jobId, address worker) external whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Funded) revert InvalidStatus();
        if (msg.sender != j.client) revert Unauthorized();
        if (worker == address(0)) revert InvalidAddress();
        if (j.worker != address(0) && j.worker != worker) revert WorkerAlreadySet();

        j.worker = worker;
        emit WorkerAssigned(jobId, worker);
    }

    function markDelivered(uint256 jobId, bytes32 deliveryHash) external whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Funded) revert InvalidStatus();
        if (msg.sender != j.worker) revert Unauthorized();
        if (j.worker == address(0)) revert WorkerNotSet();
        if (!j.funded) revert NotFunded();

        j.deliveryHash = deliveryHash;
        j.deliveredAt = uint64(block.timestamp);
        j.status = JobStatus.Delivered;
        emit JobDelivered(jobId, msg.sender, deliveryHash, j.deliveredAt);
    }

    function accept(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Delivered) revert InvalidStatus();
        if (msg.sender != j.client) revert Unauthorized();

        j.status = JobStatus.Accepted;
        _releaseToWorker(jobId, j);
        emit JobAccepted(jobId, msg.sender);
    }

    function autoRelease(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Delivered) revert InvalidStatus();
        if (block.timestamp < uint256(j.deliveredAt) + uint256(j.reviewWindow)) {
            revert ReviewWindowActive();
        }

        j.status = JobStatus.AutoReleased;
        _releaseToWorker(jobId, j);
        emit JobAutoReleased(jobId, msg.sender);
    }

    function openDispute(uint256 jobId) external whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Delivered && j.status != JobStatus.Funded) revert InvalidStatus();
        if (msg.sender != j.client && msg.sender != j.worker) revert Unauthorized();
        if (j.status == JobStatus.Funded && j.worker == address(0)) revert WorkerNotSet();

        j.status = JobStatus.Disputed;
        emit DisputeOpened(jobId, msg.sender);
    }

    function resolveDispute(uint256 jobId, uint128 workerAmount, uint128 clientAmount)
        external
        nonReentrant
        whenNotPaused
    {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Disputed) revert InvalidStatus();
        if (msg.sender != arbitrator) revert Unauthorized();
        if (uint256(workerAmount) + uint256(clientAmount) != uint256(j.amount)) revert InvalidSplit();

        j.status = JobStatus.Resolved;

        if (clientAmount > 0) {
            usdc.safeTransfer(j.client, clientAmount);
            emit FundsRefunded(jobId, j.client, clientAmount);
        }
        if (workerAmount > 0) {
            uint128 fee = uint128((uint256(workerAmount) * platformFeeBps) / 10_000);
            uint128 net = workerAmount - fee;
            if (net > 0) usdc.safeTransfer(j.worker, net);
            if (fee > 0) usdc.safeTransfer(feeRecipient, fee);
            emit FundsReleased(jobId, j.worker, net, fee);
        }

        emit DisputeResolved(jobId, workerAmount, clientAmount);
    }

    function cancel(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage j = jobs[jobId];

        if (j.status == JobStatus.Created) {
            if (msg.sender != j.client) revert Unauthorized();
            j.status = JobStatus.Cancelled;
            emit JobCancelled(jobId, msg.sender);
            return;
        }

        if (j.status != JobStatus.Funded) revert InvalidStatus();

        if (msg.sender == j.client) {
            if (j.worker != address(0)) revert Unauthorized();
        } else if (msg.sender == j.worker) {
            if (j.worker == address(0)) revert Unauthorized();
        } else {
            revert Unauthorized();
        }

        j.status = JobStatus.Cancelled;
        _refundClient(jobId, j);
        emit JobCancelled(jobId, msg.sender);
    }

    function expireRefund(uint256 jobId) external nonReentrant whenNotPaused {
        Job storage j = jobs[jobId];
        if (j.status != JobStatus.Funded) revert InvalidStatus();
        if (j.deadline == 0 || block.timestamp <= j.deadline) revert DeadlineNotPassed();

        j.status = JobStatus.Expired;
        _refundClient(jobId, j);
        emit JobExpired(jobId);
    }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _releaseToWorker(uint256 jobId, Job storage j) internal {
        uint128 fee = uint128((uint256(j.amount) * platformFeeBps) / 10_000);
        uint128 net = j.amount - fee;
        if (net > 0) usdc.safeTransfer(j.worker, net);
        if (fee > 0) usdc.safeTransfer(feeRecipient, fee);
        emit FundsReleased(jobId, j.worker, net, fee);
    }

    function _refundClient(uint256 jobId, Job storage j) internal {
        uint128 amount = j.amount;
        usdc.safeTransfer(j.client, amount);
        emit FundsRefunded(jobId, j.client, amount);
    }
}
