import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await requireUser();
    const entries = await prisma.ledgerEntry.findMany({
      where: { OR: [{ userId: user.id }, { job: { OR: [{ clientId: user.id }, { workerId: user.id }] } }] },
      include: { job: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return jsonOk({ receipts: serialize(entries) });
  } catch (e) {
    return handleRouteError(e);
  }
}
