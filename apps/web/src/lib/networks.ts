/**
 * Arc network presets — switch testnet ↔ mainnet via env only.
 * Set NEXT_PUBLIC_NETWORK=mainnet (or override individual NEXT_PUBLIC_* vars).
 */
export type NetworkId = "testnet" | "mainnet";

export interface NetworkPreset {
  id: NetworkId;
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  usdcAddress: `0x${string}`;
  nativeDecimals: number;
  faucetUrl?: string;
  escrowAddress?: `0x${string}`;
}

export const ARC_TESTNET: NetworkPreset = {
  id: "testnet",
  chainId: 5042002,
  name: "Arc Testnet",
  shortName: "Arc Testnet",
  rpcUrl: "https://rpc.testnet.arc.network",
  explorerUrl: "https://testnet.arcscan.app",
  usdcAddress: "0x3600000000000000000000000000000000000000",
  nativeDecimals: 18,
  faucetUrl: "https://faucet.circle.com",
};

/**
 * Arc Mainnet placeholders — fill when Circle publishes mainnet params.
 * Any field can be overridden with NEXT_PUBLIC_* without code changes.
 */
export const ARC_MAINNET: NetworkPreset = {
  id: "mainnet",
  chainId: Number(process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID ?? 0) || 0,
  name: "Arc",
  shortName: "Arc Mainnet",
  rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC ?? "",
  explorerUrl: process.env.NEXT_PUBLIC_MAINNET_EXPLORER ?? "",
  usdcAddress: (process.env.NEXT_PUBLIC_MAINNET_USDC ??
    "0x0000000000000000000000000000000000000000") as `0x${string}`,
  nativeDecimals: 18,
};

export function resolveNetwork(): NetworkPreset {
  const mode = (process.env.NEXT_PUBLIC_NETWORK ?? "testnet").toLowerCase();
  const base = mode === "mainnet" ? ARC_MAINNET : ARC_TESTNET;

  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? base.chainId) || base.chainId;
  const rpcUrl = process.env.NEXT_PUBLIC_ARC_RPC ?? base.rpcUrl;
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL ?? base.explorerUrl;
  const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
    base.usdcAddress) as `0x${string}`;
  const escrowRaw = process.env.NEXT_PUBLIC_ESCROW_ADDRESS || base.escrowAddress;
  const name = process.env.NEXT_PUBLIC_CHAIN_NAME ?? base.name;

  return {
    ...base,
    id: mode === "mainnet" ? "mainnet" : "testnet",
    chainId,
    name,
    shortName: name,
    rpcUrl,
    explorerUrl,
    usdcAddress,
    escrowAddress: escrowRaw ? (escrowRaw as `0x${string}`) : undefined,
  };
}

export function explorerTxUrl(explorerUrl: string, txHash: string) {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export function explorerAddressUrl(explorerUrl: string, address: string) {
  return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
}
