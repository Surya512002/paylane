# Paylane Escrow Contract Spec (Mode A)

**Version:** 1.0.0  
**Last updated:** 2026-07-28  
**Network (MVP):** Arc Testnet  
**Token:** USDC (6 decimals; amounts in minor units / `uint256`)

This document is the source of truth for Mode A (freelance escrow) smart contracts. Mode B (x402 / Gateway nanopayments) is **off-contract** and covered in `MONEY_RULES.md`.

---

## 1. Goals & non-goals

### Goals
- Lock client USDC **before** paid work starts
- Release only via accept, auto-release, cancel/refund rules, or arbitrator resolve
- Non-custodial: platform never holds a hot-wallet omnibus of user funds
- Auditable: emit events for every money / state change
- Reentrancy-safe, pausable, fee-configurable, no owner-steal function

### Non-goals
- Mode B micropayments (handled via Circle Gateway + x402)
- Custodial custody of funds
- On-chain messaging or file storage (delivery hash optional only)

---

## 2. Contracts

**MVP choice:** UUPS upgradeable `PaylaneEscrowUpgradeable` behind an ERC1967 proxy (recommended for Arc testnet → mainnet). Immutable `PaylaneEscrow` remains available for simple deploys.

| Contract | Role |
|----------|------|
| `PaylaneEscrowUpgradeable` | Logic implementation (UUPS) |
| ERC1967 proxy | Stores balances + job state; address stays stable across upgrades |
| `PaylaneEscrow` | Non-upgradeable variant (unit-tested) |
| `MockUSDC` | Test-only ERC20 (6 decimals) |
---

## 3. Roles

| Role | Address source | Powers |
|------|----------------|--------|
| `client` | Per job | fund, cancel (rules), accept, requestRevision (off-chain gate; on-chain accept/dispute), openDispute |
| `worker` | Per job | deliver (optional hash), openDispute, cancel (rules) |
| `arbitrator` | Contract config (admin multisig later) | `resolveDispute` only |
| `owner` / `pauser` | Deployer → transferrable | pause/unpause, set fee, set review window, set arbitrator, set fee recipient |
| Anyone | — | `autoRelease` after review window (permissionless crank) |

**Invariant:** `owner` cannot withdraw arbitrary escrow balances. Owner may only change config when not abusing paused state for theft (pause freezes transitions; balances remain locked until unpause + valid transition).

---

## 4. Job struct (on-chain)

```solidity
enum JobStatus {
  None,        // 0
  Created,     // 1 — created, not funded
  Funded,      // 2 — USDC locked
  Delivered,   // 3 — worker marked delivery
  Accepted,    // 4 — released to worker (terminal)
  Disputed,    // 5 — frozen
  Resolved,    // 6 — arbitrator settled (terminal)
  AutoReleased,// 7 — crank released (terminal)
  Cancelled,   // 8 — refunded under rules (terminal)
  Expired      // 9 — deadline miss refund (terminal)
}

struct Job {
  address client;
  address worker;          // address(0) until assigned
  uint128 amount;          // gross USDC locked (minor units)
  uint64  deadline;        // unix; 0 = no deadline enforcement on-chain
  uint64  deliveredAt;     // set on deliver
  uint64  reviewWindow;    // seconds; copied from global at fund time
  JobStatus status;
  bytes32 deliveryHash;    // optional content hash
  bool    funded;
}
```

Off-chain DB tracks Draft / Published / Assigned / InProgress / RevisionRequested. On-chain focuses on **money-critical** states: Created → Funded → Delivered → {Accepted | AutoReleased | Disputed → Resolved} | Cancelled | Expired.

---

## 5. Configuration (global)

| Param | Default | Notes |
|-------|---------|-------|
| `platformFeeBps` | 200 (2%) | Taken on release-to-worker paths only |
| `feeRecipient` | treasury | Receives fee portion |
| `defaultReviewWindow` | 3 days | Copied onto job at fund |
| `arbitrator` | admin | Resolve disputes |
| `usdc` | immutable | Allowlisted token |
| `paused` | false | Blocks state-changing money fns |

Fee formula (release to worker):
```
fee = amount * platformFeeBps / 10_000
workerNet = amount - fee
```
Full client refund: **fee = 0** (default).  
Split: fee applied only to the worker portion (configurable; default: fee on worker share only).

---

## 6. Methods

### 6.1 `createJob(bytes32 jobRef, address worker, uint128 amount, uint64 deadline) → uint256 jobId`
- Caller becomes `client`
- `amount > 0`
- Status: `Created`
- Emits `JobCreated`

### 6.2 `fundJob(uint256 jobId)`
- Only `client`
- Status must be `Created`
- Pulls `amount` USDC via `transferFrom` (client must approve)
- Status → `Funded`, `funded = true`
- Emits `JobFunded`

### 6.3 `assignWorker(uint256 jobId, address worker)` (optional if set at create)
- Only `client`, status `Funded`, worker was `address(0)` or same
- Emits `WorkerAssigned`

