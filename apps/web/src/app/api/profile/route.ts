import { NextRequest } from "next/server";
import { updateProfileSchema } from "@workpay/shared";
import { requireUser, getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { publicProfileSelect } from "@/lib/scores";
import { writeAuditLog } from "@/lib/audit";

/** Current user's full profile (private). */
export async function GET() {
  try {
    const user = await getUser();
    if (!user) return jsonOk({ user: null });
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        ...publicProfileSelect(),
        email: true,
        isAdmin: true,
        reputation: true,
      },
    });
    return jsonOk({ user: serialize(full) });
  } catch (e) {
    return handleRouteError(e);
  }
}

/** Create / update your public profile. */
export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile", 400);
    }
    const d = parsed.data;
    const emptyToNull = (v: string | null | undefined) =>
      v === "" || v === undefined ? null : v;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(d.displayName !== undefined ? { displayName: emptyToNull(d.displayName) } : {}),
        ...(d.headline !== undefined ? { headline: emptyToNull(d.headline) } : {}),
        ...(d.bio !== undefined ? { bio: emptyToNull(d.bio) } : {}),
        ...(d.skills !== undefined ? { skills: d.skills } : {}),
        ...(d.roleTags !== undefined ? { roleTags: d.roleTags } : {}),
        ...(d.availability !== undefined ? { availability: d.availability } : {}),
        ...(d.profilePublic !== undefined ? { profilePublic: d.profilePublic } : {}),
        ...(d.location !== undefined ? { location: emptyToNull(d.location) } : {}),
        ...(d.portfolioUrl !== undefined ? { portfolioUrl: emptyToNull(d.portfolioUrl) } : {}),
        ...(d.githubUrl !== undefined ? { githubUrl: emptyToNull(d.githubUrl) } : {}),
        ...(d.websiteUrl !== undefined ? { websiteUrl: emptyToNull(d.websiteUrl) } : {}),
        ...(d.hourlyRateMinor !== undefined
          ? { hourlyRateMinor: d.hourlyRateMinor ? BigInt(d.hourlyRateMinor) : null }
          : {}),
        ...(d.email !== undefined ? { email: emptyToNull(d.email) } : {}),
      },
      select: { ...publicProfileSelect(), email: true },
    });

    await writeAuditLog({
      userId: user.id,
      action: "update_profile",
      entity: "User",
      entityId: user.id,
    });

    return jsonOk({ user: serialize(updated) });
  } catch (e) {
    return handleRouteError(e);
  }
}
