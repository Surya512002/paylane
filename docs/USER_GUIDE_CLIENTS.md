# User Guide — Clients (Mode A)

**Last updated:** 2026-08-20 · **Network:** Arc Testnet (live escrow)

## Before you start

1. Add **Arc Testnet** to your wallet (chain ID `5042002`)
2. Get USDC from [faucet.circle.com](https://faucet.circle.com)
3. Open Paylane → **Connect wallet** → **Sign in** (SIWE)
4. Check **Settings** — should show **LIVE (on-chain)** with escrow `0x1447…9805`

## Post a job

1. **Hire / Work** → **Post**
2. Title (≥3 chars), description (≥10 chars), budget in USDC, deadline
3. Add **at least one acceptance criterion** (checklist)
4. Save draft → open the job → **Publish**

## Fund escrow (live)

Click **Approve USDC & fund escrow**. Your wallet will sign:

| Step | Contract call | When |
|------|---------------|------|
| 1 | `approve(escrow, amount)` | Only if allowance is insufficient |
| 2 | `createJob(...)` | Always |
| 3 | `fundJob(jobId)` | Always — USDC locks in escrow |

Until status is **Funded**, workers should not start paid work.

**Fee:** **0.1%** taken only when USDC is released to the worker (not on full refunds). Matches on-chain `platformFeeBps = 10`.

## After delivery

Within the review window (default **72 hours**):

| Action | Result |
|--------|--------|
| Accept | Releases USDC to worker (− 0.1% fee), on-chain |
| Request revision | Up to **2** times; reason required |
| Dispute | Freezes escrow; admin can split |
| Do nothing | Auto-release to worker after the window |

## Tips

- Use measurable checklist items (“Responsive layout”, not “Looks good”)
- Watch the auto-release countdown on the job page
- Receipts link to Arcscan for real fund/release txs

More: [Money rules](./MONEY_RULES.md) · [Arc Testnet guide](./ARC_TESTNET_GUIDE.md)
