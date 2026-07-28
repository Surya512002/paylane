"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { ChainSwitcher } from "@/components/ChainSwitcher";
import { MobileNav } from "@/components/MobileNav";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  function renderWalletActions() {
    if (!mounted) {
      return (
        <button type="button" disabled className="btn-primary shrink-0 px-3 py-2 text-xs opacity-70 sm:px-4 sm:py-2.5 sm:text-sm">
          <span className="sm:hidden">Connect</span>
          <span className="hidden sm:inline">Connect wallet</span>
        </button>
      );
    }

    if (!isConnected) {
      return (
        <button
          type="button"
          onClick={() => connect({ connector: connectors[0] })}
          disabled={isPending}
          className="btn-primary shrink-0 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
        >
          <span className="sm:hidden">Connect</span>
          <span className="hidden sm:inline">Connect wallet</span>
        </button>
      );
    }

    if (!session) {
      return (
        <button
          type="button"
          onClick={signIn}
          className="btn-primary shrink-0 px-3 py-2 text-xs sm:px-4 sm:py-2.5 sm:text-sm"
        >
          Sign in
        </button>
      );
    }

    return (
      <div className="flex shrink-0 items-center gap-1.5 text-xs sm:gap-2">
        <NotificationBell />
        <span className="hidden rounded-lg bg-[var(--surface-2)] px-2 py-1 font-mono md:inline">
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
          className="btn-ghost px-2 py-1 text-xs"
        >
          Out
        </button>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="relative mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <MobileNav
            links={links}
            mode={mode}
            extra={
              mounted && cfg ? (
                <div className="border-t border-[var(--border)] pt-3 sm:hidden">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Network
                  </p>
                  <ChainSwitcher chains={cfg.supportedChains} />
                </div>
              ) : null
            }
          />
          <Link href="/" className="group flex min-w-0 shrink items-center gap-2">
            <span className="lane-rail lane-animated h-7 w-7 shrink-0 rounded-lg" aria-hidden />
            <span className="font-display truncate text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
              Paylane
            </span>
          </Link>
          <nav className="hidden min-w-0 items-center gap-1 text-sm lg:flex">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5 text-xs lg:flex">
            <Link
              href="/jobs"
              className={clsx(
                "rounded-full px-2.5 py-1.5 font-medium",
                mode === "hire" && "bg-[var(--ink)] text-white",
              )}
            >
              Hire / Work
            </Link>
            <Link
              href="/agents"
              className={clsx(
                "rounded-full px-2.5 py-1.5 font-medium",
                mode === "api" && "bg-[var(--ink)] text-white",
              )}
            >
              API / Agents
            </Link>
          </div>

          {mounted && cfg && (
            <div className="hidden sm:block">
              <ChainSwitcher chains={cfg.supportedChains} />
            </div>
          )}

          {cfg?.demoMode && !session && (
            <select
              className="hidden max-w-[7.5rem] rounded-lg border border-[var(--border)] bg-transparent px-2 py-1.5 text-xs md:block"
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

          {renderWalletActions()}
        </div>
      </div>
    </header>
  );
}
