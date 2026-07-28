import { prisma } from "./db";

export async function notifyUser(params: {
  userId: string;
  title: string;
  body: string;
  href?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      body: params.body,
      href: params.href,
    },
  });
}
