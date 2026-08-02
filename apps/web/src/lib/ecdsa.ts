/**
 * Normalize ECDSA signatures to EIP-2 canonical (low-s) form.
 * Some wallets/providers return high-s signatures that ethers v6 rejects
 * with: "non-canonical s; use ._s".
 */

const SECP256K1_N = BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141");
const SECP256K1_HALF_N = SECP256K1_N / 2n;

function pad64(hexNoPrefix: string): string {
  return hexNoPrefix.replace(/^0x/, "").padStart(64, "0");
}

/**
 * Returns a 65-byte hex signature with canonical s (and adjusted v/yParity).
 * Non-hex / non-65-byte inputs are returned unchanged.
 */
export function toCanonicalEcdsaSignature(signature: string): string {
  const hex = signature.startsWith("0x") ? signature : `0x${signature}`;
  if (!/^0x[0-9a-fA-F]{130}$/.test(hex)) return signature;

  const r = hex.slice(2, 66);
  let s = BigInt(`0x${hex.slice(66, 130)}`);
  let v = Number.parseInt(hex.slice(130, 132), 16);

  if (s <= SECP256K1_HALF_N) {
    return `0x${r}${pad64(hex.slice(66, 130))}${hex.slice(130, 132).toLowerCase()}`.toLowerCase();
  }

  s = SECP256K1_N - s;
  if (v === 27 || v === 28) {
    v = 55 - v;
  } else if (v === 0 || v === 1) {
    v = 1 - v;
  } else {
    v ^= 1;
  }

  return `0x${r}${pad64(s.toString(16))}${v.toString(16).padStart(2, "0")}`.toLowerCase();
}
