import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function GET() {
  try {
    await requireAdmin();
    const disputes = await prisma.dispute.findMany({
      where: { status: "open" },
      include: { job: { include: { client: true, worker: true } }, opener: true },
      orderBy: { createdAt: "asc" },
    });
    return jsonOk({ disputes: serialize(disputes) });
  } catch (e) {
    return handleRouteError(e);
  }
}
