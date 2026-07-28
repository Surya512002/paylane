# Vercel environment variables (Paylane)

Set these in **Vercel → Project `paylane` → Settings → Environment Variables**.  
Apply to **Production**, **Preview**, and **Development** unless noted.

Neon Postgres vars (`DATABASE_URL`, `POSTGRES_*`, etc.) are created automatically if you added the Neon integration — **do not delete those**.

---

## Required (server)

| Variable | Example / notes |
|----------|-----------------|
| `DATABASE_URL` | From Neon integration (pooled URL) |
| `SESSION_SECRET` | Random 32+ char secret (`openssl rand -hex 32`) |
| `CRON_SECRET` | Random secret for `/api/cron/auto-release` |
| `ADMIN_WALLETS` | Comma-separated lowercase `0x…` addresses |

## App mode

| Variable | Production value | Notes |
|----------|------------------|-------|
| `DEMO_MODE` | `false` | `true` = simulated escrow (no wallet txs) |

## Multi-chain (public — safe in browser)

| Variable | Production value |
|----------|----------------|
| `NEXT_PUBLIC_ACTIVE_CHAIN` | `arc-testnet` |
| `NEXT_PUBLIC_SUPPORTED_CHAINS` | `arc-testnet,base-sepolia` |

### Arc Testnet (active / default)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CHAIN_ID` | `5042002` |
| `NEXT_PUBLIC_CHAIN_NAME` | `Arc Testnet` |
| `NEXT_PUBLIC_RPC` | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_ARC_RPC` | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_USDC_ADDRESS` | `0x3600000000000000000000000000000000000000` |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://testnet.arcscan.app` |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | `0x144762e02f9676593D955CF0d184323474C79805` |
| `NEXT_PUBLIC_ESCROW_ADDRESS_ARC_TESTNET` | `0x144762e02f9676593D955CF0d184323474C79805` |

### Base Sepolia (add after deploy)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA` | `0x…` from `./scripts/deploy-base-sepolia.sh` |

Base Sepolia USDC / RPC / explorer are **built-in defaults** — you only need the escrow address once deployed.

## Money rules (optional — defaults are fine)

| Variable | Default |
|----------|---------|
| `PLATFORM_FEE_BPS` | `200` (2%) |
| `REVIEW_WINDOW_HOURS` | `72` |
| `REVISION_LIMIT` | `2` |
| `DISPUTE_EVIDENCE_HOURS` | `72` |
| `API_CREDIT_ON_SELLER_5XX` | `true` |

---

## Future: Base mainnet

```env
NEXT_PUBLIC_ACTIVE_CHAIN=base-mainnet
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-mainnet,base-mainnet
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_CHAIN_NAME=Base
NEXT_PUBLIC_RPC=https://mainnet.base.org
NEXT_PUBLIC_USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
NEXT_PUBLIC_EXPLORER_URL=https://basescan.org
NEXT_PUBLIC_ESCROW_ADDRESS_BASE_MAINNET=0x…
```

## Future: Arc mainnet

```env
NEXT_PUBLIC_ACTIVE_CHAIN=arc-mainnet
NEXT_PUBLIC_ARC_MAINNET_CHAIN_ID=<from Circle>
NEXT_PUBLIC_ARC_MAINNET_RPC=<rpc>
NEXT_PUBLIC_ARC_MAINNET_USDC=<usdc>
NEXT_PUBLIC_ARC_MAINNET_EXPLORER=<explorer>
NEXT_PUBLIC_ESCROW_ADDRESS_ARC_MAINNET=0x…
```

---

## After changing env vars

1. **Redeploy** — Vercel → Deployments → Redeploy (or push to `master`; Git is connected).
2. Confirm **Settings → General → Root Directory** = `apps/web`.
3. Open **https://paylane-nu.vercel.app/settings** — both chains should appear under “Supported chains”.

## Quick copy block (Production — Arc live today)

```env
NEXT_PUBLIC_ACTIVE_CHAIN=arc-testnet
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet,base-sepolia
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_CHAIN_NAME=Arc Testnet
NEXT_PUBLIC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app
NEXT_PUBLIC_ESCROW_ADDRESS=0x144762e02f9676593D955CF0d184323474C79805
NEXT_PUBLIC_ESCROW_ADDRESS_ARC_TESTNET=0x144762e02f9676593D955CF0d184323474C79805
DEMO_MODE=false
PLATFORM_FEE_BPS=200
REVIEW_WINDOW_HOURS=72
REVISION_LIMIT=2
DISPUTE_EVIDENCE_HOURS=72
API_CREDIT_ON_SELLER_5XX=true
ADMIN_WALLETS=0x3799cafa388da047caf7c999e31c844705fadfae
```

Generate secrets locally (do **not** commit):

```bash
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 24   # CRON_SECRET
```
