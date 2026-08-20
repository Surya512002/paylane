"use client";

import Link from "next/link";
import { Wallet, ShieldCheck, LogOut } from "lucide-react";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { useWalletSession } from "@/components/WalletSession";

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletBar() {
  const w = useWalletSession();

  if (!w.mounted) {
    return (
      <button type="button" disabled className="btn-primary shrink-0 px-3 py-2 text-xs opacity-70 sm:text-sm">
        Connect
      </button>
    );
  }

  if (!w.isConnected) {
    return (
      <button type="button" onClick={() => void w.connectWallet()} disabled={w.busy} className="btn-primary shrink-0 gap-1.5 px-3 py-2 text-xs sm:text-sm">
        <Wallet className="h-3.5 w-3.5" />
        Connect wallet
      </button>
    );
  }

  if (w.wrongNetwork) {
    return (
      <button type="button" onClick={() => void w.switchToLive()} className="btn-primary shrink-0 px-3 py-2 text-xs sm:text-sm">
        Switch network
      </button>
    );
  }

  if (!w.session) {
    return (
      <button type="button" onClick={() => void w.signIn()} disabled={w.busy} className="btn-primary shrink-0 gap-1.5 px-3 py-2 text-xs sm:text-sm">
        <ShieldCheck className="h-3.5 w-3.5" />
        {w.busy ? "Signing…" : "Sign in"}
      </button>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1.5 text-xs sm:gap-2">
      <NotificationBell />
      <span className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 font-mono md:inline">
        {shortAddr(w.session.walletAddress)}
      </span>
      {w.session.isAdmin && (
        <Link href="/admin/disputes" className="font-semibold text-[var(--brand)]">
          Admin
        </Link>
      )}
      <button type="button" onClick={() => void w.signOut()} className="btn-ghost px-2 py-1 text-xs" title="Sign out">
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function WalletStatusStrip() {
  const w = useWalletSession();
  if (!w.mounted) return null;

  if (w.error) {
    return (
      <div className="border-b border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-2 text-center text-sm text-[var(--danger)]">
        {w.error}
      </div>
    );
  }

  if (!w.isConnected) {
    return (
      <div className="border-b border-[var(--border)] bg-[var(--brand-soft)]/80 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
        Connect a wallet, then sign in — Paylane escrow is live on Arc Testnet.
        <button type="button" className="ml-2 font-semibold text-[var(--brand-dark)] underline" onClick={() => void w.connectWallet()}>
          Connect
        </button>
      </div>
    );
  }

  if (w.wrongNetwork) {
    return (
      <div className="border-b border-amber-200 bg-[var(--warning-soft)] px-4 py-2 text-center text-sm text-amber-950">
        Wrong network. Switch to Arc Testnet.
        <button type="button" className="ml-2 font-semibold underline" onClick={() => void w.switchToLive()}>
          Switch now
        </button>
      </div>
    );
  }

  if (!w.session) {
    return (
      <div className="border-b border-[var(--border)] bg-[var(--accent-soft)]/80 px-4 py-2 text-center text-sm text-[var(--ink-soft)]">
        Wallet connected. Sign a message to open jobs, escrow, and receipts.
        <button type="button" className="ml-2 font-semibold text-[var(--accent-dark)] underline" onClick={() => void w.signIn()}>
          Sign in
        </button>
      </div>
    );
  }

  return null;
}

export function HeaderChain() {
  const w = useWalletSession();
  if (!w.mounted || !w.cfg) return null;
  return <ChainSwitcher chains={w.cfg.supportedChains} />;
}
