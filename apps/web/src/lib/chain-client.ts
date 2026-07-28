import { defineChain } from "viem";

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 5042002);
const name = process.env.NEXT_PUBLIC_CHAIN_NAME ??
  ((process.env.NEXT_PUBLIC_NETWORK ?? "testnet") === "mainnet" ? "Arc" : "Arc Testnet");
const rpc = process.env.NEXT_PUBLIC_ARC_RPC ?? "https://rpc.testnet.arc.network";
const explorer = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "https://testnet.arcscan.app";

/** Active Arc chain for wagmi — driven entirely by env / NEXT_PUBLIC_NETWORK. */
export const arcChain = defineChain({
  id: chainId,
  name,
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: [rpc] },
  },
  blockExplorers: {
    default: { name: "Arcscan", url: explorer },
  },
});

/** @deprecated use arcChain */
export const arcTestnet = arcChain;
