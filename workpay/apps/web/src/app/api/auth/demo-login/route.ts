import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { getSession } from "@/lib/auth";
import { jsonOk, handleRouteError } from "@/lib/api-utils";

const bodySchema = z.object({
  walletAddress: z.string().min(10),
});

/** DEMO_MODE only — session without SIWE for Arc testnet walkthroughs. */
export async function POST(req: NextRequest) {
  try {
    if (!config.demoMode) {
      return jsonOk({ error: "Demo login disabled" }, 403);
    }
    const { walletAddress } = bodySchema.parse(await req.json());
    const wallet = walletAddress.toLowerCase();
    const user = await prisma.user.upsert({
      where: { walletAddress: wallet },
      create: {
        walletAddress: wallet,
        isAdmin: config.adminWallets.includes(wallet),
      },
      update: {},
    });
    const session = await getSession();
    session.userId = user.id;
    session.walletAddress = user.walletAddress;
    session.isAdmin = user.isAdmin;
    await session.save();
    return jsonOk({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
        isAdmin: user.isAdmin,
      },
    });
  } catch (e) {
    return handleRouteError(e);
  }
}
