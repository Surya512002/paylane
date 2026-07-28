import { http, type Chain } from "viem";
import {
  resolveActiveChain,
  resolveSupportedChains,
  chainPresetToViem,
} from "./networks";

export const activeChainPreset = resolveActiveChain();
export const supportedChainPresets = resolveSupportedChains();

export const supportedChains: readonly Chain[] = supportedChainPresets.map(chainPresetToViem);
export const activeChain: Chain = chainPresetToViem(activeChainPreset);

/** @deprecated use activeChain */
export const arcChain = activeChain;
/** @deprecated use activeChain */
export const arcTestnet = activeChain;

export function buildWagmiTransports(chains: readonly Chain[]) {
  return Object.fromEntries(
    chains.map((c) => {
      const preset = supportedChainPresets.find((p) => p.chainId === c.id);
      return [c.id, http(preset?.rpcUrl ?? c.rpcUrls.default.http[0])];
    }),
  );
}

export const wagmiTransports = buildWagmiTransports(supportedChains);

export function isSupportedChainId(chainId: number | undefined): boolean {
  if (chainId == null) return false;
  return supportedChains.some((c) => c.id === chainId);
}
