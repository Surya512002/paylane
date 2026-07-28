import { destroySession } from "@/lib/auth";
import { jsonOk, handleRouteError } from "@/lib/api-utils";

export async function POST() {
  try {
    await destroySession();
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
