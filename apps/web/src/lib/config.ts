import { DEFAULTS } from "@workpay/shared";
import { resolveNetwork } from "./networks";

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

const network = resolveNetwork();
const isProd = process.env.NODE_ENV === "production";

/** DEMO_MODE defaults false in production builds; true locally for faster onboarding. */
const demoMode = envBool("DEMO_MODE", !isProd);

export const config = {
  appName: "Paylane",
  databaseUrl: process.env.DATABASE_URL ?? "",
  network,
  networkId: network.id,
  chainId: network.chainId,
  chainName: network.name,
  arcRpc: network.rpcUrl,
  usdcAddress: network.usdcAddress,
  escrowAddress: network.escrowAddress,
  explorerUrl: network.explorerUrl,
  faucetUrl: network.faucetUrl,
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
  console.warn("[Paylane] DEMO_MODE=false but NEXT_PUBLIC_ESCROW_ADDRESS is unset");
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
    usdcAddress: config.usdcAddress,
    escrowAddress: config.escrowAddress ?? null,
    explorerUrl: config.explorerUrl,
    faucetUrl: config.faucetUrl ?? null,
    demoMode: config.demoMode,
  };
}
