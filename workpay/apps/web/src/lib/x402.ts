import { createHmac, timingSafeEqual } from "crypto";
import { config } from "./config";
import { prisma } from "./db";
import { platformFee } from "./money";

export interface PaymentRequirements {
  scheme: "exact";
  network: string;
  maxAmountRequired: string;
  resource: string;
  description: string;
  mimeType: string;
  payTo: string;
  maxTimeoutSeconds: number;
  asset: string;
}

export interface X402Challenge {
  x402Version: 1;
  accepts: PaymentRequirements[];
  error?: string;
}

const usedProofs = new Set<string>();

export function buildPaymentChallenge(params: {
  resourceId: string;
  path: string;
  amountMinor: bigint;
  description: string;
  sellerAddress?: string;
}): X402Challenge {
  return {
    x402Version: 1,
    accepts: [
      {
        scheme: "exact",
        network: `eip155:${config.chainId}`,
        maxAmountRequired: params.amountMinor.toString(),
        resource: params.path,
        description: params.description,
        mimeType: "application/json",
        payTo: params.sellerAddress ?? config.usdcAddress,
        maxTimeoutSeconds: 300,
        asset: config.usdcAddress,
      },
    ],
  };
}

export function createDemoPaymentProof(params: {
  resourceId: string;
  buyerAddress: string;
  amountMinor: bigint;
  idempotencyKey: string;
}): string {
  const payload = [
    params.resourceId,
    params.buyerAddress.toLowerCase(),
    params.amountMinor.toString(),
    params.idempotencyKey,
  ].join("|");
  return createHmac("sha256", config.sessionSecret).update(payload).digest("hex");
}

function verifyDemoProof(
  proof: string,
  params: {
    resourceId: string;
    buyerAddress: string;
    amountMinor: bigint;
    idempotencyKey: string;
  },
): boolean {
  const expected = createDemoPaymentProof(params);
  try {
    const a = Buffer.from(proof, "hex");
    const b = Buffer.from(expected, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function verifyX402Payment(params: {
  paymentHeader: string | null;
  resourceId: string;
  path: string;
  amountMinor: bigint;
  buyerAddress: string;
  idempotencyKey: string;
}): Promise<{ ok: true; settlementRef: string } | { ok: false; reason: string }> {
  if (!params.paymentHeader) {
    return { ok: false, reason: "Payment required" };
  }

  if (config.demoMode) {
    if (!verifyDemoProof(params.paymentHeader, params)) {
      return { ok: false, reason: "Invalid demo payment proof" };
    }

    const replayKey = `${params.resourceId}:${params.paymentHeader}`;
    if (usedProofs.has(replayKey)) {
      return { ok: false, reason: "Payment proof already used" };
    }

    const existing = await prisma.usageEvent.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing) {
      return { ok: false, reason: "Idempotency key already used" };
    }

    usedProofs.add(replayKey);
    return { ok: true, settlementRef: `demo:${params.paymentHeader.slice(0, 16)}` };
  }

  // Production stub: accept base64 JSON with txHash for facilitator integration
  try {
    const decoded = JSON.parse(Buffer.from(params.paymentHeader, "base64url").toString());
    if (decoded?.txHash) {
      return { ok: true, settlementRef: decoded.txHash as string };
    }
  } catch {
    /* fall through */
  }
  return { ok: false, reason: "Facilitator verification failed" };
}

export function computeApiSplit(amountMinor: bigint) {
  const fee = platformFee(amountMinor, config.platformFeeBps);
  return { feeMinor: fee, sellerMinor: amountMinor - fee };
}

export function clearUsedProofsForTests() {
  usedProofs.clear();
}
