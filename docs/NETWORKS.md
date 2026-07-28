# Multi-chain setup (Arc + Base)

Paylane supports **Arc** and **Base** in one app. Users pick the network from the header wallet menu; escrow, USDC, and explorers resolve per chain.

## Supported chains

| Key | Chain ID | USDC | Notes |
|-----|----------|------|-------|
| `arc-testnet` | 5042002 | Native USDC (18 decimals on-chain) | Circle Arc Testnet |
| `base-sepolia` | 84532 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` | Base testnet |
| `base-mainnet` | 8453 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Production Base |
| `arc-mainnet` | (env) | (env) | When Arc mainnet launches |

## Environment

```bash
NEXT_PUBLIC_ACTIVE_CHAIN=arc-testnet
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet,base-sepolia

# Per-chain escrow (recommended)
NEXT_PUBLIC_ESCROW_ADDRESS_ARC_TESTNET=0x...
NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA=0x...
```

Legacy `NEXT_PUBLIC_CHAIN_ID`, `NEXT_PUBLIC_ESCROW_ADDRESS`, and `NEXT_PUBLIC_ARC_RPC` still apply to the **active** chain.

## Deploy escrow

```bash
# Arc Testnet
PRIVATE_KEY=0x... ./scripts/deploy-arc-testnet.sh

# Base Sepolia
PRIVATE_KEY=0x... ./scripts/deploy-base-sepolia.sh

# Base mainnet (when ready)
PRIVATE_KEY=0x... ./scripts/deploy-base-mainnet.sh
```

## Wallet flow

1. Connect wallet in the header.
2. Choose **Arc Testnet** or **Base Sepolia** from the network dropdown.
3. Sign in (SIWE uses your wallet’s current chain).
4. Fund jobs — approve USDC and call the escrow proxy **on that chain**.

## Amounts

The app ledger uses **6-decimal minor units** everywhere. On Arc, on-chain USDC uses 18 decimals — Paylane scales automatically when approving and funding escrow. Base USDC is 6 decimals on-chain (no scaling).

## Vercel / production

Set `NEXT_PUBLIC_SUPPORTED_CHAINS` and per-chain `NEXT_PUBLIC_ESCROW_ADDRESS_*` in the Vercel project env. Keep `DEMO_MODE=false` only when every chain you expose has a deployed escrow (or hide chains without escrow).

See also: [Arc Testnet guide](./ARC_TESTNET_GUIDE.md) · [Mainnet checklist](./MAINNET_CHECKLIST.md)
