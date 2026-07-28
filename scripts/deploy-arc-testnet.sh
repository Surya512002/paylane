#!/usr/bin/env bash
# Deploy PaylaneEscrowUpgradeable (UUPS proxy) to Arc Testnet.
# Usage:
#   export PRIVATE_KEY=0x...
#   ./scripts/deploy-arc-testnet.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/packages/contracts"

RPC="${ARC_RPC:-https://rpc.testnet.arc.network}"
USDC="${USDC_ADDRESS:-0x3600000000000000000000000000000000000000}"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Set PRIVATE_KEY to a funded Arc testnet wallet (faucet: https://faucet.circle.com)"
  exit 1
fi

echo "Deploying PaylaneEscrowUpgradeable proxy to Arc via $RPC …"
OUT=$(forge script script/DeployUpgradeable.s.sol:DeployUpgradeable \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  -vvvv 2>&1)
echo "$OUT"

PROXY=$(echo "$OUT" | sed -n 's/.*PaylaneEscrow proxy[[:space:]]*//p' | head -1 | tr -d '\r')
if [[ -z "$PROXY" ]]; then
  # Fallback: parse broadcast JSON
  BROADCAST=$(ls -t broadcast/DeployUpgradeable.s.sol/*/run-latest.json 2>/dev/null | head -1 || true)
  if [[ -n "${BROADCAST:-}" ]]; then
    PROXY=$(node -e "const j=require('./$BROADCAST'); const t=j.transactions||[]; const p=t.find(x=>x.contractName==='ERC1967Proxy'); console.log(p?.contractAddress||'')")
  fi
fi

mkdir -p deployments
cat > deployments/arc-testnet.json <<EOF
{
  "network": "arc-testnet",
  "chainId": 5042002,
  "usdc": "$USDC",
  "escrowProxy": "$PROXY",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "upgradeable": true
}
EOF

echo ""
echo "Wrote packages/contracts/deployments/arc-testnet.json"
echo "Add to apps/web/.env:"
echo "  NEXT_PUBLIC_ESCROW_ADDRESS=$PROXY"
echo "  DEMO_MODE=false"
echo "  NEXT_PUBLIC_NETWORK=testnet"
