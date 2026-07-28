# Paid API Seller Example (Mode B)

Shows how a seller wraps an endpoint with x402 payment verification.
The production WorkPay app already hosts `/api/demo/paid-weather`.

This example is a standalone Express-style sketch you can copy into your own service.

```ts
// middleware sketch
import { requirePayment } from "./x402-middleware";

app.get("/v1/insight", requirePayment({ priceMinor: "10000" }), (req, res) => {
  res.json({ ok: true, data: "paid insight" });
});
```

See in-app docs: **User Guide — API Sellers** and `apps/web/src/lib/x402.ts`.
