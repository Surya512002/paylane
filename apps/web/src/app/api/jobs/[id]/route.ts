import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        worker: true,
        deliveries: { orderBy: { createdAt: "desc" } },
        disputes: true,
        ledger: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!job) return jsonOk({ error: "Not found" }, 404);
    return jsonOk({ job: serialize(job) });
  } catch (e) {
    return handleRouteError(e);
  }
}
