# User Guide — API Sellers (Mode B)

**Last updated:** 2026-07-28

Mode B is **instant access-for-payment**. It is **not** freelance escrow.

## Create a paid resource

1. Sign in → **API / Agents** → **Sell API**  
2. Name, path (e.g. `/api/v1/insight`), description, price per call  
3. Enable when ready  

Unpaid calls to protected resources should return **HTTP 402** with x402 payment requirements. Verify payment **before** returning data.

## Settlement today vs next

| Today (testnet MVP) | Next |
|---------------------|------|
| Demo HMAC proofs when `DEMO_MODE=true` | Circle Gateway nanopayments + `@circle-fin/x402-batching` |
| Usage + receipts in Paylane DB | Same + facilitator settlement refs |

## Policies

- Successful responses are generally **non-refundable**  
- If your server returns **5xx after a valid payment**, Paylane issues a **credit** (default on)  
- Disable an endpoint to reject new paid calls safely  

Guide for agents: [User guide — Agents](./USER_GUIDE_AGENTS.md)
