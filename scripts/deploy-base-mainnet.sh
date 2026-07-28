#!/usr/bin/env bash
# Deploy PaylaneEscrowUpgradeable (UUPS proxy) to Base mainnet.
# Usage:
#   export PRIVATE_KEY=0x...
#   ./scripts/deploy-base-mainnet.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/packages/contracts"

RPC="${BASE_RPC:-https://mainnet.base.org}"
USDC="${USDC_ADDRESS:-0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913}"
CHAIN_ID=8453

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Set PRIVATE_KEY to a funded Base mainnet deployer wallet"
  exit 1
fi

echo "Deploying PaylaneEscrowUpgradeable proxy to Base mainnet via $RPC …"
OUT=$(forge script script/DeployUpgradeable.s.sol:DeployUpgradeable \
  --rpc-url "$RPC" \
  --private-key "$PRIVATE_KEY" \
  --broadcast \
  -vvvv 2>&1)
echo "$OUT"

PROXY=$(echo "$OUT" | sed -n 's/.*PaylaneEscrow proxy[[:space:]]*//p' | head -1 | tr -d '\r')
if [[ -z "$PROXY" ]]; then
  BROADCAST=$(ls -t broadcast/DeployUpgradeable.s.sol/${CHAIN_ID}/run-latest.json 2>/dev/null | head -1 || true)
  if [[ -n "${BROADCAST:-}" ]]; then
    PROXY=$(node -e "const j=require('./$BROADCAST'); const t=j.transactions||[]; const p=t.find(x=>x.contractName==='ERC1967Proxy'); console.log(p?.contractAddress||'')")
  fi
fi

mkdir -p deployments
cat > deployments/base-mainnet.json <<EOF
{
  "network": "base-mainnet",
  "chainId": ${CHAIN_ID},
  "usdc": "$USDC",
  "escrowProxy": "$PROXY",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "upgradeable": true
}
EOF

echo ""
echo "Wrote packages/contracts/deployments/base-mainnet.json"
echo "Add to apps/web/.env:"
echo "  NEXT_PUBLIC_ACTIVE_CHAIN=base-mainnet"
echo "  NEXT_PUBLIC_ESCROW_ADDRESS_BASE_MAINNET=$PROXY"
echo "  DEMO_MODE=false"
