"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";

export function MobileNav({
  links,
  mode,
  extra,
}: {
  links: Array<{ href: string; label: string }>;
  mode?: "hire" | "api";
  extra?: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink-soft)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <span className="sr-only">{open ? "Close" : "Menu"}</span>
        <span aria-hidden className="font-display text-lg leading-none">
          {open ? "×" : "☰"}
        </span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[var(--ink)]/35 backdrop-blur-[2px]"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute left-0 right-0 top-full z-50 max-h-[min(70vh,28rem)] overflow-y-auto border-b border-[var(--border)] bg-[var(--glass)] px-4 py-3 shadow-[var(--shadow)] backdrop-blur-xl">
            <div className="mb-3 grid grid-cols-2 gap-2 sm:hidden">
              <Link
                href="/jobs"
                className={clsx(
                  "rounded-xl border px-3 py-2 text-center text-xs font-semibold",
                  mode === "hire"
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--border)] text-[var(--ink-soft)]",
                )}
              >
                Hire / Work
              </Link>
              <Link
                href="/agents"
                className={clsx(
                  "rounded-xl border px-3 py-2 text-center text-xs font-semibold",
                  mode === "api"
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : "border-[var(--border)] text-[var(--ink-soft)]",
                )}
              >
                API / Agents
              </Link>
            </div>
            <ul className="grid gap-1 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={clsx(
                      "block rounded-lg px-3 py-2.5",
                      pathname.startsWith(l.href)
                        ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-dark)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/docs"
                  className={clsx(
                    "block rounded-lg px-3 py-2.5",
                    pathname.startsWith("/docs")
                      ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-dark)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                  )}
                >
                  Docs
                </Link>
              </li>
            </ul>
            {extra}
          </nav>
        </>
      )}
    </div>
  );
}
