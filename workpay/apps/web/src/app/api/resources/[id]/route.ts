import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await ctx.params;
    const { enabled } = await req.json();
    const resource = await prisma.paidResource.findFirst({ where: { id, sellerId: user.id } });
    if (!resource) return jsonOk({ error: "Not found" }, 404);
    const updated = await prisma.paidResource.update({
      where: { id },
      data: { enabled: Boolean(enabled) },
    });
    return jsonOk({ resource: serialize(updated) });
  } catch (e) {
    return handleRouteError(e);
  }
}
