# Paylane

USDC-native **work + payments** on **Arc** (Circle’s stablecoin chain).

- **Mode A — Hire / Work** — Non-custodial `PaylaneEscrow` smart-contract escrow on Arc Testnet
- **Mode B — API / Agents** — x402 micropayments (demo HMAC proofs locally; Gateway for production)

**Live testnet:** Arc Testnet · chain ID `5042002` · escrow proxy `0x144762e02f9676593D955CF0d184323474C79805`

## Quick start

```bash
cp apps/web/.env.example apps/web/.env
npm install
./scripts/pg-start.sh   # or: docker compose up -d
npm run db:push -w web
npm run db:seed -w web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. Connect MetaMask on **Arc Testnet**
2. **Sign in** (SIWE)
3. **Post a job** → publish → approve USDC & fund escrow on-chain
4. Assign worker → submit work → accept & release

Get testnet USDC: [faucet.circle.com](https://faucet.circle.com)

## Defaults (env-overridable)

| Setting | Value |
|---------|--------|
| Platform fee | **0.1%** (`PLATFORM_FEE_BPS=10`) — on worker release only |
| Review window | 72 hours |
| Revisions | 2 max |
| Active chain | `arc-testnet` |

## Docs

| Topic | File |
|-------|------|
| Arc Testnet walkthrough | [docs/ARC_TESTNET_GUIDE.md](./docs/ARC_TESTNET_GUIDE.md) |
| Money rules | [docs/MONEY_RULES.md](./docs/MONEY_RULES.md) |
| Contract spec | [docs/CONTRACT_SPEC.md](./docs/CONTRACT_SPEC.md) |
| Networks / env | [docs/NETWORKS.md](./docs/NETWORKS.md) |
| Vercel deploy | [docs/VERCEL_ENV.md](./docs/VERCEL_ENV.md) |
| Full monorepo guide | [WORKPAY_README.md](./WORKPAY_README.md) |

In-app: `/docs` · `/trust` · `/settings`

## Tests

```bash
cd packages/contracts && forge test   # escrow money paths
cd apps/web && npm test               # API + state machine
```

## Mainnet

No code changes — update env (`NEXT_PUBLIC_ACTIVE_CHAIN`, escrow address, RPC). See [docs/MAINNET_CHECKLIST.md](./docs/MAINNET_CHECKLIST.md).
