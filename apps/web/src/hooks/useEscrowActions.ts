"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
} from "wagmi";
import { keccak256, stringToHex, encodeEventTopics, decodeEventLog, type Hash } from "viem";
import { escrowAbi, erc20Abi } from "@/lib/escrowAbi";
import { minorToChainUnits } from "@/lib/networks";

type Cfg = {
  escrowAddress: `0x${string}` | null;
  usdcAddress: `0x${string}`;
  usdcDecimals: number;
  demoMode: boolean;
};

export function useEscrowActions(cfg: Cfg | null) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [pending, setPending] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<Hash | undefined>();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash: lastHash });

  const ensureLive = useCallback(() => {
    if (!cfg?.escrowAddress) throw new Error("Escrow not deployed — set NEXT_PUBLIC_ESCROW_ADDRESS");
    if (!address) throw new Error("Connect wallet first");
    return { escrow: cfg.escrowAddress, usdc: cfg.usdcAddress, account: address };
  }, [cfg, address]);

  const fundOnchain = useCallback(
    async (params: {
      jobDbId: string;
      amountMinor: bigint;
      worker?: `0x${string}`;
      deadlineUnix?: number;
    }) => {
      if (cfg?.demoMode) {
        return { mode: "demo" as const };
      }
      if (!cfg?.escrowAddress) {
        throw new Error(
          "No Paylane escrow on this network. Switch to Arc Testnet or Base Sepolia in the header.",
        );
      }
      const { escrow, usdc, account } = ensureLive();
      if (!publicClient) throw new Error("RPC not ready");

      const onChainAmount = minorToChainUnits(params.amountMinor, cfg!.usdcDecimals);

      setPending("Approving USDC…");
      const approveHash = await writeContractAsync({
        address: usdc,
        abi: erc20Abi,
        functionName: "approve",
        args: [escrow, onChainAmount],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      setPending("Creating on-chain job…");
      const jobRef = keccak256(stringToHex(params.jobDbId));
      const createHash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "createJob",
        args: [
          jobRef,
          params.worker ?? "0x0000000000000000000000000000000000000000",
          onChainAmount,
          BigInt(params.deadlineUnix ?? 0),
        ],
      });
      const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

      let onchainJobId: bigint | null = null;
      const topic = encodeEventTopics({
        abi: escrowAbi,
        eventName: "JobCreated",
      })[0];
      for (const log of createReceipt.logs) {
        if (log.topics[0] !== topic) continue;
        try {
          const decoded = decodeEventLog({
            abi: escrowAbi,
            data: log.data,
            topics: log.topics,
          });
          if (decoded.eventName === "JobCreated") {
            onchainJobId = decoded.args.jobId as bigint;
            break;
          }
        } catch {
          /* skip */
        }
      }
      if (onchainJobId == null) throw new Error("Could not parse JobCreated jobId");

      setPending("Funding escrow…");
      const fundHash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "fundJob",
        args: [onchainJobId],
      });
      setLastHash(fundHash);
      await publicClient.waitForTransactionReceipt({ hash: fundHash });
      setPending(null);

      return {
        mode: "live" as const,
        txHash: fundHash,
        onchainJobId: onchainJobId.toString(),
        account,
      };
    },
    [cfg, ensureLive, publicClient, writeContractAsync],
  );

  const acceptOnchain = useCallback(
    async (onchainJobId: string) => {
      if (cfg?.demoMode) return { mode: "demo" as const };
      if (!cfg?.escrowAddress) {
        throw new Error("No Paylane escrow on this network. Switch chain in the header.");
      }
      const { escrow } = ensureLive();
      if (!publicClient) throw new Error("RPC not ready");
      setPending("Releasing to worker…");
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "accept",
        args: [BigInt(onchainJobId)],
      });
      setLastHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setPending(null);
      return { mode: "live" as const, txHash: hash };
    },
    [cfg, ensureLive, publicClient, writeContractAsync],
  );

  const assignOnchain = useCallback(
    async (onchainJobId: string, worker: `0x${string}`) => {
      if (cfg?.demoMode) return { mode: "demo" as const };
      if (!cfg?.escrowAddress) {
        throw new Error("No Paylane escrow on this network. Switch chain in the header.");
      }
      const { escrow } = ensureLive();
      if (!publicClient) throw new Error("RPC not ready");
      setPending("Assigning worker on-chain…");
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "assignWorker",
        args: [BigInt(onchainJobId), worker],
      });
      setLastHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setPending(null);
      return { mode: "live" as const, txHash: hash };
    },
    [cfg, ensureLive, publicClient, writeContractAsync],
  );

  const deliverOnchain = useCallback(
    async (onchainJobId: string, note: string) => {
      if (cfg?.demoMode) return { mode: "demo" as const };
      if (!cfg?.escrowAddress) {
        throw new Error("No Paylane escrow on this network. Switch chain in the header.");
      }
      const { escrow } = ensureLive();
      if (!publicClient) throw new Error("RPC not ready");
      setPending("Marking delivered on-chain…");
      const hash = await writeContractAsync({
        address: escrow,
        abi: escrowAbi,
        functionName: "markDelivered",
        args: [BigInt(onchainJobId), keccak256(stringToHex(note))],
      });
      setLastHash(hash);
      await publicClient.waitForTransactionReceipt({ hash });
      setPending(null);
      return { mode: "live" as const, txHash: hash, deliveryHash: keccak256(stringToHex(note)) };
    },
    [cfg, ensureLive, publicClient, writeContractAsync],
  );

  return {
    fundOnchain,
    assignOnchain,
    acceptOnchain,
    deliverOnchain,
    pending,
    confirming,
    address,
  };
}
