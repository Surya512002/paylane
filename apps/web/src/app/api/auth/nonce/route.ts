import { NextRequest } from "next/server";
import { createNonce, buildSiweMessage } from "@/lib/auth";
import { config } from "@/lib/config";
import { jsonOk, handleRouteError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) return jsonOk({ error: "address required" }, 400);
    const nonce = await createNonce(address);
    const message = buildSiweMessage(address, nonce, config.chainId);
    return jsonOk({ nonce, message });
  } catch (e) {
    return handleRouteError(e);
  }
}
