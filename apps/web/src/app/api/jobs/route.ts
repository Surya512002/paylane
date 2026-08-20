import { NextRequest } from "next/server";
import { createJobSchema } from "@workpay/shared";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const status = req.nextUrl.searchParams.get("status");
    const jobs = await prisma.job.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        OR: [{ clientId: user.id }, { workerId: user.id }],
      },
      include: { client: true, worker: true },
      orderBy: { updatedAt: "desc" },
    });
    const marketplace = await prisma.job.findMany({
      where: {
        OR: [{ status: "Published" }, { status: "Funded", workerId: null }],
      },
      include: { client: true, worker: true },
      orderBy: { createdAt: "desc" },
    });
    const merged = [
      ...jobs,
      ...marketplace.filter((p) => !jobs.find((j) => j.id === p.id)),
    ];
    return jsonOk({ jobs: serialize(merged) });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = createJobSchema.parse(body);
    const job = await prisma.job.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        amountMinor: BigInt(parsed.amountMinor),
        checklist: parsed.checklist,
        deadlineAt: parsed.deadlineAt ? new Date(parsed.deadlineAt) : null,
        clientId: user.id,
      },
    });
    await writeAuditLog({ userId: user.id, action: "create", entity: "Job", entityId: job.id });
    return jsonOk({ job: serialize(job) }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
