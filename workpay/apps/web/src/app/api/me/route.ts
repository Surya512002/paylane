import { getUser } from "@/lib/auth";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await getUser();
    return jsonOk({ user: user ? serialize(user) : null });
  } catch (e) {
    return handleRouteError(e);
  }
}
