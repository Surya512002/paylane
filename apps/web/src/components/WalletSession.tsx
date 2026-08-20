"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";
import { isSupportedChainId } from "@/lib/chain-client";

export type PublicCfg = {
  chainName: string;
  networkId: string;
  chainId?: number;
  demoMode: boolean;
  faucetUrl?: string | null;
  explorerName?: string;
  escrowAddress?: string | null;
  supportedChains: Array<{
    key: string;
    chainId: number;
    name: string;
    family: string;
    live: boolean;
    escrowAddress?: string | null;
    faucetUrl?: string | null;
  }>;
};

type Session = { id?: string; walletAddress?: string; isAdmin?: boolean } | null;

type WalletSessionValue = {
  mounted: boolean;
  cfg: PublicCfg | null;
  session: Session;
  address?: `0x${string}`;
  isConnected: boolean;
  chainId?: number;
  wrongNetwork: boolean;
  ready: boolean;
  busy: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  switchToLive: () => Promise<number>;
  refreshMe: () => Promise<void>;
};

const WalletSessionContext = createContext<WalletSessionValue | null>(null);

export function WalletSessionProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { signMessageAsync } = useSignMessage();
  const [session, setSession] = useState<Session>(null);
  const [cfg, setCfg] = useState<PublicCfg | null>(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshMe = useCallback(async () => {
    const me = await fetch("/api/me").then((r) => r.json());
    setSession(me.user ?? null);
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  useEffect(() => {
    refreshMe().catch(() => setSession(null));
  }, [address, refreshMe]);

  const wrongNetwork = Boolean(isConnected && chainId != null && !isSupportedChainId(chainId));
  const ready = Boolean(isConnected && session && !wrongNetwork);

  const switchToLive = useCallback(async () => {
    const supported = cfg?.supportedChains ?? [];
    const target =
      chainId && isSupportedChainId(chainId) ? chainId : supported[0]?.chainId ?? 5042002;
    if (chainId !== target) {
      await switchChainAsync({ chainId: target });
    }
    return target;
  }, [cfg, chainId, switchChainAsync]);

  const connectWallet = useCallback(async () => {
    setError(null);
    try {
      if (typeof window !== "undefined" && !(window as { ethereum?: unknown }).ethereum) {
        setError("Install MetaMask (or another injected wallet), then refresh.");
        window.open("https://metamask.io/download/", "_blank");
        return;
      }
      const connector = connectors[0];
      if (!connector) {
        setError("No wallet connector found.");
        return;
      }
      await connectAsync({ connector });
    } catch (e) {
      setError((e as Error).message?.replace("User rejected the request.", "Wallet request was rejected.") ?? "Could not connect");
    }
  }, [connectAsync, connectors]);

  const signIn = useCallback(async () => {
    if (!address) {
      setError("Connect a wallet first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let targetChainId = chainId;
      if (wrongNetwork || targetChainId == null) {
        targetChainId = await switchToLive();
      }
      const nonceRes = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, chainId: targetChainId }),
      });
      const nonceBody = await nonceRes.json();
      if (!nonceRes.ok || !nonceBody.message) {
        throw new Error(nonceBody.error ?? "Could not start sign-in");
      }
      const signature = await signMessageAsync({ message: nonceBody.message });
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: nonceBody.message, signature }),
      });
      const verifyBody = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyBody.error ?? "Sign-in failed");
      }
      await refreshMe();
    } catch (e) {
      const msg = (e as Error).message ?? "Sign-in failed";
      setError(msg.includes("User rejected") ? "Signature was rejected in the wallet." : msg);
    } finally {
      setBusy(false);
    }
  }, [address, chainId, wrongNetwork, switchToLive, signMessageAsync, refreshMe]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    disconnect();
    setSession(null);
  }, [disconnect]);

  const value = useMemo(
    () => ({
      mounted,
      cfg,
      session,
      address,
      isConnected,
      chainId,
      wrongNetwork,
      ready,
      busy: busy || isPending,
      error,
      connectWallet,
      signIn,
      signOut,
      switchToLive,
      refreshMe,
    }),
    [
      mounted,
      cfg,
      session,
      address,
      isConnected,
      chainId,
      wrongNetwork,
      ready,
      busy,
      isPending,
      error,
      connectWallet,
      signIn,
      signOut,
      switchToLive,
      refreshMe,
    ],
  );

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
}

export function useWalletSession() {
  const ctx = useContext(WalletSessionContext);
  if (!ctx) throw new Error("useWalletSession must be used inside WalletSessionProvider");
  return ctx;
}
