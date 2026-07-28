import { NextRequest } from "next/server";
import { resolveDisputeSchema } from "@workpay/shared";
import { requireAdmin } from "@/lib/auth";
import { applyJobTransition } from "@/lib/jobs/transitions";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = resolveDisputeSchema.parse(await req.json());
    const dispute = await prisma.dispute.findUnique({ where: { id } });
    if (!dispute) return jsonOk({ error: "Not found" }, 404);
    const job = await applyJobTransition(dispute.jobId, "resolve", admin, body);
    await prisma.adminDecision.create({
      data: {
        adminId: admin.id,
        disputeId: id,
        action: "resolve",
        details: body,
      },
    });
    return jsonOk({ job: serialize(job) });
  } catch (e) {
    return handleRouteError(e);
  }
}
