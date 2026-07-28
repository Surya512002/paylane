"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { arcChain } from "@/lib/chain-client";
import { useState, type ReactNode } from "react";

const wagmiConfig = createConfig({
  chains: [arcChain],
  connectors: [injected()],
  transports: { [arcChain.id]: http(arcChain.rpcUrls.default.http[0]) },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
