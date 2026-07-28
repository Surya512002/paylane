import {
  createPublicClient,
  http,
  decodeEventLog,
  type Hash,
  type Log,
} from "viem";
import { config, getChainConfig } from "./config";
import { chainPresetToViem, minorToChainUnits } from "./networks";
import { escrowAbi } from "./escrowAbi";

export { escrowAbi } from "./escrowAbi";

const clients = new Map<number, ReturnType<typeof createPublicClient>>();

export function getPublicClient(chainId = config.chainId) {
  let client = clients.get(chainId);
  if (!client) {
    const preset = getChainConfig(chainId);
    client = createPublicClient({
      chain: chainPresetToViem(preset),
      transport: http(preset.rpcUrl),
    });
    clients.set(chainId, client);
  }
  return client;
}

/** @deprecated use getPublicClient() */
export const publicClient = getPublicClient(config.chainId);

/** @deprecated use chainPresetToViem(getChainConfig()) */
export const arcChain = chainPresetToViem(config.activeChain);
export const arcTestnet = arcChain;

export function isAdminWallet(address: string): boolean {
  return config.adminWallets.includes(address.toLowerCase());
}

export async function verifyFundTx(
  txHash: Hash,
  expectedAmountMinor: bigint,
  chainId = config.chainId,
): Promise<{ ok: true; onchainJobId?: string } | { ok: false; reason: string }> {
  if (config.demoMode) return { ok: true };

  const chain = getChainConfig(chainId);
  if (!chain.escrowAddress) return { ok: false, reason: "Escrow not configured for this chain" };

  const client = getPublicClient(chainId);
  const expectedOnChain = minorToChainUnits(expectedAmountMinor, chain.usdcDecimals);

  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (receipt.status !== "success") return { ok: false as const, reason: "Tx failed" };
  if (receipt.to?.toLowerCase() !== chain.escrowAddress.toLowerCase()) {
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
        if (amount !== expectedOnChain) {
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
