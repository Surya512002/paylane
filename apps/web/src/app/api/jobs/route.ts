import { NextRequest } from "next/server";
import { createJobSchema } from "@workpay/shared";
import { requireUser, getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, handleRouteError } from "@/lib/api-utils";
import { serialize } from "@/lib/serialize";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser();
    const status = req.nextUrl.searchParams.get("status");
    const marketplace = await prisma.job.findMany({
      where: {
        OR: [{ status: "Published" }, { status: "Funded", workerId: null }],
      },
      include: { client: true, worker: true },
      orderBy: { createdAt: "desc" },
    });
    if (!user) {
      return jsonOk({ jobs: serialize(marketplace) });
    }
    const jobs = await prisma.job.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        OR: [{ clientId: user.id }, { workerId: user.id }],
      },
      include: { client: true, worker: true },
      orderBy: { updatedAt: "desc" },
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
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const key = String(first?.path[0] ?? "input");
      const friendly: Record<string, string> = {
        title: "Title must be at least 3 characters",
        description: "Description must be at least 10 characters",
        amountMinor: "Enter a valid USDC amount greater than 0",
        checklist: "Add at least one acceptance criterion",
        deadlineAt: "Deadline is invalid — use a positive number of days",
      };
      return jsonError(friendly[key] ?? first?.message ?? "Invalid job details", 400);
    }
    const job = await prisma.job.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        amountMinor: BigInt(parsed.data.amountMinor),
        checklist: parsed.data.checklist,
        deadlineAt: parsed.data.deadlineAt ? new Date(parsed.data.deadlineAt) : null,
        clientId: user.id,
      },
    });
    await writeAuditLog({ userId: user.id, action: "create", entity: "Job", entityId: job.id });
    return jsonOk({ job: serialize(job) }, 201);
  } catch (e) {
    return handleRouteError(e);
  }
}
