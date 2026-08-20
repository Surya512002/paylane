"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { MobileNav } from "@/components/MobileNav";
import { HeaderChain, WalletBar } from "@/components/WalletBar";
import { useWalletSession } from "@/components/WalletSession";

type AppMode = "hire" | "api";

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
  const w = useWalletSession();

  const hireLinks = [
    { href: "/jobs", label: "Jobs" },
    { href: "/jobs/new", label: "Post" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/receipts", label: "Ledger" },
    { href: "/trust", label: "Trust" },
  ];
  const apiLinks = [
    { href: "/api-seller", label: "Sell API" },
    { href: "/agents", label: "Agents" },
    { href: "/receipts", label: "Ledger" },
    { href: "/settings", label: "Settings" },
  ];
  const links = mode === "api" ? apiLinks : hireLinks;

  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="relative mx-auto flex w-full max-w-7xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <MobileNav
            links={links}
            mode={mode}
            extra={
              w.mounted && w.cfg ? (
                <div className="border-t border-[var(--border)] pt-3 sm:hidden">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Network
                  </p>
                  <HeaderChain />
                </div>
              ) : null
            }
          />
          <Link href="/" className="group flex min-w-0 shrink items-center gap-2">
            <span className="lane-rail lane-animated h-7 w-7 shrink-0 rounded-lg" aria-hidden />
            <span className="font-display truncate text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
              Paylane
            </span>
            <span className="hidden rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent-dark)] sm:inline">
              Live testnet
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
                    ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-dark)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
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
          <div className="hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-0.5 text-xs shadow-[var(--shadow-xs)] lg:flex">
            <Link
              href="/jobs"
              className={clsx(
                "rounded-full px-2.5 py-1.5 font-medium transition",
                mode === "hire" && "bg-[var(--ink)] text-white shadow-[var(--shadow-xs)]",
              )}
            >
              Hire / Work
            </Link>
            <Link
              href="/agents"
              className={clsx(
                "rounded-full px-2.5 py-1.5 font-medium transition",
                mode === "api" && "bg-[var(--ink)] text-white shadow-[var(--shadow-xs)]",
              )}
            >
              API / Agents
            </Link>
          </div>
          <div className="hidden sm:block">
            <HeaderChain />
          </div>
          <WalletBar />
        </div>
      </div>
    </header>
  );
}
