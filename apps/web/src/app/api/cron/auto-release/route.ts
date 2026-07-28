import { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { runAutoReleaseCrank } from "@/lib/jobs/transitions";
import { jsonOk, handleRouteError, jsonError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-cron-secret");
    if (!config.demoMode && secret !== config.cronSecret) {
      return jsonError("Unauthorized", 401);
    }
    const results = await runAutoReleaseCrank();
    return jsonOk({ processed: results.length, results });
  } catch (e) {
    return handleRouteError(e);
  }
}
