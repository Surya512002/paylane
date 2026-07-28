"use client";

import { useAccount, useSwitchChain } from "wagmi";
import clsx from "clsx";
import { isSupportedChainId, supportedChainPresets } from "@/lib/chain-client";

type ChainOption = {
  key: string;
  chainId: number;
  name: string;
  family: string;
  live: boolean;
};

function shortName(name: string) {
  return name.replace(" Testnet", "").replace(" Sepolia", "").replace(" Mainnet", "");
}

export function ChainSwitcher({
  chains,
  compact,
}: {
  chains: ChainOption[];
  compact?: boolean;
}) {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || chains.length <= 1) {
    const label = chains.find((c) => c.chainId === chainId)?.name ?? chains[0]?.name;
    if (!label) return null;
    return (
      <span
        className={clsx("badge hidden sm:inline-flex", compact ? "badge-brand" : "badge-brand")}
        title={`Chain ID ${chainId ?? chains[0]?.chainId}`}
      >
        {shortName(label)}
      </span>
    );
  }

  const wrongNetwork = chainId != null && !isSupportedChainId(chainId);
  const selectValue = wrongNetwork ? "" : String(chainId ?? "");

  return (
    <select
      className={clsx(
        "max-w-[6.5rem] shrink truncate rounded-lg border bg-transparent px-2 py-1.5 text-xs font-medium sm:max-w-[8.5rem]",
        wrongNetwork
          ? "border-amber-400 text-amber-900"
          : "border-[var(--border)] text-[var(--ink-soft)]",
      )}
      value={selectValue}
      disabled={isPending}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) switchChain({ chainId: next });
      }}
      aria-label={wrongNetwork ? "Wrong network — pick Arc or Base" : "Select network"}
    >
      {wrongNetwork && (
        <option value="" disabled>
          Wrong network
        </option>
      )}
      {!chainId && !wrongNetwork && <option value="">Network…</option>}
      {chains.map((c) => (
        <option key={c.key} value={c.chainId}>
          {shortName(c.name)}
          {c.live ? " · live" : ""}
        </option>
      ))}
    </select>
  );
}

export function resolveWalletChainConfig(
  chainId: number | undefined,
  apiChains: ChainOption[],
) {
  if (chainId == null) return null;
  const match = apiChains.find((c) => c.chainId === chainId);
  if (!match) return null;
  const preset = supportedChainPresets.find((p) => p.chainId === chainId);
  if (!preset) return null;
  return {
    chainId,
    chainKey: match.key,
    escrowAddress: preset.escrowAddress ?? null,
    usdcAddress: preset.usdcAddress,
    usdcDecimals: preset.usdcDecimals,
    explorerUrl: preset.explorerUrl,
    explorerName: preset.explorerName,
  };
}
