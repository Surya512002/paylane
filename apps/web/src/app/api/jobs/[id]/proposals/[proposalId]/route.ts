import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { applyJobTransition } from "@/lib/jobs/transitions";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string; proposalId: string }> };

/** Client accepts or rejects a proposal. Accept assigns the worker. */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id: jobId, proposalId } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as { action?: string };
    const action = body.action === "reject" ? "reject" : "accept";

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return jsonError("Job not found", 404);
    if (job.clientId !== user.id) return jsonError("Only the client can decide proposals", 403);

    const proposal = await prisma.proposal.findFirst({
      where: { id: proposalId, jobId },
      include: { worker: true },
    });
    if (!proposal) return jsonError("Proposal not found", 404);
    if (proposal.status !== "Pending") return jsonError("Proposal already decided", 400);

    if (action === "reject") {
      const updated = await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: "Rejected" },
      });
      await prisma.notification.create({
        data: {
          userId: proposal.workerId,
          title: "Proposal declined",
          body: `Your proposal on “${job.title}” was not selected.`,
          href: `/jobs/${jobId}`,
        },
      });
      return jsonOk({ proposal: serialize(updated) });
    }

    if (!["Published", "Funded"].includes(job.status) || job.workerId) {
      return jsonError("Job is not open to assign", 400);
    }

    // Assign worker via existing transition (Funded) or publish+fund path
    if (job.status === "Published") {
      return jsonError("Fund escrow before accepting a proposal", 400);
    }

    await applyJobTransition(jobId, "assign", user, {
      workerAddress: proposal.worker.walletAddress,
    });

    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: "Accepted" },
    });
    await prisma.proposal.updateMany({
      where: { jobId, id: { not: proposalId }, status: "Pending" },
      data: { status: "Rejected" },
    });

    await prisma.notification.create({
      data: {
        userId: proposal.workerId,
        title: "Proposal accepted",
        body: `You were hired on “${job.title}”. Start work when ready.`,
        href: `/jobs/${jobId}`,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "accept_proposal",
      entity: "Proposal",
      entityId: proposalId,
    });

    const refreshed = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: { worker: true },
    });
    return jsonOk({ proposal: serialize(refreshed) });
  } catch (e) {
    return handleRouteError(e);
  }
}
