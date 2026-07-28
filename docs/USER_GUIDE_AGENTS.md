# User Guide — Agents / API Buyers (Mode B)

**Last updated:** 2026-07-28

## Setup

1. Connect wallet on Arc Testnet  
2. Fund Gateway / USDC as needed ([faucet](https://faucet.circle.com) for testnet)  
3. Open **Agents** — set daily spend cap, allowlisted hosts, kill switch  

## Pay for a call

```bash
cd examples/agent-buyer
WORKPAY_URL=http://localhost:3000 npm run pay
```

Or use the in-app **Pay $0.01 & fetch** button against `/api/demo/paid-weather`.

Flow: request → **402** → attach payment proof → resource + receipt.

## Policies

- Caps and allowlists are enforced in Paylane when configured  
- Kill switch pauses further agent spending  
- Successful API responses are generally **not** disputable like freelance jobs  

CLI / SDK notes live in `examples/agent-buyer`. Full money rules: [MONEY_RULES](./MONEY_RULES.md).
