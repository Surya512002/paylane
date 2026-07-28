#!/usr/bin/env bash
# Verify Paylane escrow proxy + implementation on Arc Testnet and Base Sepolia.
# Arc: Blockscout (no API key). Base: Etherscan/Basescan (needs ETHERSCAN_API_KEY).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/packages/contracts"

OWNER="${OWNER:-0x3799cafa388da047cAF7c999e31c844705FadfAe}"
ARC_USDC="${ARC_USDC:-0x3600000000000000000000000000000000000000}"
BASE_USDC="${BASE_USDC:-0x036CbD53842c5426634e7929541eC2318f3dCF7e}"

ARC_PROXY="${ARC_PROXY:-0x144762e02f9676593D955CF0d184323474C79805}"
ARC_IMPL="${ARC_IMPL:-0x97D7daD7c1F932e6C3F2bDdddAB607A3243eD7a5}"
BASE_PROXY="${BASE_PROXY:-0x7275FB5e77c18143F8f87d8B1485Ca840ADec1eB}"
BASE_IMPL="${BASE_IMPL:-0x144762e02f9676593D955CF0d184323474C79805}"

COMMON=(--compiler-version 0.8.24 --num-of-optimizations 200 --evm-version cancun --watch)

encode_proxy_args() {
  local impl="$1" usdc="$2"
  local init
  init=$(cast calldata "initialize(address,address,address,address)" "$usdc" "$OWNER" "$OWNER" "$OWNER")
  cast abi-encode "constructor(address,bytes)" "$impl" "$init"
}

echo "== Arc Testnet: implementation =="
forge verify-contract "$ARC_IMPL" src/PaylaneEscrowUpgradeable.sol:PaylaneEscrowUpgradeable \
  --chain 5042002 --verifier blockscout --verifier-url https://testnet.arcscan.app/api/ \
  "${COMMON[@]}"

echo "== Arc Testnet: proxy =="
forge verify-contract "$ARC_PROXY" lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
  --chain 5042002 --verifier blockscout --verifier-url https://testnet.arcscan.app/api/ \
  --constructor-args "$(encode_proxy_args "$ARC_IMPL" "$ARC_USDC")" \
  "${COMMON[@]}"

if [[ -z "${ETHERSCAN_API_KEY:-}" ]]; then
  echo "ETHERSCAN_API_KEY not set — verifying Base via Sourcify only"
  forge verify-contract "$BASE_IMPL" src/PaylaneEscrowUpgradeable.sol:PaylaneEscrowUpgradeable \
    --chain 84532 --verifier sourcify "${COMMON[@]}"
  forge verify-contract "$BASE_PROXY" lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
    --chain 84532 --verifier sourcify \
    --constructor-args "$(encode_proxy_args "$BASE_IMPL" "$BASE_USDC")" \
    "${COMMON[@]}"
else
  echo "== Base Sepolia: implementation =="
  forge verify-contract "$BASE_IMPL" src/PaylaneEscrowUpgradeable.sol:PaylaneEscrowUpgradeable \
    --chain base-sepolia --verifier etherscan --etherscan-api-key "$ETHERSCAN_API_KEY" \
    "${COMMON[@]}"
  echo "== Base Sepolia: proxy =="
  forge verify-contract "$BASE_PROXY" lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy \
    --chain base-sepolia --verifier etherscan --etherscan-api-key "$ETHERSCAN_API_KEY" \
    --constructor-args "$(encode_proxy_args "$BASE_IMPL" "$BASE_USDC")" \
    "${COMMON[@]}"
fi

echo "Done."
