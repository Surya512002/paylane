"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { supportedChains, wagmiTransports } from "@/lib/chain-client";
import { useState, type ReactNode } from "react";

const wagmiConfig = createConfig({
  chains: [...supportedChains],
  connectors: [injected()],
  transports: wagmiTransports,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
