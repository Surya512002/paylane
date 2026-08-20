# Networks (Arc-first)

Paylane is configured for **Arc Testnet** by default. Base chains remain available via env for future multi-chain deployments.

## Supported chains

| Key | Chain ID | USDC | Escrow (testnet) | Notes |
|-----|----------|------|------------------|-------|
| `arc-testnet` | 5042002 | `0x3600…0000` | `0x1447…9805` | **Default** — live escrow deployed |
| `base-sepolia` | 84532 | `0x036C…CF7e` | `0x7275…c1eB` | Optional — add to `SUPPORTED_CHAINS` |
| `arc-mainnet` | (env) | (env) | (env) | When Arc mainnet launches |
| `base-mainnet` | 8453 | `0x8335…2913` | (env) | Future |

## Default environment

```bash
NEXT_PUBLIC_ACTIVE_CHAIN=arc-testnet
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet

NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_ESCROW_ADDRESS=0x144762e02f9676593D955CF0d184323474C79805
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app

DEMO_MODE=false
PLATFORM_FEE_BPS=10
```

To enable Base Sepolia in the header dropdown:

```bash
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet,base-sepolia
NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA=0x7275FB5e77c18143F8f87d8B1485Ca840ADec1eB
```

## Wallet flow

1. Connect wallet in the header.
2. Stay on **Arc Testnet** (or switch if multi-chain is enabled).
3. **Sign in** (SIWE).
4. Fund jobs — approve USDC and call escrow on that chain.

## Amounts & decimals

The app ledger uses **6-decimal minor units** everywhere.

**Arc Testnet:** ERC-20 USDC at `0x3600…` uses **6 decimals** for `approve` / `balanceOf` / escrow. Native gas USDC uses 18 decimals in the wallet — Paylane reads `decimals()` on-chain and never mixes the two.

**Base Sepolia:** USDC is 6 decimals on-chain (no scaling needed).

## Deploy escrow

```bash
# Arc Testnet (primary)
PRIVATE_KEY=0x... ./scripts/deploy-arc-testnet.sh

# Base Sepolia (optional)
PRIVATE_KEY=0x... ./scripts/deploy-base-sepolia.sh
```

## Vercel / production

Set `NEXT_PUBLIC_ACTIVE_CHAIN=arc-testnet` and escrow addresses in Vercel env. See [VERCEL_ENV.md](./VERCEL_ENV.md).

Keep `DEMO_MODE=false` when escrow is deployed. Hide chains without escrow from `NEXT_PUBLIC_SUPPORTED_CHAINS`.

See also: [Arc Testnet guide](./ARC_TESTNET_GUIDE.md) · [Mainnet checklist](./MAINNET_CHECKLIST.md)
