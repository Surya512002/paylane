# Paylane

USDC-native work + payments on Circle’s **Arc** blockchain.

The application monorepo lives in [`workpay/`](./workpay/).

```bash
cd workpay
cp apps/web/.env.example apps/web/.env
npm install
npm run db:push -w web
npm run dev
```

See [workpay/README.md](./workpay/README.md) for Arc Testnet deploy, escrow, and Mode A/B docs.
