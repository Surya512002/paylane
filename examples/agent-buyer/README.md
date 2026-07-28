# WorkPay Agent Buyer Example (Mode B)

Pays a WorkPay x402-protected endpoint using the demo HMAC payment proof (DEMO_MODE)
or documents the Gateway / `@circle-fin/x402-batching` path for Arc testnet.

## Quick start (demo)

```bash
# Terminal 1: run the web app
cd ../../apps/web && npm run dev

# Terminal 2: run this buyer
cd ../../examples/agent-buyer
npm install
WORKPAY_URL=http://localhost:3000 npm run pay
```

## Flow

1. `GET /api/demo/paid-weather` → HTTP 402 + payment requirements
2. Sign / build payment proof
3. Retry with `X-PAYMENT` header
4. Receive resource + receipt in WorkPay ledger

## Spend policies

Use the in-app **Agents** page to set daily caps, host allowlists, and kill switch.
