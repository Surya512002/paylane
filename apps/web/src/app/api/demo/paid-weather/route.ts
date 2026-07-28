import { NextRequest } from "next/server";
import { ReceiptType, LedgerKind } from "@workpay/shared";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import {
  buildPaymentChallenge,
  verifyX402Payment,
  computeApiSplit,
  createDemoPaymentProof,
} from "@/lib/x402";
import { jsonOk, handleRouteError } from "@/lib/api-utils";

const RESOURCE_PATH = "/api/demo/paid-weather";

async function getResource() {
  return prisma.paidResource.findFirst({ where: { path: RESOURCE_PATH, enabled: true } });
}

export async function GET(req: NextRequest) {
  try {
    const resource = await getResource();
    if (!resource) return jsonOk({ error: "Resource not configured" }, 503);

    const buyerAddress =
      req.headers.get("x-buyer-address") ??
      req.nextUrl.searchParams.get("buyer") ??
      "0x0000000000000000000000000000000000000000";
    const idempotencyKey =
      req.headers.get("x-idempotency-key") ??
      req.nextUrl.searchParams.get("idempotencyKey") ??
      `weather-${Date.now()}`;
    const paymentHeader =
      req.headers.get("x-payment") ?? req.headers.get("payment-signature");

    const verification = await verifyX402Payment({
      paymentHeader,
      resourceId: resource.id,
      path: RESOURCE_PATH,
      amountMinor: resource.priceMinor,
      buyerAddress,
      idempotencyKey,
    });

    if (!verification.ok) {
      const challenge = buildPaymentChallenge({
        resourceId: resource.id,
        path: RESOURCE_PATH,
        amountMinor: resource.priceMinor,
        description: resource.description,
      });
      return new Response(JSON.stringify(challenge), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          ...(config.demoMode
            ? {
                "X-Demo-Proof-Hint": createDemoPaymentProof({
                  resourceId: resource.id,
                  buyerAddress,
                  amountMinor: resource.priceMinor,
                  idempotencyKey,
                }),
              }
            : {}),
        },
      });
    }

    const force5xx = req.nextUrl.searchParams.get("force5xx") === "1";
    if (force5xx) {
      const usage = await prisma.usageEvent.create({
        data: {
          resourceId: resource.id,
          buyerAddress: buyerAddress.toLowerCase(),
          amountMinor: resource.priceMinor,
          status: "failed",
          idempotencyKey,
          paymentProof: paymentHeader,
          settlementRef: verification.settlementRef,
          httpStatus: 500,
        },
      });
      if (config.apiCreditOnSeller5xx) {
        const buyer = await prisma.user.findUnique({
          where: { walletAddress: buyerAddress.toLowerCase() },
        });
        if (buyer) {
          await prisma.apiCredit.create({
            data: {
              userId: buyer.id,
              amountMinor: resource.priceMinor,
              reason: "seller_5xx",
              usageEventId: usage.id,
            },
          });
          await prisma.ledgerEntry.create({
            data: {
              type: ReceiptType.Api,
              kind: LedgerKind.ApiCredit,
              amountMinor: resource.priceMinor,
              status: "confirmed",
              userId: buyer.id,
              settlementRef: usage.id,
            },
          });
        }
      }
      return jsonOk({ error: "Simulated seller 5xx — credit issued if eligible" }, 500);
    }

    const { feeMinor, sellerMinor } = computeApiSplit(resource.priceMinor);
    const buyer = await prisma.user.findUnique({
      where: { walletAddress: buyerAddress.toLowerCase() },
    });

    await prisma.usageEvent.create({
      data: {
        resourceId: resource.id,
        buyerId: buyer?.id,
        buyerAddress: buyerAddress.toLowerCase(),
        amountMinor: resource.priceMinor,
        status: "success",
        idempotencyKey,
        paymentProof: paymentHeader,
        settlementRef: verification.settlementRef,
        httpStatus: 200,
      },
    });

    await prisma.ledgerEntry.createMany({
      data: [
        {
          type: ReceiptType.Api,
          kind: LedgerKind.ApiPayment,
          amountMinor: resource.priceMinor,
          feeMinor,
          status: "confirmed",
          userId: buyer?.id,
          settlementRef: verification.settlementRef,
        },
        {
          type: ReceiptType.Api,
          kind: LedgerKind.PlatformFee,
          amountMinor: feeMinor,
          status: "confirmed",
          settlementRef: verification.settlementRef,
        },
      ],
    });

    void sellerMinor;
    return jsonOk({
      city: "Arc City",
      tempF: 72,
      condition: "Partly cloudy",
      paid: true,
      amountMinor: resource.priceMinor.toString(),
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
