import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { publicProfileSelect } from "@/lib/scores";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { walletAddress: id.toLowerCase() }],
        profilePublic: true,
      },
      select: {
        ...publicProfileSelect(),
        reviewsReceived: {
          take: 8,
          orderBy: { createdAt: "desc" },
          include: {
            from: { select: { id: true, displayName: true, walletAddress: true } },
            job: { select: { id: true, title: true } },
          },
        },
        jobsAsWorker: {
          where: { status: { in: ["Accepted", "AutoReleased"] } },
          take: 6,
          orderBy: { updatedAt: "desc" },
          select: { id: true, title: true, status: true, amountMinor: true, updatedAt: true },
        },
      },
    });
    if (!user) return jsonError("Profile not found or private", 404);
    return jsonOk({ profile: serialize(user) });
  } catch (e) {
    return handleRouteError(e);
  }
}
