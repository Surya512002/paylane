"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { wagmiChains, wagmiTransports } from "@/lib/chain-client";
import { useState, type ReactNode } from "react";
import { WalletSessionProvider } from "@/components/WalletSession";

const wagmiConfig = createConfig({
  chains: wagmiChains,
  connectors: [injected({ shimDisconnect: true })],
  transports: wagmiTransports,
  ssr: true,
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <WalletSessionProvider>{children}</WalletSessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
