# Indexer (stub)

Poll Arc RPC for `WorkPayEscrow` events (`JobFunded`, `FundsReleased`, …) and upsert `LedgerEntry` / job status.

```bash
# future
npm run indexer
```

For MVP, DEMO_MODE writes ledger rows directly from API transitions. Enable this service when `DEMO_MODE=false`.
