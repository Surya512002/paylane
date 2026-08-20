export enum JobStatus {
  Draft = "Draft",
  Published = "Published",
  Funded = "Funded",
  Assigned = "Assigned",
  InProgress = "InProgress",
  Delivered = "Delivered",
  RevisionRequested = "RevisionRequested",
  Accepted = "Accepted",
  Disputed = "Disputed",
  Resolved = "Resolved",
  AutoReleased = "AutoReleased",
  Cancelled = "Cancelled",
  Expired = "Expired",
}

export enum ReceiptType {
  Job = "job",
  Api = "api",
}

export enum LedgerKind {
  EscrowFund = "escrow_fund",
  EscrowRelease = "escrow_release",
  EscrowRefund = "escrow_refund",
  EscrowSplit = "escrow_split",
  ApiPayment = "api_payment",
  ApiCredit = "api_credit",
  ApiRefund = "api_refund",
  PlatformFee = "platform_fee",
}

export const USDC_DECIMALS = 6;

/** Format minor units as dollar-first display string. */
export function formatUsdc(minor: bigint | number | string): string {
  const n = typeof minor === "bigint" ? minor : BigInt(minor);
  const neg = n < 0n;
  const abs = neg ? -n : n;
  const whole = abs / 10n ** BigInt(USDC_DECIMALS);
  const frac = abs % 10n ** BigInt(USDC_DECIMALS);
  const fracStr = frac.toString().padStart(USDC_DECIMALS, "0");
  return `${neg ? "-" : ""}$${whole.toString()}.${fracStr} USDC`;
}

export function parseUsdcToMinor(dollars: string): bigint {
  const cleaned = dollars.replace(/[$,\s]/g, "").replace(/USDC/i, "").trim();
  const [w, f = ""] = cleaned.split(".");
  const frac = (f + "000000").slice(0, USDC_DECIMALS);
  return BigInt(w || "0") * 10n ** BigInt(USDC_DECIMALS) + BigInt(frac || "0");
}

export function platformFee(amountMinor: bigint, bps: number): bigint {
  return (amountMinor * BigInt(bps)) / 10_000n;
}

export function workerNet(amountMinor: bigint, bps: number): bigint {
  return amountMinor - platformFee(amountMinor, bps);
}

export * from "./schemas";

export const DEFAULTS = {
  platformFeeBps: 10, // 0.1%
  reviewWindowHours: 72,
  revisionLimit: 2,
  disputeEvidenceHours: 72,
  apiCreditOnSeller5xx: true,
} as const;
