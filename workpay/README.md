# Paylane

USDC-native **work + payments** on Circle’s **Arc** blockchain.

Two modes:

1. **Hire / Work (Mode A)** — freelance jobs with non-custodial smart-contract escrow, revisions, disputes, and auto-release  
2. **API / Agents (Mode B)** — instant x402 + Gateway-style nanopayments on Arc

Brand: **Paylane**. Repo folder: `workpay` (legacy path; product name is Paylane).

---

## Stack

| Layer | Choice |
|-------|--------|
| App | Next.js 15 (App Router) + TypeScript + Tailwind |
| DB | Prisma + PostgreSQL |
| Contracts | Foundry (`PaylaneEscrow`) |
| Chain | Arc Testnet (`5042002`) first; mainnet via config |
| Shared | `packages/shared` (money helpers, zod) |

Defaults: **2%** platform fee, **3-day** review window, **2** revisions, **72h** dispute evidence, API **credit on seller 5xx**.

---

## Monorepo layout

```
workpay/
  apps/web                 Next.js app + Prisma + in-app docs
  packages/contracts       Foundry escrow + tests
  packages/shared          enums / money / zod
  examples/agent-buyer     Mode B pay demo
  examples/paid-api-seller Mode B seller sketch
  docs/                    Source markdown (also at /docs in-app)
  docker-compose.yml       Postgres for local/prod-like runs
```

---

## Quick start (Arc testnet demos)

### 1) Postgres

**Option A — Docker**

```bash
docker compose up -d
```

**Option B — embedded binaries (no Docker/sudo)**

```bash
./scripts/pg-start.sh
```

### 2) Web app

```bash
cd apps/web
cp .env.example .env
# DATABASE_URL=postgresql://workpay:workpay@127.0.0.1:5432/workpay
# For embedded pg (trust auth, no password): postgresql://workpay@127.0.0.1:5432/workpay

npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`DEMO_MODE=true` simulates escrow fund/accept/release with fake tx hashes and HMAC x402 proofs so both demos work without deploying contracts first.

## Go live on Arc Testnet

```bash
# 1) Fund a deployer at https://faucet.circle.com
# 2) Deploy UUPS escrow proxy
export PRIVATE_KEY=0x...
./scripts/deploy-arc-testnet.sh

# 3) Point the app at the proxy
# apps/web/.env → NEXT_PUBLIC_ESCROW_ADDRESS=0x...  DEMO_MODE=false

# 4) Restart web — Settings should show LIVE
```

Full walkthrough: [`docs/ARC_TESTNET_GUIDE.md`](./docs/ARC_TESTNET_GUIDE.md) (also `/docs/arc-testnet-guide` in-app).

### 4) Mode B agent buyer demo

```bash
# with apps/web running
cd examples/agent-buyer && npm install && WORKPAY_URL=http://localhost:3000 npm run pay
```

Expect: unpaid **402** → paid **200** weather JSON → replay **402**.

### 5) Mode A freelance demo (UI)

1. Connect wallet (or use seeded addresses in DEMO_MODE via SIWE)  
2. **Hire / Work** → create job with checklist → publish → fund  
3. Assign worker → deliver → accept **or** wait/review window + cron auto-release **or** dispute → admin resolve  

Cron: `npm run cron:auto-release` (or `POST /api/cron/auto-release` with `CRON_SECRET`).

---

## In-app documentation / Trust Center

Public routes:

- `/docs` — searchable docs home  
- `/trust` — trust hub  
- `/docs/for-officials` — Arc/Circle alignment for officials  
- `/docs/money-rules`, `/docs/dispute-policy`, `/docs/risk-disclosure`, …

Source files live in [`docs/`](./docs/).

---

## Tests

```bash
cd packages/contracts && forge test   # 20 money-path tests
cd apps/web && npm test               # x402 + state machine unit tests
```

QA matrix: [`docs/QA_CHECKLIST.md`](./docs/QA_CHECKLIST.md).  
Mainnet: [`docs/MAINNET_CHECKLIST.md`](./docs/MAINNET_CHECKLIST.md).

---

## Arc network config

| Param | Testnet (default) |
|-------|---------|
| `NEXT_PUBLIC_NETWORK` | `testnet` |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| USDC ERC-20 | `0x3600000000000000000000000000000000000000` |
| Faucet | https://faucet.circle.com |

**Mainnet switch (no code change):**

```bash
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_NAME=Arc
NEXT_PUBLIC_CHAIN_ID=<mainnet-id>
NEXT_PUBLIC_ARC_RPC=<mainnet-rpc>
NEXT_PUBLIC_USDC_ADDRESS=<mainnet-usdc>
NEXT_PUBLIC_ESCROW_ADDRESS=<deployed-PaylaneEscrow>
NEXT_PUBLIC_EXPLORER_URL=<mainnet-explorer>
DEMO_MODE=false
```

Deploy escrow: `cd packages/contracts && forge script script/Deploy.s.sol --rpc-url $ARC_RPC --broadcast`

---

## Security notes

- Non-custodial escrow; no platform omnibus hot wallet  
- Reentrancy guards, pause, fee cap, arbitrator-only resolve  
- Idempotent job transitions; payment replay protection  
- Never put private keys in the frontend  

---

## License

MIT (MVP / testnet evaluation). Replace Terms stub before mainnet.
