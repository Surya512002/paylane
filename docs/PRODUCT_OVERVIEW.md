# Paylane — Product Overview

**Version:** 1.3.0 · **Last updated:** 2026-08-20

## What is Paylane?

Paylane is a **USDC work + payments app on Circle’s Arc**:

1. **Mode A — Hire / Work** — Non-custodial escrow (`PaylaneEscrowUpgradeable` UUPS proxy on Arc Testnet). Fund before work, then accept / revise / dispute / auto-release. **0.1%** fee on worker release.
2. **Mode B — API / Agents** — Instant x402 pay-per-call. Not escrow.

## Current network

**Arc Testnet** (`5042002`) with live escrow at `0x144762e02f9676593D955CF0d184323474C79805`. Mainnet via env only — see [Arc Testnet guide](./ARC_TESTNET_GUIDE.md) and [Mainnet checklist](./MAINNET_CHECKLIST.md).

## How funding works (Mode A)

```
Client wallet → approve USDC (if needed) → createJob → fundJob → escrow holds USDC
Worker delivers → markDelivered → client accept → worker paid (− 0.1% fee)
```

Arc USDC uses **6-decimal ERC-20** for escrow; native gas display uses 18 decimals. The app handles this automatically.

## Design principles

- No blind trust for freelance pay  
- No platform custody of user funds  
- Dollar-first UI (`$50.00 USDC`)  
- Auditable receipts (DB + Arcscan)  
- Clear Mode A vs Mode B rules in the Trust Center  

Start here: [Clients](./USER_GUIDE_CLIENTS.md) · [Workers](./USER_GUIDE_WORKERS.md) · [Agents](./USER_GUIDE_AGENTS.md) · [For officials](./FOR_OFFICIALS.md)
