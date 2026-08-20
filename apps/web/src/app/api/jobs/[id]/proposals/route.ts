import { NextRequest } from "next/server";
import { createProposalSchema } from "@workpay/shared";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { writeAuditLog } from "@/lib/audit";

type Ctx = { params: Promise<{ id: string }> };

/** List proposals for a job (client sees all; workers see their own). */
export async function GET(_req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id: jobId } = await ctx.params;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return jsonError("Job not found", 404);

    const isClient = job.clientId === user.id;
    const proposals = await prisma.proposal.findMany({
      where: isClient ? { jobId } : { jobId, workerId: user.id },
      include: {
        worker: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true,
            headline: true,
            skills: true,
            trustScore: true,
            meritScore: true,
            completedJobs: true,
            avgRating: true,
            availability: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ proposals: serialize(proposals), isClient });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Worker submits a proposal on a funded/published job. */
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const user = await requireUser();
    const { id: jobId } = await ctx.params;
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return jsonError("Job not found", 404);
    if (job.clientId === user.id) return jsonError("You cannot propose on your own job", 400);
    if (!["Published", "Funded"].includes(job.status) || job.workerId) {
      return jsonError("This job is not open for proposals", 400);
    }

    const body = await req.json();
    const parsed = createProposalSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid proposal", 400);
    }

    const proposal = await prisma.proposal.upsert({
      where: { jobId_workerId: { jobId, workerId: user.id } },
      create: {
        jobId,
        workerId: user.id,
        coverLetter: parsed.data.coverLetter,
        proposedAmountMinor: parsed.data.proposedAmountMinor
          ? BigInt(parsed.data.proposedAmountMinor)
          : null,
        status: "Pending",
      },
      update: {
        coverLetter: parsed.data.coverLetter,
        proposedAmountMinor: parsed.data.proposedAmountMinor
          ? BigInt(parsed.data.proposedAmountMinor)
          : null,
        status: "Pending",
      },
      include: {
        worker: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true,
            meritScore: true,
            trustScore: true,
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        userId: job.clientId,
        title: "New job proposal",
        body: `${user.displayName ?? user.walletAddress.slice(0, 10)} proposed on “${job.title}”`,
        href: `/jobs/${jobId}`,
      },
    });

    await writeAuditLog({
      userId: user.id,
      action: "propose",
      entity: "Proposal",
      entityId: proposal.id,
    });

    return jsonOk({ proposal: serialize(proposal) }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
