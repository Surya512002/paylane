import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonOk, handleRouteError } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    const unread = notifications.filter((n) => !n.read).length;
    return jsonOk({ notifications, unread });
  } catch (e) {
    return handleRouteError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true },
      });
    } else if (body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: user.id },
        data: { read: true },
      });
    }
    return jsonOk({ ok: true });
  } catch (e) {
    return handleRouteError(e);
  }
}
