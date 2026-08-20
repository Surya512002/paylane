# Paylane Contracts

Foundry project for **PaylaneEscrow** — non-custodial USDC escrow for Mode A (freelance work).

## Contracts

| Contract | Description |
|----------|-------------|
| `PaylaneEscrowUpgradeable.sol` | UUPS upgradeable logic (production) |
| `PaylaneEscrow.sol` | Immutable variant (unit tests) |
| ERC1967 proxy | Stable address; stores job state + balances |

## Arc Testnet deployment

| Field | Value |
|-------|--------|
| Proxy | `0x144762e02f9676593D955CF0d184323474C79805` |
| Implementation | `0x97D7daD7c1F932e6C3F2bDdddAB607A3243eD7a5` |
| USDC | `0x3600000000000000000000000000000000000000` |
| Chain ID | `5042002` |
| Platform fee | **10 bps (0.1%)** |
| Manifest | `deployments/arc-testnet.json` |

Explorer: https://testnet.arcscan.app/address/0x144762e02f9676593D955CF0d184323474C79805

## Build & test

```bash
forge build
forge test
```

22 tests cover fund, accept, auto-release, dispute, cancel, pause, and fee paths.

## Deploy

```bash
export PRIVATE_KEY=0x...
export ARC_RPC=https://rpc.testnet.arc.network
forge script script/DeployUpgradeable.s.sol --rpc-url $ARC_RPC --broadcast
```

Or from repo root: `./scripts/deploy-arc-testnet.sh`

## Owner functions

```bash
# Set platform fee to 0.1%
cast send $PROXY "setPlatformFeeBps(uint16)" 10 --rpc-url $ARC_RPC --private-key $PRIVATE_KEY

# Pause / unpause
cast send $PROXY "pause()" --rpc-url $ARC_RPC --private-key $PRIVATE_KEY
```

## Fee formula

```
fee = amount * platformFeeBps / 10_000
workerNet = amount - fee
```

Default `platformFeeBps = 10` (0.1%). Max fee cap: 1000 bps (10%).

## Spec

Full ABI and state machine: [docs/CONTRACT_SPEC.md](../../docs/CONTRACT_SPEC.md)
