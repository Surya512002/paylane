# Arc Testnet guide (Paylane)

**Last updated:** 2026-07-28  
**Network:** Arc Testnet · Chain ID `5042002`

This is the practical guide to run Paylane against **real Arc testnet** USDC — not the local demo simulator.

---

## What “live on testnet” means

| Layer | Demo mode | Live mode |
|-------|-----------|-----------|
| Escrow fund/accept | Fake tx hashes in Postgres | Wallet txs to `PaylaneEscrow` UUPS proxy |
| USDC | Not moved | Real Arc testnet USDC (ERC-20 view) |
| x402 API pay | HMAC demo proofs | Same demo proofs until Gateway keys are set |
| Config | `DEMO_MODE=true` | `DEMO_MODE=false` + escrow address |

---

## 1. Prerequisites

1. Wallet with Arc Testnet USDC — [Circle faucet](https://faucet.circle.com)
2. Foundry (`forge`) installed
3. Postgres running (`./scripts/pg-start.sh` or Docker)
4. Node 20+

Add Arc to your wallet:

| Field | Value |
|-------|--------|
| Chain ID | `5042002` (`0x4cef52`) |
| RPC | `https://rpc.testnet.arc.network` |
| Symbol | USDC |
| Explorer | https://testnet.arcscan.app |
| Native decimals (wallet) | **18** (gas layer) |

USDC ERC-20 address: `0x3600000000000000000000000000000000000000`

---

## 2. Deploy escrow (UUPS upgradeable)

```bash
cd workpay
export PRIVATE_KEY=0xYOUR_FUNDED_KEY
./scripts/deploy-arc-testnet.sh
```

This deploys `PaylaneEscrowUpgradeable` behind an ERC1967 proxy and writes:

`packages/contracts/deployments/arc-testnet.json`

Copy the proxy address into `apps/web/.env`:

```bash
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_ARC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_ESCROW_ADDRESS=0xYourProxyAddress
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app
DEMO_MODE=false
```

Restart `npm run dev`. Open **Settings** — you should see “LIVE (on-chain)” and the proxy address.

### Upgrades later

Owner can deploy a new implementation and call `upgradeToAndCall` on the proxy. Job balances stay in the proxy storage — no migration of funds.

```bash
forge script script/DeployUpgradeable.s.sol --rpc-url $ARC_RPC --broadcast
# then upgrade via cast / owner wallet
```

---

## 3. Live freelance flow (Mode A)

1. Connect wallet on Arc Testnet → **Sign in** (SIWE)
2. **Post a job** with checklist → Publish
3. **Approve USDC & fund escrow** — wallet prompts for approve + createJob + fundJob
4. Assign worker → worker starts → delivers (marks on-chain if live)
5. Client **Accept & release on-chain** (or wait for auto-release / dispute)

Receipts show Arcscan links when txs are real.

---

## 4. Mode B (API / Agents)

Still uses the x402 challenge on `/api/demo/paid-weather`. In DEMO_MODE, payments are HMAC proofs. For production Gateway nanopayments, set Circle facilitator credentials (see seller guide) — escrow upgrade does not replace Mode B.

---

## 5. Mainnet later

```bash
NEXT_PUBLIC_NETWORK=mainnet
NEXT_PUBLIC_CHAIN_ID=<arc-mainnet-id>
NEXT_PUBLIC_ARC_RPC=<rpc>
NEXT_PUBLIC_USDC_ADDRESS=<usdc>
NEXT_PUBLIC_ESCROW_ADDRESS=<new-or-same-proxy-deploy>
NEXT_PUBLIC_EXPLORER_URL=<explorer>
DEMO_MODE=false
```

Redeploy (or reuse an upgradeable proxy carefully) with mainnet USDC. Checklist: `/docs/mainnet-checklist`.

---

## 6. Troubleshooting

| Symptom | Fix |
|---------|-----|
| Fund button still “demo” | `DEMO_MODE=false` and escrow address set, restart |
| Approve fails | Wrong network / no USDC — use faucet |
| `Fund verification failed` | Tx must hit escrow and emit `JobFunded` |
| Gas looks insane | Wallet native decimals must be **18**, not 6 |
| Wrong wallet acting | SIWE session must match connected address |

Settings page: `/settings`
