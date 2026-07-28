# Vercel environment variables — Paylane (full list)

**Where:** Vercel → Project `paylane` → Settings → Environment Variables  
**Apply to:** Production, Preview, and Development (all three)

**Root directory:** `apps/web`  
**Live URL:** https://paylane-nu.vercel.app

---

## 1. Database (from Neon — keep if already connected)

Do **not** delete these if the Neon integration created them:

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Pooled Postgres URL (Neon) |
| `DATABASE_URL_UNPOOLED` | Optional — Neon |
| `POSTGRES_PRISMA_URL` | Optional — used by Prisma on Vercel |
| `POSTGRES_URL` | Optional — Neon |
| `POSTGRES_URL_NON_POOLING` | Optional — Neon |
| `POSTGRES_USER` | Optional — Neon |
| `POSTGRES_PASSWORD` | Optional — Neon |
| `POSTGRES_HOST` | Optional — Neon |
| `POSTGRES_DATABASE` | Optional — Neon |
| `NEON_PROJECT_ID` | Optional — Neon |

If Neon is connected, you only need to **add/update** the variables in sections 2–4 below.

---

## 2. Server secrets (required)

Generate fresh values for production (do not copy local dev secrets):

```bash
openssl rand -hex 32   # SESSION_SECRET
openssl rand -hex 24   # CRON_SECRET
```

| Variable | Value |
|----------|-------|
| `SESSION_SECRET` | `<output of openssl rand -hex 32>` |
| `CRON_SECRET` | `<output of openssl rand -hex 24>` |
| `ADMIN_WALLETS` | `0x3799cafa388da047caf7c999e31c844705fadfae` |

---

## 3. App mode

| Variable | Value |
|----------|-------|
| `DEMO_MODE` | `false` |

---

## 4. Multi-chain — public (copy all)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_ACTIVE_CHAIN` | `arc-testnet` |
| `NEXT_PUBLIC_SUPPORTED_CHAINS` | `arc-testnet,base-sepolia` |
| `NEXT_PUBLIC_NETWORK` | `testnet` |
| `NEXT_PUBLIC_CHAIN_NAME` | `Arc Testnet` |
| `NEXT_PUBLIC_CHAIN_ID` | `5042002` |
| `NEXT_PUBLIC_RPC` | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_ARC_RPC` | `https://rpc.testnet.arc.network` |
| `NEXT_PUBLIC_USDC_ADDRESS` | `0x3600000000000000000000000000000000000000` |
| `NEXT_PUBLIC_EXPLORER_URL` | `https://testnet.arcscan.app` |
| `NEXT_PUBLIC_ESCROW_ADDRESS` | `0x144762e02f9676593D955CF0d184323474C79805` |
| `NEXT_PUBLIC_ESCROW_ADDRESS_ARC_TESTNET` | `0x144762e02f9676593D955CF0d184323474C79805` |
| `NEXT_PUBLIC_RPC_BASE_SEPOLIA` | `https://sepolia.base.org` |
| `NEXT_PUBLIC_USDC_ADDRESS_BASE_SEPOLIA` | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| `NEXT_PUBLIC_EXPLORER_URL_BASE_SEPOLIA` | `https://sepolia.basescan.org` |
| `NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA` | `0x7275FB5e77c18143F8f87d8B1485Ca840ADec1eB` |

---

## 5. Money rules (optional — defaults match app)

| Variable | Value |
|----------|-------|
| `PLATFORM_FEE_BPS` | `200` |
| `REVIEW_WINDOW_HOURS` | `72` |
| `REVISION_LIMIT` | `2` |
| `DISPUTE_EVIDENCE_HOURS` | `72` |
| `API_CREDIT_ON_SELLER_5XX` | `true` |

---

## Full copy-paste block (non-Neon vars)

```env
SESSION_SECRET=PASTE_OPENSSL_RAND_HEX_32_HERE
CRON_SECRET=PASTE_OPENSSL_RAND_HEX_24_HERE
ADMIN_WALLETS=0x3799cafa388da047caf7c999e31c844705fadfae
DEMO_MODE=false

NEXT_PUBLIC_ACTIVE_CHAIN=arc-testnet
NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet,base-sepolia
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_CHAIN_NAME=Arc Testnet
NEXT_PUBLIC_CHAIN_ID=5042002
NEXT_PUBLIC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_ARC_RPC=https://rpc.testnet.arc.network
NEXT_PUBLIC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
NEXT_PUBLIC_EXPLORER_URL=https://testnet.arcscan.app
NEXT_PUBLIC_ESCROW_ADDRESS=0x144762e02f9676593D955CF0d184323474C79805
NEXT_PUBLIC_ESCROW_ADDRESS_ARC_TESTNET=0x144762e02f9676593D955CF0d184323474C79805
NEXT_PUBLIC_RPC_BASE_SEPOLIA=https://sepolia.base.org
NEXT_PUBLIC_USDC_ADDRESS_BASE_SEPOLIA=0x036CbD53842c5426634e7929541eC2318f3dCF7e
NEXT_PUBLIC_EXPLORER_URL_BASE_SEPOLIA=https://sepolia.basescan.org
NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA=0x7275FB5e77c18143F8f87d8B1485Ca840ADec1eB

PLATFORM_FEE_BPS=200
REVIEW_WINDOW_HOURS=72
REVISION_LIMIT=2
DISPUTE_EVIDENCE_HOURS=72
API_CREDIT_ON_SELLER_5XX=true
```

---

## Escrow addresses (reference)

| Chain | Proxy |
|-------|--------|
| Arc Testnet | `0x144762e02f9676593D955CF0d184323474C79805` |
| Base Sepolia | `0x7275FB5e77c18143F8f87d8B1485Ca840ADec1eB` |

These are **different** — one deployment per chain.

---

## After saving

1. **Deployments → Redeploy** (or push to `master`).
2. Open https://paylane-nu.vercel.app/settings — both chains should show **Live escrow**.
3. Use the header network dropdown to switch Arc ↔ Base Sepolia.