### 6.4 `markDelivered(uint256 jobId, bytes32 deliveryHash)`
- Only `worker`, status `Funded`
- Sets `deliveredAt = block.timestamp`, `deliveryHash`, status → `Delivered`
- Emits `JobDelivered`

### 6.5 `accept(uint256 jobId)`
- Only `client`, status `Delivered`
- Transfers `workerNet` to worker, `fee` to feeRecipient
- Status → `Accepted`
- Emits `JobAccepted`, `FundsReleased`

### 6.6 `autoRelease(uint256 jobId)`
- Anyone; status `Delivered`
- Require `block.timestamp >= deliveredAt + reviewWindow`
- Same payout as accept
- Status → `AutoReleased`
- Emits `JobAutoReleased`, `FundsReleased`

### 6.7 `openDispute(uint256 jobId)`
- `client` or `worker`; status `Delivered` (or `Funded` after assignment — MVP: `Delivered` or `Funded` if worker set)
- Status → `Disputed`
- Emits `DisputeOpened`
- **Freezes** auto-release (status no longer `Delivered`)

### 6.8 `resolveDispute(uint256 jobId, uint128 workerAmount, uint128 clientAmount)`
- Only `arbitrator`; status `Disputed`
- Require `workerAmount + clientAmount == amount`
- If `workerAmount > 0`: fee on worker portion; net to worker; remainder of worker portion fee to feeRecipient; `clientAmount` to client
- Status → `Resolved`
- Emits `DisputeResolved`, `FundsReleased` / `FundsRefunded`

### 6.9 `cancel(uint256 jobId)`
Rules:
- `Created` (unfunded): client cancels → `Cancelled` (no token move)
- `Funded` + `worker == address(0)`: client → full refund → `Cancelled`
- `Funded` + worker set + not delivered: worker may cancel → full refund → `Cancelled` (reputation off-chain)
- After `Delivered`: cancel blocked; use accept/dispute/auto-release

Emits `JobCancelled`, `FundsRefunded` when applicable.

### 6.10 `expireRefund(uint256 jobId)`
- Anyone; status `Funded`; `deadline != 0`; `block.timestamp > deadline`; not delivered
- Full refund to client → `Expired`
- Emits `JobExpired`, `FundsRefunded`

### 6.11 Admin
- `pause()` / `unpause()`
- `setPlatformFeeBps(uint16)` — max 1000 (10%)
- `setFeeRecipient(address)`
- `setArbitrator(address)`
- `setDefaultReviewWindow(uint64)` — bounds 1–7 days enforced in app; contract allows 1 hour–14 days

---

## 7. Events

```solidity
event JobCreated(uint256 indexed jobId, bytes32 jobRef, address indexed client, address worker, uint128 amount, uint64 deadline);
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
event ArbitratorUpdated(address indexed arbitrator);
event Paused(address account);
event Unpaused(address account);
```

---

## 8. Invariants

1. Sum of USDC held by contract == sum of amounts in non-terminal funded jobs
2. No transition from terminal states
3. Release/refund paths move exactly `amount` (split: worker+client (+fee from worker share) accounts for full amount)
4. Fee never taken on full client refund
5. Auto-release impossible while `Disputed`
6. Only allowlisted `usdc` token accepted
7. Reentrancy: checks-effects-interactions + nonReentrant on all money movers
8. Wrong network: deploy-time chain; app allowlists chain id
9. Idempotency: status gates prevent double-pay
10. No function lets owner drain job balances

---

## 9. Security checklist

- [x] ReentrancyGuard on fund/release/refund/resolve
- [x] Pausable on state-changing entrypoints
- [x] Safe ERC20 (OpenZeppelin SafeERC20)
- [x] Fee bps capped
- [x] Arbitrator-only resolve
- [x] Permissionless auto-release / expire cranks
- [x] No arbitrary ERC20 rescue of USDC job funds (optional: rescue non-USDC tokens only)
- [x] Unit tests for all money paths (see `packages/contracts/test`)

---

## 10. Integration notes (app)

| Off-chain state | On-chain action |
|-----------------|-----------------|
| Draft / Published | DB only |
| Funded | `fundJob` after `createJob` |
| Assigned / InProgress | `assignWorker` + DB |
| Delivered | `markDelivered` + DB artifacts |
| RevisionRequested | DB only (does not change escrow; still `Delivered` or stay funded until re-deliver — MVP: revisions are DB; worker re-calls `markDelivered` only if needed; typically status stays Delivered until accept/dispute) |
| Accepted / AutoReleased / Disputed / Resolved | matching contract calls |

**Revision MVP:** On-chain status remains `Delivered` during revisions; review window resets only if product chooses to call a future `resetDelivery` — **default: review window does NOT reset on revision** (protects worker). Documented in `MONEY_RULES.md`.

---

## 11. Arc deployment

| Network | Chain ID | USDC | Explorer |
|---------|----------|------|----------|
| Arc Testnet | (config) | (config `.env`) | (config) |
| Arc Mainnet | (config) | (config) | (config) |

Addresses written to `packages/contracts/deployments/<network>.json` after deploy.
