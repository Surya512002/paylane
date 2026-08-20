"use client";

import { useWalletSession } from "@/components/WalletSession";

export function SessionGate({
  title = "Sign in to continue",
  description = "Connect your wallet on Arc Testnet, then sign the SIWE message. Escrow is on-chain.",
}: {
  title?: string;
  description?: string;
}) {
  const w = useWalletSession();
  if (w.ready) return null;

  return (
    <div className="empty-state">
      <div className="mx-auto mb-4 h-10 w-10 rounded-xl lane-rail" aria-hidden />
      <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">{description}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {!w.isConnected ? (
          <button type="button" className="btn-primary" onClick={() => void w.connectWallet()}>
            Connect wallet
          </button>
        ) : w.wrongNetwork ? (
          <button type="button" className="btn-primary" onClick={() => void w.switchToLive()}>
            Switch to testnet
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={() => void w.signIn()}>
            Sign in with wallet
          </button>
        )}
      </div>
    </div>
  );
}
