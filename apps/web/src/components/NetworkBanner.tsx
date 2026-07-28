"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Cfg = {
  chainName: string;
  demoMode: boolean;
  escrowAddress: string | null;
  platformFeeBps: number;
  reviewWindowHours: number;
};

export function NetworkBanner() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => null);
  }, []);
  if (!cfg) return null;
  const live = !cfg.demoMode && Boolean(cfg.escrowAddress);
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${
        live
          ? "border-[var(--accent)]/30 bg-[var(--accent-soft)]/50"
          : "border-[var(--brand)]/20 bg-[var(--brand-soft)]/40"
      }`}
    >
      <p>
        <span className="font-semibold">{cfg.chainName}</span>
        {" · "}
        {live ? "Live on-chain escrow" : "Demo / simulated escrow"}
        {" · "}
        fee {(cfg.platformFeeBps / 100).toFixed(1)}% · review {cfg.reviewWindowHours}h
      </p>
      <Link href="/settings" className="font-semibold text-[var(--brand-dark)]">
        Settings →
      </Link>
    </div>
  );
}
