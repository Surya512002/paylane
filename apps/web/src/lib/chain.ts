import {
  createPublicClient,
  defineChain,
  http,
  decodeEventLog,
  type Hash,
  type Log,
} from "viem";
import { config } from "./config";
import { escrowAbi } from "./escrowAbi";

export const arcChain = defineChain({
  id: config.chainId,
  name: config.chainName,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [config.arcRpc] } },
  blockExplorers: { default: { name: "Arcscan", url: config.explorerUrl } },
});

export const arcTestnet = arcChain;

export const publicClient = createPublicClient({
  chain: arcChain,
  transport: http(config.arcRpc),
});

export { escrowAbi } from "./escrowAbi";

export function isAdminWallet(address: string): boolean {
  return config.adminWallets.includes(address.toLowerCase());
}

export async function verifyFundTx(txHash: Hash, expectedAmount: bigint): Promise<
  { ok: true; onchainJobId?: string } | { ok: false; reason: string }
> {
  if (config.demoMode) return { ok: true };
  if (!config.escrowAddress) return { ok: false, reason: "Escrow not configured" };

  const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") return { ok: false as const, reason: "Tx failed" };
  if (receipt.to?.toLowerCase() !== config.escrowAddress.toLowerCase()) {
    return { ok: false as const, reason: "Tx not sent to Paylane escrow" };
  }

  for (const log of receipt.logs as Log[]) {
    try {
      const decoded = decodeEventLog({
        abi: escrowAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === "JobFunded") {
        const amount = decoded.args.amount as bigint;
        if (amount !== expectedAmount) {
          return { ok: false as const, reason: "Funded amount mismatch" };
        }
        return {
          ok: true as const,
          onchainJobId: (decoded.args.jobId as bigint).toString(),
        };
      }
    } catch {
      /* not our event */
    }
  }

  return { ok: false as const, reason: "JobFunded event not found" };
}
