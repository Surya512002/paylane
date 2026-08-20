import { DEFAULTS } from "@workpay/shared";
import { resolveActiveChain, resolveSupportedChains, type ChainPreset } from "./networks";
import { getPublicClient } from "./chain";
import { escrowAbi } from "./escrowAbi";

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

function resolvePlatformFeeBps(): number {
  const raw = envInt("PLATFORM_FEE_BPS", DEFAULTS.platformFeeBps);
  // Legacy env still set to 200 (2%) — product default is now 10 (0.1%).
  if (raw === 200) return DEFAULTS.platformFeeBps;
  return raw;
}

const activeChain = resolveActiveChain();
const supportedChains = resolveSupportedChains();

/** Live testnet is the default. Simulated escrow only if DEMO_MODE=true and no escrow is configured. */
const demoMode = envBool("DEMO_MODE", false) && !activeChain.escrowAddress;

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
  platformFeeBps: resolvePlatformFeeBps(),
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
    live: Boolean(preset.escrowAddress),
  };
}

export function publicConfig() {
  return buildPublicConfig(config.platformFeeBps);
}

/** Prefer on-chain platformFeeBps when live escrow is configured. */
export async function getPublicConfig() {
  let feeBps = config.platformFeeBps;
  if (!config.demoMode && config.escrowAddress) {
    try {
      const client = getPublicClient(config.chainId);
      const onChain = await client.readContract({
        address: config.escrowAddress,
        abi: escrowAbi,
        functionName: "platformFeeBps",
      });
      feeBps = Number(onChain);
    } catch {
      /* keep env/default */
    }
  }
  return buildPublicConfig(feeBps);
}

function buildPublicConfig(platformFeeBps: number) {
  return {
    appName: config.appName,
    platformFeeBps,
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
