import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

export async function writeAuditLog(params: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  return prisma.auditLog.create({
    data: {
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: (params.meta ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
