# Paylane — Product Overview

**Version:** 1.2.0 · **Last updated:** 2026-07-28

## What is Paylane?

Paylane is a **USDC work + payments app on Circle’s Arc**:

1. **Mode A — Hire / Work** — Non-custodial escrow (`PaylaneEscrowUpgradeable` UUPS proxy). Fund before work, then accept / revise / dispute / auto-release.
2. **Mode B — API / Agents** — Instant x402 pay-per-call. Not escrow.

## Current network

Default: **Arc Testnet** (`5042002`). Switch to mainnet with env only — see [Arc Testnet guide](./ARC_TESTNET_GUIDE.md) and [Mainnet checklist](./MAINNET_CHECKLIST.md).

## Design principles

- No blind trust for freelance pay  
- No platform custody of user funds  
- Dollar-first UI (`$50.00 USDC`)  
- Auditable receipts (DB + Arcscan when live)  
- Clear Mode A vs Mode B rules in the Trust Center  

Start here: [Clients](./USER_GUIDE_CLIENTS.md) · [Workers](./USER_GUIDE_WORKERS.md) · [Agents](./USER_GUIDE_AGENTS.md) · [For officials](./FOR_OFFICIALS.md)
