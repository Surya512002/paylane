# Paylane

USDC-native **work + payments** on Circle’s **Arc** blockchain.

- **Mode A** — Hire/Work escrow
- **Mode B** — API/Agent x402 micropayments

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

Full docs: [WORKPAY_README.md](./WORKPAY_README.md) and `docs/`.
