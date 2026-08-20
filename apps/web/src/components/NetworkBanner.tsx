"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/motion";
import { formatPlatformFeePercent } from "@/lib/money";

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
    <Reveal className="mb-6">
      <div
        data-live={live ? "true" : "false"}
        className="network-banner flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
      >
        <p className="text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--ink)]">{cfg.chainName}</span>
          {" · "}
          {live ? "Live on-chain escrow" : "Demo / simulated escrow"}
          {" · "}
          fee {formatPlatformFeePercent(cfg.platformFeeBps)} · review {cfg.reviewWindowHours}h
        </p>
        <Link href="/settings" className="font-semibold text-[var(--brand-dark)] transition hover:underline">
          Settings →
        </Link>
      </div>
    </Reveal>
  );
}
