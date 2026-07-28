/** Client-safe demo proof helper (mirrors server HMAC in demo mode). */
export function createDemoPaymentProof(_params: {
  resourceId: string;
  buyerAddress: string;
  amountMinor: bigint;
  idempotencyKey: string;
}): string {
  // Server returns X-Demo-Proof-Hint on 402; fallback placeholder for UI
  return "";
}
