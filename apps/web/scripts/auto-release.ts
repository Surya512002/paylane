import { prisma } from "@/lib/db";
import { runAutoReleaseCrank } from "@/lib/jobs/transitions";

async function main() {
  const results = await runAutoReleaseCrank();
  console.log(JSON.stringify({ processed: results.length, results }, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
