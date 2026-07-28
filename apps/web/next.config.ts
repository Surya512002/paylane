import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@workpay/shared"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    turbo: {
      resolveAlias: {
        "@workpay/shared": "../../packages/shared/src/index.ts",
      },
    },
  },
};

export default nextConfig;
