# User Guide — Clients (Mode A)

**Last updated:** 2026-07-28 · **Network:** Arc Testnet (or mainnet via env)

## Before you start

1. Add **Arc Testnet** to your wallet (chain ID `5042002`)
2. Get USDC from [faucet.circle.com](https://faucet.circle.com)
3. Open Paylane → **Connect wallet** → **Sign in**
4. Check **Settings** — if it says LIVE, funds move on-chain; if DEMO, funding is simulated

## Post a job

1. **Hire / Work** → **Post**
2. Title, description, budget in USDC, deadline
3. Add **at least one acceptance criterion** (checklist)
4. Save draft → open the job → **Publish**

## Fund escrow

You will see either:

- **Approve USDC & fund escrow** (live) — three wallet steps: approve → createJob → fundJob  
- **Fund escrow** (demo) — records a simulated lock in the database

Until status is **Funded**, workers should not start paid work.

**Fee:** default **2%** taken only when USDC is released to the worker (not on full refunds).

## After delivery

Within the review window (default **72 hours**):

| Action | Result |
|--------|--------|
| Accept | Releases USDC to worker (− fee), on-chain if live |
| Request revision | Up to **2** times; reason required |
| Dispute | Freezes escrow; admin can split |
| Do nothing | Auto-release to worker after the window |

## Tips

- Put measurable checklist items (“Responsive layout”, not “Looks good”)
- Watch the auto-release countdown on the job page
- Receipts → Arcscan link when the fund tx is real

More: [Money rules](./MONEY_RULES.md) · [Arc Testnet guide](./ARC_TESTNET_GUIDE.md)
