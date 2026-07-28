/**
 * Minimal seller middleware sketch for x402-style challenges.
 * Prefer WorkPay's built-in PaidResource + demo endpoint for the full flow.
 */
export type PaymentRequirement = {
  resourceId: string;
  priceMinor: string;
  network: string;
  scheme: "exact" | "gateway-demo";
};

export function paymentRequired(req: PaymentRequirement, res: { status: (n: number) => { json: (b: unknown) => void } }) {
  res.status(402).json({
    ...req,
    message: "Payment Required — retry with X-PAYMENT proof",
  });
}

export function verifyDemoHeader(header: string | undefined): boolean {
  return Boolean(header && header.length > 16);
}
