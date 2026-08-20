"use client";

import { useEffect, useMemo, useState } from "react";
import { UsdcAmount } from "@/components/UsdcAmount";
import { EmptyState } from "@/components/EmptyState";
import { format } from "date-fns";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout } from "@/components/PageChrome";
import { Stagger, StaggerItem } from "@/components/motion";
import { formatPlatformFeePercent } from "@/lib/money";

type Receipt = {
  id: string;
  type: string;
  kind: string;
  amountMinor: string;
  feeMinor?: string;
  status: string;
  txHash?: string | null;
  settlementRef?: string | null;
  createdAt: string;
  job?: { title: string } | null;
};

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [explorer, setExplorer] = useState("https://testnet.arcscan.app");
  const [platformFeeBps, setPlatformFeeBps] = useState(10);
  const [typeFilter, setTypeFilter] = useState<"all" | "job" | "api">("all");

  useEffect(() => {
    Promise.all([
      fetch("/api/receipts").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]).then(([rec, cfg]) => {
      setReceipts(rec.receipts ?? []);
      if (cfg.explorerUrl) setExplorer(cfg.explorerUrl);
      if (cfg.platformFeeBps) setPlatformFeeBps(cfg.platformFeeBps);
    });
  }, []);

  const filtered = useMemo(
    () => receipts.filter((r) => typeFilter === "all" || r.type === typeFilter),
    [receipts, typeFilter],
  );

  const total = useMemo(
    () => filtered.reduce((s, r) => s + BigInt(r.amountMinor || "0"), 0n),
    [filtered],
  );

  return (
    <div className="space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Ledger"
        title="Receipts center"
        subtitle="Every escrow fund, release, refund, split, and API nanopayment in one dollar-first history. Live txs link to Arcscan."
        imageSrc="/brand/paylane-hero-lanes.png"
        imageAlt=""
        actions={
          <Link href="/docs/money-rules" className="btn-secondary text-sm">
            Money rules →
          </Link>
        }
      />

      <InfoCallout title="How to read this ledger" tone="brand">
        <p>
          <strong>job</strong> entries come from Mode A escrow. <strong>api</strong> entries come
          from Mode B paid calls. Platform fee on worker release is{" "}
          <strong>{formatPlatformFeePercent(platformFeeBps)}</strong>. Simulated demo hashes start
          with <code>demo:</code> — real Arc hashes open on the explorer.
        </p>
      </InfoCallout>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "job", "api"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={typeFilter === t ? "badge badge-brand" : "badge badge-muted"}
            >
              {t === "all" ? "All" : t === "job" ? "Jobs" : "API"}
            </button>
          ))}
        </div>
        <p className="text-sm font-semibold">
          Shown total: <UsdcAmount minor={total.toString()} />
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No ledger entries yet"
          description="Fund a job or pay an API to see receipts appear here."
        />
      ) : (
        <Stagger className="space-y-2">
          {filtered.map((r) => (
            <StaggerItem key={r.id}>
              <div className="card flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold capitalize text-[var(--ink)]">
                    {r.kind.replace(/_/g, " ")}
                    {r.job?.title ? ` · ${r.job.title}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {r.type.toUpperCase()} · {r.status} ·{" "}
                    {format(new Date(r.createdAt), "MMM d, yyyy HH:mm")}
                  </p>
                  {r.txHash && !r.txHash.startsWith("demo:") && (
                    <a
                      className="mt-1 inline-block text-xs font-medium text-[var(--brand)]"
                      href={`${explorer.replace(/\/$/, "")}/tx/${r.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on explorer →
                    </a>
                  )}
                  {r.txHash?.startsWith("demo:") && (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Simulated settlement ({r.txHash})
                    </p>
                  )}
                </div>
                <UsdcAmount minor={r.amountMinor} className="font-semibold" />
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
