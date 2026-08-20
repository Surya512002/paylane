import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

/** Dashboard summary: incoming proposals on your jobs + your pending applications. */
export async function GET() {
  try {
    const user = await requireUser();

    const incoming = await prisma.proposal.findMany({
      where: {
        status: "Pending",
        job: {
          clientId: user.id,
          workerId: null,
          status: { in: ["Published", "Funded"] },
        },
      },
      include: {
        job: { select: { id: true, title: true, status: true } },
        worker: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true,
            roleTags: true,
            trustScore: true,
            meritScore: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    const mine = await prisma.proposal.findMany({
      where: {
        workerId: user.id,
        status: "Pending",
        job: { status: { in: ["Published", "Funded"] }, workerId: null },
      },
      include: {
        job: { select: { id: true, title: true, status: true, amountMinor: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
    });

    const recent = await prisma.proposal.findMany({
      where: {
        workerId: user.id,
        status: { in: ["Accepted", "Rejected"] },
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        job: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    });

    return jsonOk({
      incoming: serialize(incoming),
      mine: serialize(mine),
      recent: serialize(recent),
      counts: {
        incomingPending: incoming.length,
        myPending: mine.length,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
