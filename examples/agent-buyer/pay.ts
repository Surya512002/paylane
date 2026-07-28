/**
 * Demo agent buyer for WorkPay Mode B (x402).
 * DEMO_MODE: X-PAYMENT is the HMAC hex proof (see apps/web/src/lib/x402.ts).
 */
import { createHmac, randomUUID } from "node:crypto";

const BASE = process.env.WORKPAY_URL ?? "http://localhost:3000";
const BUYER = (process.env.BUYER_ADDRESS ?? "0x4444444444444444444444444444444444444444").toLowerCase();
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me-min-32-chars-long!!";

type Challenge = {
  x402Version: number;
  accepts: Array<{ maxAmountRequired: string; resource: string; description: string }>;
};

async function main() {
  const idempotencyKey = randomUUID();

  const unpaid = await fetch(`${BASE}/api/demo/paid-weather?buyer=${BUYER}&idempotencyKey=${idempotencyKey}`, {
    headers: { "X-Buyer-Address": BUYER, "X-Idempotency-Key": idempotencyKey },
  });
  if (unpaid.status !== 402) {
    console.error("Expected 402, got", unpaid.status, await unpaid.text());
    process.exit(1);
  }
  const challenge = (await unpaid.json()) as Challenge;
  const hint = unpaid.headers.get("x-demo-proof-hint");
  console.log("402 challenge:", JSON.stringify(challenge, null, 2));

  // Discover resource id from DB-backed challenge path via second call to config isn't needed —
  // hint is computed server-side; we recompute locally after fetching resource id from receipts isn't available.
  // Prefer server hint; otherwise caller must set RESOURCE_ID.
  let proof = hint;
  if (!proof) {
    const resourceId = process.env.RESOURCE_ID;
    if (!resourceId) {
      console.error("No X-Demo-Proof-Hint and RESOURCE_ID unset");
      process.exit(1);
    }
    const amount = challenge.accepts[0]?.maxAmountRequired ?? "10000";
    proof = createHmac("sha256", SECRET)
      .update(`${resourceId}|${BUYER}|${amount}|${idempotencyKey}`)
      .digest("hex");
  }

  const paid = await fetch(`${BASE}/api/demo/paid-weather`, {
    headers: {
      "X-PAYMENT": proof,
      "X-Buyer-Address": BUYER,
      "X-Idempotency-Key": idempotencyKey,
    },
  });
  const body = await paid.json();
  console.log("paid status", paid.status, body);
  if (!paid.ok) process.exit(1);

  // Replay should fail
  const replay = await fetch(`${BASE}/api/demo/paid-weather`, {
    headers: {
      "X-PAYMENT": proof,
      "X-Buyer-Address": BUYER,
      "X-Idempotency-Key": idempotencyKey,
    },
  });
  console.log("replay status (expect 402)", replay.status);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
