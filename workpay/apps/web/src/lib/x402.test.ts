import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("./db", () => ({
  prisma: {
    usageEvent: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}));

import {
  buildPaymentChallenge,
  createDemoPaymentProof,
  verifyX402Payment,
  clearUsedProofsForTests,
} from "./x402";

describe("x402 demo payments", () => {
  beforeEach(() => {
    clearUsedProofsForTests();
    process.env.DEMO_MODE = "true";
    process.env.SESSION_SECRET = "dev-secret-change-me-min-32-chars-long!!";
  });

  it("returns 402 challenge shape when unpaid", () => {
    const challenge = buildPaymentChallenge({
      resourceId: "res1",
      path: "/api/demo/paid-weather",
      amountMinor: 10_000n,
      description: "Weather",
    });
    expect(challenge.x402Version).toBe(1);
    expect(challenge.accepts[0].maxAmountRequired).toBe("10000");
    expect(challenge.accepts[0].scheme).toBe("exact");
  });

  it("accepts valid demo payment once", async () => {
    const params = {
      resourceId: "res1",
      buyerAddress: "0xabc",
      amountMinor: 10_000n,
      idempotencyKey: "key-1",
    };
    const proof = createDemoPaymentProof(params);
    const first = await verifyX402Payment({
      paymentHeader: proof,
      ...params,
      path: "/api/demo/paid-weather",
    });
    expect(first.ok).toBe(true);
  });

  it("rejects replay of same proof", async () => {
    const params = {
      resourceId: "res1",
      buyerAddress: "0xabc",
      amountMinor: 10_000n,
      idempotencyKey: "key-2",
    };
    const proof = createDemoPaymentProof(params);
    await verifyX402Payment({ paymentHeader: proof, ...params, path: "/api/demo/paid-weather" });
    const second = await verifyX402Payment({ paymentHeader: proof, ...params, path: "/api/demo/paid-weather" });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toMatch(/already used/i);
  });
});
