"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { isSupportedChainId } from "@/lib/chain-client";
import { NotificationBell } from "@/components/NotificationBell";

type AppMode = "hire" | "api";

type PublicCfg = {
  chainName: string;
  networkId: string;
  demoMode: boolean;
  faucetUrl?: string | null;
  supportedChains: Array<{
    key: string;
    chainId: number;
    name: string;
    family: string;
    live: boolean;
  }>;
};

function useAppMode(): AppMode {
  const pathname = usePathname();
  return pathname.startsWith("/agents") ||
    pathname.startsWith("/api-seller") ||
    pathname.startsWith("/receipts")
    ? "api"
    : "hire";
}

export function Header() {
  const pathname = usePathname();
  const mode = useAppMode();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [session, setSession] = useState<{ walletAddress?: string; isAdmin?: boolean } | null>(null);
  const [cfg, setCfg] = useState<PublicCfg | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setSession(d.user))
      .catch(() => setSession(null));
  }, [address]);

  async function refreshMe() {
    const me = await fetch("/api/me").then((r) => r.json());
    setSession(me.user);
  }

  async function demoLogin(walletAddress: string) {
    await fetch("/api/auth/demo-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    });
    await refreshMe();
  }

  async function signIn() {
    if (!address) return;
    const supported = cfg?.supportedChains ?? [];
    const targetChainId =
      chainId && isSupportedChainId(chainId) ? chainId : supported[0]?.chainId;
    if (targetChainId != null && chainId !== targetChainId) {
      try {
        await switchChain({ chainId: targetChainId });
      } catch {
        /* user may reject; continue */
      }
    }
    const nonceRes = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, chainId: targetChainId ?? chainId }),
    });
    const { message } = await nonceRes.json();
    const sig = await (
      window as unknown as { ethereum?: { request: (a: unknown) => Promise<string> } }
    ).ethereum?.request({
      method: "personal_sign",
      params: [message, address],
    });
    if (!sig) return;
    await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature: sig }),
    });
    await refreshMe();
  }

  const hireLinks = [
    { href: "/jobs", label: "Jobs" },
    { href: "/jobs/new", label: "Post" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/receipts", label: "Receipts" },
    { href: "/settings", label: "Settings" },
  ];
  const apiLinks = [
    { href: "/api-seller", label: "Sell API" },
    { href: "/agents", label: "Agents" },
    { href: "/receipts", label: "Receipts" },
    { href: "/settings", label: "Settings" },
  ];
  const links = mode === "api" ? apiLinks : hireLinks;
  const supported = cfg?.supportedChains ?? [];
  const wrongNetwork =
    isConnected && chainId != null && supported.length > 0 && !isSupportedChainId(chainId);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-5">
          <Link href="/" className="group flex items-center gap-2">
            <span className="lane-rail lane-animated h-7 w-7 rounded-lg" aria-hidden />
            <span className="font-display text-xl font-bold tracking-tight text-[var(--ink)]">
              Paylane
            </span>
          </Link>
          <nav className="hidden items-center gap-1 text-sm md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-lg px-2.5 py-1.5 transition",
                  pathname.startsWith(l.href)
                    ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-dark)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]",
                )}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/docs"
              className={clsx(
                "rounded-lg px-2.5 py-1.5 transition",
                pathname.startsWith("/docs")
                  ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-dark)]"
                  : "text-[var(--muted)] hover:text-[var(--ink)]",
              )}
            >
              Docs
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5 text-xs sm:flex">
            <Link
              href="/jobs"
              className={clsx(
                "rounded-full px-3 py-1.5 font-medium",
                mode === "hire" && "bg-[var(--ink)] text-white",
              )}
            >
              Hire / Work
            </Link>
            <Link
              href="/agents"
              className={clsx(
                "rounded-full px-3 py-1.5 font-medium",
                mode === "api" && "bg-[var(--ink)] text-white",
              )}
            >
              API / Agents
            </Link>
          </div>

          {cfg && (
            <ChainSwitcher chains={cfg.supportedChains} />
          )}

          {wrongNetwork && supported[0] && (
            <button
              type="button"
              className="badge badge-warn sm:hidden"
              onClick={() => switchChain({ chainId: supported[0].chainId })}
            >
              Switch network
            </button>
          )}

          {cfg?.demoMode && !session && (
            <select
              className="max-w-[8.5rem] rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) void demoLogin(e.target.value);
              }}
              aria-label="Demo role login"
            >
              <option value="" disabled>
                Quick login
              </option>
              <option value="0x1111111111111111111111111111111111111111">Client</option>
              <option value="0x2222222222222222222222222222222222222222">Worker</option>
              <option value="0x3333333333333333333333333333333333333333">Seller</option>
              <option value="0x4444444444444444444444444444444444444444">Buyer</option>
              <option value="0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">Admin</option>
            </select>
          )}

          {!isConnected ? (
            <button
              type="button"
              onClick={() => connect({ connector: connectors[0] })}
              disabled={isPending}
              className="btn-primary text-sm"
            >
              Connect wallet
            </button>
          ) : !session ? (
            <button type="button" onClick={signIn} className="btn-primary text-sm">
              Sign in
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <NotificationBell />
              <span className="hidden rounded-lg bg-[var(--surface-2)] px-2 py-1 font-mono sm:inline">
                {session.walletAddress?.slice(0, 6)}…{session.walletAddress?.slice(-4)}
              </span>
              {session.isAdmin && (
                <Link href="/admin/disputes" className="font-semibold text-[var(--brand)]">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  fetch("/api/auth/logout", { method: "POST" });
                  disconnect();
                  setSession(null);
                }}
                className="btn-ghost text-xs"
              >
                Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
