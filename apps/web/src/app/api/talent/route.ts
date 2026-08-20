import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { publicProfileSelect } from "@/lib/scores";

/** Talent board — public profiles open for hire. */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    const skill = req.nextUrl.searchParams.get("skill")?.trim() ?? "";
    const role = req.nextUrl.searchParams.get("role")?.trim() ?? "";
    const sort = req.nextUrl.searchParams.get("sort") ?? "merit";

    const where: Record<string, unknown> = {
      profilePublic: true,
      AND: [
        {
          OR: [
            { displayName: { not: null } },
            { headline: { not: null } },
            { bio: { not: null } },
          ],
        },
      ],
    };
    if (skill) where.skills = { has: skill };
    if (role) where.roleTags = { has: role };
    if (q) {
      (where.AND as unknown[]).push({
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { headline: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const orderBy =
      sort === "trust"
        ? [{ trustScore: "desc" as const }, { meritScore: "desc" as const }]
        : sort === "jobs"
          ? [{ completedJobs: "desc" as const }, { meritScore: "desc" as const }]
          : [{ meritScore: "desc" as const }, { trustScore: "desc" as const }];

    const profiles = await prisma.user.findMany({
      where,
      select: publicProfileSelect(),
      orderBy,
      take: 60,
    });

    return jsonOk({ profiles: serialize(profiles) });
  } catch (e) {
    return handleRouteError(e);
  }
}
