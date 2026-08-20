# Arc Testnet guide (Paylane)

**Last updated:** 2026-08-20  
**Network:** Arc Testnet · Chain ID `5042002`

Paylane runs **live on Arc Testnet** — real USDC, real `PaylaneEscrow` transactions, Arcscan receipts.

---

## Deployed contracts (reference)

| Contract | Address |
|----------|---------|
| **Escrow proxy** (UUPS) | [`0x144762e02f9676593D955CF0d184323474C79805`](https://testnet.arcscan.app/address/0x144762e02f9676593D955CF0d184323474C79805) |
| Implementation | `0x97D7daD7c1F932e6C3F2bDdddAB607A3243eD7a5` |
| USDC (ERC-20 interface) | `0x3600000000000000000000000000000000000000` |
| Platform fee (on-chain) | **10 bps = 0.1%** |
| Owner / fee recipient | `0x3799cafa388da047cAF7c999e31c844705FadfAe` |

Deployment manifest: `packages/contracts/deployments/arc-testnet.json`

---

## Prerequisites

1. Wallet with Arc Testnet USDC — [Circle faucet](https://faucet.circle.com)
2. MetaMask on **Arc Testnet** (chain ID `5042002`)
3. Postgres (`./scripts/pg-start.sh` or Docker)
4. Node 20+

### Add Arc to MetaMask

| Field | Value |
|-------|--------|
| Chain ID | `5042002` (`0x4cef52`) |
| RPC | `https://rpc.testnet.arc.network` |
| Symbol | USDC |
| Explorer | https://testnet.arcscan.app |
| Native decimals (gas display) | **18** |

---

## App configuration

`apps/web/.env` (defaults in `.env.example`):

```bash
NEXT_PUBLIC_ACTIVE_CHAIN=arc-testnet
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_ESCROW_ADDRESS=0x144762e02f9676593D955CF0d184323474C79805
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app
DEMO_MODE=false
PLATFORM_FEE_BPS=10
```

Restart `npm run dev`. **Settings** should show **LIVE (on-chain)** and the proxy address.

> `DEMO_MODE` is forced off when an escrow address is configured, even if set to `true`.

---

## Arc USDC decimals

Arc has **one USDC balance** with two decimal views:

| View | Decimals | Used for |
|------|----------|----------|
| Native / gas | 18 | Wallet gas, `eth_getBalance` |
| ERC-20 at `0x3600…` | **6** | `approve`, `balanceOf`, escrow transfers |

Paylane escrow uses the **ERC-20 interface (6 decimals)**. The app reads `decimals()` on-chain before comparing balances. Internal ledger amounts use 6-decimal minor units everywhere.

**Common mistake:** treating ERC-20 `balanceOf` as 18 decimals makes a real balance look like dust (e.g. 19.93 USDC showing as `0.00000000001993519`).

---

## Live freelance flow (Mode A)

1. Connect wallet on Arc Testnet → **Sign in** (SIWE)
2. **Post a job** with checklist → **Publish**
3. **Approve USDC & fund escrow** — wallet transactions:
   - `approve` USDC for escrow (skipped if allowance already covers the amount)
   - `createJob` on escrow proxy
   - `fundJob` — USDC moves into escrow
4. **Assign worker** — client calls `assignWorker` on-chain
5. Worker **submits delivery** — `markDelivered` on-chain + DB note/artifact
6. Client **Accept & release** — worker receives USDC minus **0.1%** platform fee

Receipts link to Arcscan when txs are real.

---

## Redeploy / upgrade escrow

```bash
export PRIVATE_KEY=0xYOUR_FUNDED_KEY
./scripts/deploy-arc-testnet.sh
```

Updates `packages/contracts/deployments/arc-testnet.json`. For existing proxies, owner can `upgradeToAndCall` — balances stay in the proxy.

Change on-chain fee (owner only):

```bash
cast send 0x144762e02f9676593D955CF0d184323474C79805 \
  "setPlatformFeeBps(uint16)" 10 \
  --rpc-url https://rpc.testnet.arc.network --private-key $PRIVATE_KEY
```

---

## Mode B (API / Agents)

`/api/demo/paid-weather` uses x402 challenges. Escrow upgrades do not affect Mode B. Production Gateway credentials are separate — see [USER_GUIDE_API_SELLERS.md](./USER_GUIDE_API_SELLERS.md).

---

## Mainnet later

Update env only — see [MAINNET_CHECKLIST.md](./MAINNET_CHECKLIST.md):

```bash
NEXT_PUBLIC_ACTIVE_CHAIN=arc-mainnet
NEXT_PUBLIC_ARC_MAINNET_CHAIN_ID=<id>
NEXT_PUBLIC_ARC_MAINNET_RPC=<rpc>
NEXT_PUBLIC_ARC_MAINNET_USDC=<usdc>
NEXT_PUBLIC_ESCROW_ADDRESS=<proxy>
DEMO_MODE=false
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Insufficient USDC” but wallet shows balance | Confirm Arc Testnet; app uses ERC-20 6-decimal `balanceOf` |
| Fund button does nothing | Connect wallet + Sign in; check Settings → LIVE |
| `Fund verification failed` | Tx must hit escrow proxy and emit `JobFunded` |
| Wrong network banner | Switch MetaMask to Arc Testnet (`5042002`) |
| Internal server error on post job | Check Postgres is running; see field validation message |
| Gas looks wrong in wallet | Native USDC gas uses 18 decimals — normal on Arc |

Settings: `/settings` · Docs: `/docs/arc-testnet-guide`
