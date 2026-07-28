import { NextRequest } from "next/server";
import { paidResourceSchema } from "@workpay/shared";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await requireUser();
    const resources = await prisma.paidResource.findMany({
      where: { sellerId: user.id },
      include: { _count: { select: { usageEvents: true } } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ resources: serialize(resources) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = paidResourceSchema.parse(await req.json());
    const resource = await prisma.paidResource.create({
      data: {
        sellerId: user.id,
        name: body.name,
        path: body.path,
        description: body.description,
        priceMinor: BigInt(body.priceMinor),
        rateLimitPerMinute: body.rateLimitPerMinute,
      },
    });
    return jsonOk({ resource: serialize(resource) }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
