# Dispute Policy (Mode A)

**Version:** 1.0.0 · **Last updated:** 2026-07-28

## When disputes apply

Mode A freelance escrow only, typically from **Delivered** or **RevisionRequested** (and limited earlier cases for fraud/no-show).

## What is NOT disputable

- Mode B successful API responses (default)
- Terminal Mode A states (Accepted, AutoReleased, Resolved, Cancelled, Expired)
- Preference disagreements without evidence after auto-release

## Process

1. Either party opens dispute → escrow **frozen**, auto-release paused
2. Evidence window: **72 hours** (default) — uploads, hashes, checklist notes
3. Admin reviews; may wait for window or decide if both sides submitted
4. Admin resolves: **ReleaseToWorker** | **RefundToClient** | **Split**
5. On-chain `resolveDispute`; decision **final** and fully audit-logged

## Evidence requirements

- Linked to job id; allowlisted file types; size limits
- Fake payment screenshots **do not count** — only verified chain/Gateway events

## Split logic

`workerAmount + clientAmount == escrow amount`. Platform fee applies to worker share only.

## Admin misuse controls

Full `AuditLog` + confirmation UI; no silent balance drains.
