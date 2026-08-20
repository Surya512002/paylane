# Paylane — Monorepo guide

USDC-native **work + payments** on Circle’s **Arc** blockchain.

| Mode | What | Settlement |
|------|------|------------|
| **A — Hire / Work** | Freelance escrow | `PaylaneEscrowUpgradeable` UUPS proxy on Arc |
| **B — API / Agents** | Pay-per-call APIs | x402 + Circle Gateway (demo HMAC locally) |

**Product name:** Paylane · **Repo folder:** `paylane` (legacy paths may say `workpay`)

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 15 (App Router) + TypeScript + Tailwind |
| DB | Prisma + PostgreSQL |
| Contracts | Foundry — `PaylaneEscrowUpgradeable` (UUPS) + `PaylaneEscrow` |
| Chain (default) | **Arc Testnet** `5042002` |
| Shared | `packages/shared` — money helpers, zod schemas |

**Defaults:** **0.1%** platform fee (`PLATFORM_FEE_BPS=10`), **72h** review window, **2** revisions, **72h** dispute evidence, API credit on seller 5xx.

---

## Monorepo layout

```
paylane/
  apps/web                 Next.js app + Prisma + in-app docs (/docs)
  packages/contracts       Foundry escrow + deployments/
  packages/shared          enums / money / zod
  examples/agent-buyer     Mode B pay demo
  examples/paid-api-seller Mode B seller sketch
  docs/                    Source markdown (served in-app)
  scripts/                 deploy-arc-testnet.sh, pg-start.sh
```

---

## Local development

### 1) Postgres

```bash
./scripts/pg-start.sh
# or: docker compose up -d
```

### 2) Web app

```bash
cd apps/web
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

`.env` ships with **live Arc Testnet escrow** (`DEMO_MODE=false`). Simulated escrow only applies when `DEMO_MODE=true` **and** no escrow address is configured.

### 3) Live Arc Testnet (already deployed)

| Item | Value |
|------|--------|
| Escrow proxy | `0x144762e02f9676593D955CF0d184323474C79805` |
| USDC (ERC-20) | `0x3600000000000000000000000000000000000000` |
| Platform fee (on-chain) | **10 bps (0.1%)** |
| Explorer | https://testnet.arcscan.app |

Redeploy / upgrade: `./scripts/deploy-arc-testnet.sh` — see [docs/ARC_TESTNET_GUIDE.md](./docs/ARC_TESTNET_GUIDE.md).

---

## Mode A — Freelance flow (live)

1. Connect wallet on **Arc Testnet** → **Sign in** (SIWE)
2. **Post a job** with checklist → **Publish**
3. **Approve USDC & fund escrow** — wallet steps:
   - `approve` (skipped if allowance already sufficient)
   - `createJob` + `fundJob` on `PaylaneEscrow`
4. **Assign worker** (client; on-chain `assignWorker` when live)
5. Worker **submits delivery** (`markDelivered` on-chain when live)
6. Client **Accept & release** — USDC to worker minus **0.1%** fee

Cron auto-release: `npm run cron:auto-release` or `POST /api/cron/auto-release` with `CRON_SECRET`.

---

## Mode B — Agent buyer demo

```bash
# with apps/web running
cd examples/agent-buyer && npm install && WORKPAY_URL=http://localhost:3000 npm run pay
```

Expect: unpaid **402** → paid **200** → replay rejected.

---

## Arc USDC decimals (important)

Arc uses **one USDC balance** with two views:

| Interface | Decimals | Used for |
|-----------|----------|----------|
| Native (gas) | 18 | `eth_getBalance`, MetaMask gas display |
| ERC-20 at `0x3600…` | **6** | `approve`, `balanceOf`, escrow `transferFrom` |

Paylane reads ERC-20 `decimals()` and `balanceOf` for funding. The app ledger always uses **6-decimal minor units** internally.

---

## Tests

```bash
cd packages/contracts && forge test   # 22 escrow tests
cd apps/web && npm test
```

QA: [docs/QA_CHECKLIST.md](./docs/QA_CHECKLIST.md) · Mainnet: [docs/MAINNET_CHECKLIST.md](./docs/MAINNET_CHECKLIST.md)

---

## Mainnet switch (env only)

```bash
NEXT_PUBLIC_ACTIVE_CHAIN=arc-mainnet
NEXT_PUBLIC_ARC_MAINNET_CHAIN_ID=<id>
NEXT_PUBLIC_ARC_MAINNET_RPC=<rpc>
NEXT_PUBLIC_ARC_MAINNET_USDC=<usdc>
NEXT_PUBLIC_ESCROW_ADDRESS=<proxy>
DEMO_MODE=false
PLATFORM_FEE_BPS=10
```

---

## Security

- Non-custodial escrow — no platform hot wallet  
- Reentrancy guards, pause, fee cap (max 10%), arbitrator-only resolve  
- Idempotent job transitions; x402 replay protection  
- Never put private keys in the frontend  

MIT (MVP / testnet). Replace Terms stub before mainnet.
