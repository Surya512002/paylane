# User Guide — Workers (Mode A)

**Last updated:** 2026-07-28

## Rules of engagement

- Only start paid work when the job shows **Funded** (and Settings → LIVE if you expect real USDC)
- Your wallet must match the assigned worker address
- Deliver against the checklist; include notes + artifact URL

## Flow

1. Connect wallet on Arc → Sign in  
2. Accept assignment (or get assigned by the client)  
3. **Start work** → **Submit delivery** (live mode also calls `markDelivered` on the escrow)  
4. Client accepts, requests revision (≤2), or disputes  

## Your protections

- **Auto-release** if the client is silent for the review window  
- **Dispute** freezes funds for admin review  
- Auto-release clock **does not reset** when the client asks for a revision  

## Cancellations

If you cancel after assignment and before delivery, the client gets a **full refund** and your reputation may drop.

See [Money rules](./MONEY_RULES.md) · [Safety](./SAFETY_AND_PROTECTIONS.md)
