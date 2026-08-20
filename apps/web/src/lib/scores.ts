/** Merit / trust score updates for the talent board. */
import { prisma } from "./db";

export async function bumpScoresOnJobSuccess(workerId: string | null | undefined, clientId: string) {
  if (!workerId) return;

  const worker = await prisma.user.findUnique({ where: { id: workerId } });
  if (!worker) return;

  const newCompleted = worker.completedJobs + 1;
  const meritBump = 8;
  const trustBump = worker.trustScore < 100 ? 2 : 0;

  await prisma.user.update({
    where: { id: workerId },
    data: {
      completedJobs: newCompleted,
      meritScore: Math.min(1000, worker.meritScore + meritBump),
      trustScore: Math.min(100, worker.trustScore + trustBump),
      reputation: Math.min(100, worker.reputation + trustBump),
    },
  });

  await prisma.user.update({
    where: { id: clientId },
    data: { jobsHired: { increment: 1 } },
  });
}

export async function penalizeOnDispute(partyIds: string[]) {
  for (const id of partyIds) {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) continue;
    await prisma.user.update({
      where: { id },
      data: {
        trustScore: Math.max(0, u.trustScore - 5),
        reputation: Math.max(0, u.reputation - 5),
      },
    });
  }
}

export async function recomputeAvgRating(userId: string) {
  const agg = await prisma.review.aggregate({
    where: { toId: userId },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      avgRating: agg._avg.rating ?? null,
      // Light merit from ratings
      meritScore: agg._count > 0
        ? undefined
        : undefined,
    },
  });
  if (agg._avg.rating != null && agg._count > 0) {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (u) {
      const ratingBoost = Math.round((agg._avg.rating - 3) * 3);
      await prisma.user.update({
        where: { id: userId },
        data: { meritScore: Math.max(0, Math.min(1000, u.meritScore + Math.max(0, ratingBoost))) },
      });
    }
  }
}

export function publicProfileSelect() {
  return {
    id: true,
    walletAddress: true,
    displayName: true,
    headline: true,
    bio: true,
    skills: true,
    roleTags: true,
    availability: true,
    profilePublic: true,
    location: true,
    portfolioUrl: true,
    githubUrl: true,
    websiteUrl: true,
    hourlyRateMinor: true,
    trustScore: true,
    meritScore: true,
    completedJobs: true,
    jobsHired: true,
    avgRating: true,
    createdAt: true,
  } as const;
}
