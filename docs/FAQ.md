# FAQ

**Version:** 1.1.0 · **Last updated:** 2026-08-20

**Does Paylane custody my USDC?**  
No. Mode A uses smart-contract escrow; Mode B uses Gateway balances. No platform omnibus hot wallet.

**Is API pay the same as freelance escrow?**  
No. API pay is instant and generally non-refundable after a successful response.

**What if the client never accepts?**  
After the review window (default 72h), auto-release pays the worker minus the platform fee.

**What network does Paylane use?**  
**Arc Testnet** (`5042002`) by default, with live escrow at `0x144762e02f9676593D955CF0d184323474C79805`. Arc mainnet via env when ready.

**What is the platform fee?**  
**0.1%** (10 bps) on release to worker; **none** on full client refund. On-chain fee matches app via `setPlatformFeeBps(10)`.

**Why does my USDC balance look wrong when funding?**  
On Arc, native gas USDC uses 18 decimals but the ERC-20 interface (used by escrow) uses 6. Paylane reads ERC-20 `balanceOf` — make sure you are on Arc Testnet and have faucet USDC.

**Is this a demo app?**  
No — with `DEMO_MODE=false` and the escrow address set (default), all Mode A funding is real on-chain. Mode B x402 still uses HMAC demo proofs until Gateway keys are configured.

**How many wallet transactions to fund a job?**  
Up to three: `approve` (skipped if allowance exists), `createJob`, `fundJob`. Usually two signatures if you already approved USDC.
