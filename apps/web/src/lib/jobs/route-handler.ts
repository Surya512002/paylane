import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { applyJobTransition, type JobAction } from "@/lib/jobs/transitions";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export function jobActionRoute(action: JobAction) {
  return async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    try {
      const user = await requireUser();
      const { id } = await ctx.params;
      const body = req.headers.get("content-type")?.includes("json") ? await req.json() : {};
      const job = await applyJobTransition(id, action, user, body);
      return jsonOk({ job: serialize(job) });
    } catch (e) {
      return handleRouteError(e);
    }
  };
}
