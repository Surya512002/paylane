import { DEFAULTS } from "@workpay/shared";
import { resolveActiveChain, resolveSupportedChains, type ChainPreset } from "./networks";

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (!v) return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

const activeChain = resolveActiveChain();
const supportedChains = resolveSupportedChains();
const isProd = process.env.NODE_ENV === "production";

/** DEMO_MODE defaults false in production builds; true locally for faster onboarding. */
const demoMode = envBool("DEMO_MODE", !isProd);

export const config = {
  appName: "Paylane",
  databaseUrl: process.env.DATABASE_URL ?? "",
  activeChain,
  supportedChains,
  /** @deprecated use activeChain */
  network: activeChain,
  networkId: activeChain.key,
  chainId: activeChain.chainId,
  chainName: activeChain.name,
  chainRpc: activeChain.rpcUrl,
  /** @deprecated use chainRpc */
  arcRpc: activeChain.rpcUrl,
  usdcAddress: activeChain.usdcAddress,
  usdcDecimals: activeChain.usdcDecimals,
  escrowAddress: activeChain.escrowAddress,
  explorerUrl: activeChain.explorerUrl,
  explorerName: activeChain.explorerName,
  faucetUrl: activeChain.faucetUrl,
  platformFeeBps: envInt("PLATFORM_FEE_BPS", DEFAULTS.platformFeeBps),
  reviewWindowHours: envInt("REVIEW_WINDOW_HOURS", DEFAULTS.reviewWindowHours),
  revisionLimit: envInt("REVISION_LIMIT", DEFAULTS.revisionLimit),
  disputeEvidenceHours: envInt("DISPUTE_EVIDENCE_HOURS", DEFAULTS.disputeEvidenceHours),
  apiCreditOnSeller5xx: envBool("API_CREDIT_ON_SELLER_5XX", DEFAULTS.apiCreditOnSeller5xx),
  sessionSecret: process.env.SESSION_SECRET ?? "dev-secret-change-me-min-32-chars-long!!",
  adminWallets: (process.env.ADMIN_WALLETS ?? "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean),
  demoMode,
  cronSecret: process.env.CRON_SECRET ?? "",
} as const;

if (!demoMode && !config.escrowAddress) {
  console.warn("[Paylane] DEMO_MODE=false but escrow is unset for the active chain");
}

function publicChain(preset: ChainPreset) {
  return {
    key: preset.key,
    chainId: preset.chainId,
    name: preset.name,
    family: preset.family,
    usdcAddress: preset.usdcAddress,
    usdcDecimals: preset.usdcDecimals,
    escrowAddress: preset.escrowAddress ?? null,
    explorerUrl: preset.explorerUrl,
    explorerName: preset.explorerName,
    faucetUrl: preset.faucetUrl ?? null,
    isTestnet: preset.isTestnet,
    live: !demoMode && Boolean(preset.escrowAddress),
  };
}

export function publicConfig() {
  return {
    appName: config.appName,
    platformFeeBps: config.platformFeeBps,
    reviewWindowHours: config.reviewWindowHours,
    revisionLimit: config.revisionLimit,
    disputeEvidenceHours: config.disputeEvidenceHours,
    chainId: config.chainId,
    chainName: config.chainName,
    networkId: config.networkId,
    activeChainKey: config.activeChain.key,
    usdcAddress: config.usdcAddress,
    usdcDecimals: config.usdcDecimals,
    escrowAddress: config.escrowAddress ?? null,
    explorerUrl: config.explorerUrl,
    explorerName: config.explorerName,
    faucetUrl: config.faucetUrl ?? null,
    demoMode: config.demoMode,
    supportedChains: config.supportedChains.map(publicChain),
  };
}

export function getChainConfig(chainId: number) {
  return config.supportedChains.find((c) => c.chainId === chainId) ?? config.activeChain;
}
