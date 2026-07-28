import { PrismaClient, JobStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const client = await prisma.user.upsert({
    where: { walletAddress: "0x1111111111111111111111111111111111111111" },
    create: { walletAddress: "0x1111111111111111111111111111111111111111", displayName: "Demo Client" },
    update: {},
  });
  const worker = await prisma.user.upsert({
    where: { walletAddress: "0x2222222222222222222222222222222222222222" },
    create: { walletAddress: "0x2222222222222222222222222222222222222222", displayName: "Demo Worker" },
    update: {},
  });
  const seller = await prisma.user.upsert({
    where: { walletAddress: "0x3333333333333333333333333333333333333333" },
    create: { walletAddress: "0x3333333333333333333333333333333333333333", displayName: "Demo Seller" },
    update: {},
  });
  const buyer = await prisma.user.upsert({
    where: { walletAddress: "0x4444444444444444444444444444444444444444" },
    create: { walletAddress: "0x4444444444444444444444444444444444444444", displayName: "Demo Buyer" },
    update: {},
  });
  const admin = await prisma.user.upsert({
    where: { walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    create: {
      walletAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      displayName: "Demo Admin",
      isAdmin: true,
    },
    update: { isAdmin: true },
  });

  await prisma.job.upsert({
    where: { id: "seed-job-demo" },
    create: {
      id: "seed-job-demo",
      title: "Landing page redesign",
      description: "Refresh marketing landing with mobile-first layout and USDC pricing copy.",
      amountMinor: 150_000000n,
      status: JobStatus.Published,
      checklist: ["Responsive layout", "Accessibility pass", "Handoff in Figma"],
      clientId: client.id,
    },
    update: {},
  });

  await prisma.paidResource.upsert({
    where: { path: "/api/demo/paid-weather" },
    create: {
      sellerId: seller.id,
      name: "Paid Weather",
      path: "/api/demo/paid-weather",
      description: "Demo x402 weather endpoint ($0.01 USDC per call)",
      priceMinor: 10_000n,
      rateLimitPerMinute: 120,
    },
    update: { enabled: true },
  });

  await prisma.agentPolicy.upsert({
    where: { userId: buyer.id },
    create: {
      userId: buyer.id,
      dailySpendCapMinor: 5_000000n,
      allowlistedHosts: ["localhost", "127.0.0.1"],
      paused: false,
    },
    update: {},
  });

  console.log("Seed complete:", { client: client.id, worker: worker.id, seller: seller.id, buyer: buyer.id, admin: admin.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
