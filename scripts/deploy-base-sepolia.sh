#!/usr/bin/env bash
# Deploy PaylaneEscrowUpgradeable (UUPS proxy) to Base Sepolia.
# Usage:
#   export PRIVATE_KEY=0x...
#   ./scripts/deploy-base-sepolia.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/packages/contracts"

RPC="${BASE_SEPOLIA_RPC:-https://sepolia.base.org}"
USDC="${USDC_ADDRESS:-0x036CbD53842c5426634e7929541eC2318f3dCF7e}"
CHAIN_ID=84532

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Set PRIVATE_KEY to a funded Base Sepolia wallet"
  echo "Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet"
  exit 1
fi

echo "Deploying PaylaneEscrowUpgradeable proxy to Base Sepolia via $RPC …"
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
cat > deployments/base-sepolia.json <<EOF
{
  "network": "base-sepolia",
  "chainId": ${CHAIN_ID},
  "usdc": "$USDC",
  "escrowProxy": "$PROXY",
  "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "upgradeable": true
}
EOF

echo ""
echo "Wrote packages/contracts/deployments/base-sepolia.json"
echo "Add to apps/web/.env:"
echo "  NEXT_PUBLIC_ESCROW_ADDRESS_BASE_SEPOLIA=$PROXY"
echo "  NEXT_PUBLIC_SUPPORTED_CHAINS=arc-testnet,base-sepolia"
