# Safety and Protections

**Version:** 1.0.0 · **Last updated:** 2026-07-28

| Threat | Mitigation |
|--------|------------|
| Client bad-faith non-acceptance | Auto-release + dispute evidence |
| Genuine dissatisfaction | Revisions + checklist + split |
| Fake delivery | Required artifacts + dispute |
| Worker no-show | Deadline refund |
| Client ghosting after delivery | Auto-release |
| Scope creep | Locked checklist; paid change orders later |
| Fake payment screenshots | Verified chain/Gateway events only |
| Spam/sybil | Rate limits |
| Malicious uploads | Allowlist, size limits, no execution |
| Admin misuse | Audit log + confirmations |
| Double-click payouts | Idempotent status gates |
| Wrong network/token | Hard allowlists |
| API replay / unpaid scrape | x402 verify + rate limit |
| Agent overspend | Caps / allowlists / kill switch |
| Mode confusion | UI + docs separate Job Escrow vs API Pay |

Non-custodial design: platform does not hold user funds in a hot omnibus wallet.
