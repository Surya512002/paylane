# User Guide — Workers (Mode A)

**Last updated:** 2026-08-20 · **Network:** Arc Testnet

## Rules of engagement

- Only start paid work when the job shows **Funded** and Settings shows **LIVE**
- Your wallet must match the assigned worker address
- Deliver against the checklist; include notes + artifact URL

## Flow

1. Connect wallet on **Arc Testnet** → Sign in (SIWE)  
2. Get assigned by the client (or assign yourself if you are testing end-to-end)  
3. **Submit delivery** — live mode calls `markDelivered` on the escrow proxy  
4. Client accepts, requests revision (≤2), or disputes  

## Your protections

- **Auto-release** if the client is silent for the review window (72h default)  
- **Dispute** freezes funds for admin review  
- Auto-release clock **does not reset** when the client asks for a revision  

## Payout

On accept or auto-release you receive gross escrow amount minus **0.1%** platform fee (on-chain `platformFeeBps = 10`).

## Cancellations

If you cancel after assignment and before delivery, the client gets a **full refund** (no fee) and your reputation may drop.

See [Money rules](./MONEY_RULES.md) · [Safety](./SAFETY_AND_PROTECTIONS.md) · [Arc Testnet guide](./ARC_TESTNET_GUIDE.md)
