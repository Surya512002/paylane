import { NextRequest } from "next/server";
import { verifySiweAndCreateSession } from "@/lib/auth";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();
    if (!message || !signature) return jsonOk({ error: "message and signature required" }, 400);
    const user = await verifySiweAndCreateSession(message, signature);
    return jsonOk({ user: serialize(user) });
  } catch (e) {
    return handleRouteError(e);
  }
}
