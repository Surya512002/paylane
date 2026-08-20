# Money Rules

**Version:** 1.0.0 · **Last updated:** 2026-07-28

Live configurable defaults (env):

| Param | Default | Env |
|-------|---------|-----|
| Platform fee | 0.1% (10 bps) | `PLATFORM_FEE_BPS` |
| Review window | 72 hours | `REVIEW_WINDOW_HOURS` |
| Revision limit | 2 | `REVISION_LIMIT` |
| Dispute evidence | 72 hours | `DISPUTE_EVIDENCE_HOURS` |

---

## Mode A — Escrow

### Funding
- Full job amount locked in `PaylaneEscrow` before paid work
- Wrong network / non-allowlisted USDC → blocked

### Fee
- On release to worker (accept, auto-release, or dispute worker share): `fee = amount * bps / 10000`
- Full client refund: **no success fee**

### Release paths
1. Client accept
2. Auto-release after review window with no dispute
3. Admin dispute resolve
4. Valid cancel/refund / deadline expire

### Auto-release
- Starts at first `deliveredAt`
- Does **not** reset on revision
- Dispute moves status to Disputed → auto-release impossible

### Revisions
- Max K (default 2); reason + remaining checklist required
- After max: Accept or Dispute only

### Cancellation
| Situation | Money |
|-----------|-------|
| Before assignment (no worker) | Full refund |
| Worker cancels pre-delivery | Full refund |
| After delivery | No cancel; accept/dispute/auto-release |
| Missed deadline, no delivery | Full refund via expire |

### Disputes
- Escrow frozen; admin release / refund / split (`workerAmount + clientAmount = amount`)
- Fee on worker portion only

---

## Mode B — API / Agents

- **Not escrow.** Payment unlocks access immediately.
- Settlement via x402 + Circle Gateway Nanopayments (batched)
- Successful response → generally **non-refundable**
- Optional seller-initiated manual refund (logged)
- **Credit policy:** if seller returns **5xx after valid payment**, platform credits/retries (default on)
- Disabled endpoint rejects new paid calls
- Replay / invalid payment rejected; unpaid → HTTP 402

See [CONTRACT_SPEC](./CONTRACT_SPEC.md) · [STATE_MACHINE](./STATE_MACHINE.md) · [DISPUTE_POLICY](./DISPUTE_POLICY.md)
