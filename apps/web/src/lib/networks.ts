import { defineChain, type Chain } from "viem";

/** App ledger always uses 6 decimal minor units (micro-USDC). */
export const APP_USDC_DECIMALS = 6;

export type ChainKey = "arc-testnet" | "arc-mainnet" | "base-sepolia" | "base-mainnet";

export interface ChainPreset {
  key: ChainKey;
  chainId: number;
  name: string;
  shortName: string;
  family: "arc" | "base";
  rpcUrl: string;
  explorerUrl: string;
  explorerName: string;
  usdcAddress: `0x${string}`;
  /** On-chain USDC token decimals (Arc native USDC = 18, Base USDC = 6). */
  usdcDecimals: number;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  faucetUrl?: string;
  isTestnet: boolean;
  escrowAddress?: `0x${string}`;
}

const CHAIN_PRESETS: Record<ChainKey, ChainPreset> = {
  "arc-testnet": {
    key: "arc-testnet",
    chainId: 5042002,
    name: "Arc Testnet",
    shortName: "Arc Testnet",
    family: "arc",
    rpcUrl: "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    explorerName: "Arcscan",
    usdcAddress: "0x3600000000000000000000000000000000000000",
    usdcDecimals: 18,
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    faucetUrl: "https://faucet.circle.com",
    isTestnet: true,
    escrowAddress: "0x144762e02f9676593D955CF0d184323474C79805",
  },
  "arc-mainnet": {
    key: "arc-mainnet",
    chainId: Number(process.env.NEXT_PUBLIC_ARC_MAINNET_CHAIN_ID ?? 0) || 0,
    name: "Arc",
    shortName: "Arc",
    family: "arc",
    rpcUrl: process.env.NEXT_PUBLIC_ARC_MAINNET_RPC ?? "",
    explorerUrl: process.env.NEXT_PUBLIC_ARC_MAINNET_EXPLORER ?? "",
    explorerName: "Arcscan",
    usdcAddress: (process.env.NEXT_PUBLIC_ARC_MAINNET_USDC ??
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    usdcDecimals: 18,
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
    isTestnet: false,
  },
  "base-sepolia": {
    key: "base-sepolia",
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "Base Sepolia",
    family: "base",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    explorerName: "Basescan",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    usdcDecimals: 6,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    faucetUrl: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
    isTestnet: true,
    escrowAddress: "0x7275FB5e77c18143F8f87d8B1485Ca840ADec1eB",
  },
  "base-mainnet": {
    key: "base-mainnet",
    chainId: 8453,
    name: "Base",
    shortName: "Base",
    family: "base",
    rpcUrl: "https://mainnet.base.org",
    explorerUrl: "https://basescan.org",
    explorerName: "Basescan",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    usdcDecimals: 6,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    isTestnet: false,
  },
};

const CHAIN_ENV_SUFFIX: Record<ChainKey, string> = {
  "arc-testnet": "ARC_TESTNET",
  "arc-mainnet": "ARC_MAINNET",
  "base-sepolia": "BASE_SEPOLIA",
  "base-mainnet": "BASE_MAINNET",
};

function env(key: string): string | undefined {
  const v = process.env[key];
  return v?.trim() || undefined;
}

function resolveEscrowForKey(key: ChainKey): `0x${string}` | undefined {
  const suffix = CHAIN_ENV_SUFFIX[key];
  const specific = env(`NEXT_PUBLIC_ESCROW_ADDRESS_${suffix}`);
  if (specific) return specific as `0x${string}`;
  return undefined;
}

function applyEnvOverrides(base: ChainPreset, activeKey: ChainKey): ChainPreset {
  const suffix = CHAIN_ENV_SUFFIX[base.key];
  const isActive = base.key === activeKey;
  const chainId = Number(
    env(`NEXT_PUBLIC_CHAIN_ID_${suffix}`) ??
      (isActive ? env("NEXT_PUBLIC_CHAIN_ID") : undefined) ??
      base.chainId,
  );
  const rpcUrl =
    env(`NEXT_PUBLIC_RPC_${suffix}`) ??
    (isActive ? env("NEXT_PUBLIC_RPC") : undefined) ??
    (isActive && base.family === "arc" ? env("NEXT_PUBLIC_ARC_RPC") : undefined) ??
    base.rpcUrl;
  const explorerUrl =
    env(`NEXT_PUBLIC_EXPLORER_URL_${suffix}`) ??
    (isActive ? env("NEXT_PUBLIC_EXPLORER_URL") : undefined) ??
    base.explorerUrl;
  const usdcAddress = (env(`NEXT_PUBLIC_USDC_ADDRESS_${suffix}`) ??
    (isActive ? env("NEXT_PUBLIC_USDC_ADDRESS") : undefined) ??
    base.usdcAddress) as `0x${string}`;
  const name =
    env(`NEXT_PUBLIC_CHAIN_NAME_${suffix}`) ??
    (isActive ? env("NEXT_PUBLIC_CHAIN_NAME") : undefined) ??
    base.name;
  const escrowAddress =
    resolveEscrowForKey(base.key) ??
    (isActive ? (env("NEXT_PUBLIC_ESCROW_ADDRESS") as `0x${string}` | undefined) : undefined) ??
    base.escrowAddress;

  return {
    ...base,
    chainId: Number.isFinite(chainId) && chainId > 0 ? chainId : base.chainId,
    name,
    shortName: name,
    rpcUrl,
    explorerUrl,
    usdcAddress,
    escrowAddress,
  };
}

function inferActiveChainKey(): ChainKey {
  const explicit = env("NEXT_PUBLIC_ACTIVE_CHAIN")?.toLowerCase();
  if (explicit && explicit in CHAIN_PRESETS) return explicit as ChainKey;

  const chainId = Number(env("NEXT_PUBLIC_CHAIN_ID") ?? 0);
  if (chainId === 84532) return "base-sepolia";
  if (chainId === 8453) return "base-mainnet";
  if (chainId === 5042002) return "arc-testnet";

  const legacyNetwork = env("NEXT_PUBLIC_NETWORK")?.toLowerCase();
  if (legacyNetwork === "mainnet") {
    if (chainId === 8453) return "base-mainnet";
    return "arc-mainnet";
  }
  if (legacyNetwork === "base-sepolia") return "base-sepolia";
  if (legacyNetwork === "base-mainnet") return "base-mainnet";

  return "arc-testnet";
}

function parseSupportedChainKeys(active: ChainKey): ChainKey[] {
  const raw = env("NEXT_PUBLIC_SUPPORTED_CHAINS");
  if (!raw) {
    // Default: both testnets when active is a testnet
    if (active === "arc-testnet" || active === "base-sepolia") {
      return ["arc-testnet", "base-sepolia"];
    }
    return [active];
  }
  const keys = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((k): k is ChainKey => k in CHAIN_PRESETS);
  return keys.length ? keys : [active];
}

export function resolveActiveChain(): ChainPreset {
  const key = inferActiveChainKey();
  return applyEnvOverrides(CHAIN_PRESETS[key], key);
}

export function resolveSupportedChains(): ChainPreset[] {
  const activeKey = inferActiveChainKey();
  const keys = parseSupportedChainKeys(activeKey);
  const unique = [...new Set(keys.includes(activeKey) ? keys : [activeKey, ...keys])];
  return unique.map((k) => applyEnvOverrides(CHAIN_PRESETS[k], activeKey));
}

export function getChainById(chainId: number, chains = resolveSupportedChains()): ChainPreset | undefined {
  return chains.find((c) => c.chainId === chainId);
}

export function chainPresetToViem(preset: ChainPreset): Chain {
  return defineChain({
    id: preset.chainId,
    name: preset.name,
    nativeCurrency: preset.nativeCurrency,
    rpcUrls: { default: { http: [preset.rpcUrl] } },
    blockExplorers: {
      default: { name: preset.explorerName, url: preset.explorerUrl },
    },
    testnet: preset.isTestnet,
  });
}

/** Convert app minor units (6 dp) to on-chain token amount for approve / escrow calls. */
export function minorToChainUnits(minor: bigint, chainUsdcDecimals: number): bigint {
  if (chainUsdcDecimals === APP_USDC_DECIMALS) return minor;
  const diff = chainUsdcDecimals - APP_USDC_DECIMALS;
  if (diff > 0) return minor * 10n ** BigInt(diff);
  return minor / 10n ** BigInt(-diff);
}

/** Convert on-chain token amount back to app minor units. */
export function chainUnitsToMinor(units: bigint, chainUsdcDecimals: number): bigint {
  if (chainUsdcDecimals === APP_USDC_DECIMALS) return units;
  const diff = chainUsdcDecimals - APP_USDC_DECIMALS;
  if (diff > 0) return units / 10n ** BigInt(diff);
  return units * 10n ** BigInt(-diff);
}

export function explorerTxUrl(explorerUrl: string, txHash: string) {
  return `${explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

export function explorerAddressUrl(explorerUrl: string, address: string) {
  return `${explorerUrl.replace(/\/$/, "")}/address/${address}`;
}

/** @deprecated use resolveActiveChain */
export type NetworkId = ChainKey;
/** @deprecated use ChainPreset */
export type NetworkPreset = ChainPreset;
/** @deprecated use resolveActiveChain */
export const resolveNetwork = resolveActiveChain;
export const ARC_TESTNET = CHAIN_PRESETS["arc-testnet"];
export const ARC_MAINNET = CHAIN_PRESETS["arc-mainnet"];
