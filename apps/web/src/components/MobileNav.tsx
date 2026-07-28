"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function MobileNav({ links }: { links: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        className="rounded-lg border border-[var(--border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink-soft)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open menu"
      >
        Menu
      </button>
      {open && (
        <nav className="absolute left-0 right-0 top-full z-50 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-lg">
          <ul className="grid gap-1 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={clsx(
                    "block rounded-lg px-3 py-2",
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
                  "block rounded-lg px-3 py-2",
                  pathname.startsWith("/docs")
                    ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-dark)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]",
                )}
              >
                Docs
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
