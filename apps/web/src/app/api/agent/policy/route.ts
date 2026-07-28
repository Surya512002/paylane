import { NextRequest } from "next/server";
import { agentPolicySchema } from "@workpay/shared";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";

export async function GET() {
  try {
    const user = await requireUser();
    const policy = await prisma.agentPolicy.findUnique({ where: { userId: user.id } });
    const usage = await prisma.usageEvent.findMany({
      where: { buyerId: user.id },
      include: { resource: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const credits = await prisma.apiCredit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ policy: serialize(policy), usage: serialize(usage), credits: serialize(credits) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = agentPolicySchema.parse(await req.json());
    const policy = await prisma.agentPolicy.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        dailySpendCapMinor: body.dailySpendCapMinor ? BigInt(body.dailySpendCapMinor) : null,
        allowlistedHosts: body.allowlistedHosts,
        paused: body.paused,
      },
      update: {
        dailySpendCapMinor: body.dailySpendCapMinor ? BigInt(body.dailySpendCapMinor) : null,
        allowlistedHosts: body.allowlistedHosts,
        paused: body.paused,
      },
    });
    return jsonOk({ policy: serialize(policy) });
  } catch (e) {
    return handleRouteError(e);
  }
}
