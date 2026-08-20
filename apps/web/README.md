# Paylane Web App

Next.js 15 app for Paylane — Arc Testnet escrow, SIWE auth, job marketplace, x402 demo APIs, and in-app docs.

## Setup

```bash
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000

## Environment (Arc Testnet — default)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL |
| `NEXT_PUBLIC_ACTIVE_CHAIN` | `arc-testnet` |
| `NEXT_PUBLIC_SUPPORTED_CHAINS` | `arc-testnet` (add `base-sepolia` for multi-chain) |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | Live proxy `0x1447…9805` |
| `DEMO_MODE` | `false` for live escrow |
| `PLATFORM_FEE_BPS` | `10` (0.1%) |

See `.env.example` and [docs/VERCEL_ENV.md](../../docs/VERCEL_ENV.md).

## Key routes

| Route | Description |
|-------|-------------|
| `/` | Landing + getting started |
| `/jobs` | Marketplace |
| `/jobs/new` | Post a job |
| `/jobs/[id]` | Fund, assign, deliver, accept |
| `/dashboard` | Your jobs |
| `/settings` | Chain, escrow, LIVE status |
| `/docs` | Documentation |
| `/trust` | Trust center |

## Scripts

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm test             # Vitest
npm run db:push      # Prisma schema push
npm run db:seed      # Seed demo users/jobs
npm run cron:auto-release
```

## Live testnet flow

1. Wallet on Arc Testnet (`5042002`)
2. Sign in (SIWE)
3. Post job → Publish → Approve USDC & fund escrow
4. Assign → Submit → Accept

Funding uses ERC-20 USDC (6 decimals on Arc). See [Arc Testnet guide](../../docs/ARC_TESTNET_GUIDE.md).
