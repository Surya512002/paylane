"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageChrome";

type PublicCfg = {
  networkId: string;
  chainId: number;
  chainName: string;
  usdcAddress: string;
  escrowAddress: string | null;
  explorerUrl: string;
  faucetUrl: string | null;
  demoMode: boolean;
  platformFeeBps: number;
  reviewWindowHours: number;
  revisionLimit: number;
  disputeEvidenceHours: number;
};

export default function SettingsPage() {
  const [cfg, setCfg] = useState<PublicCfg | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
  }, []);

  if (!cfg) return <p className="text-[var(--muted)]">Loading network…</p>;

  async function copyEnv() {
    const text = [
      `NEXT_PUBLIC_NETWORK=${cfg!.networkId}`,
      `NEXT_PUBLIC_CHAIN_ID=${cfg!.chainId}`,
      `NEXT_PUBLIC_CHAIN_NAME=${cfg!.chainName}`,
      `NEXT_PUBLIC_USDC_ADDRESS=${cfg!.usdcAddress}`,
      `NEXT_PUBLIC_ESCROW_ADDRESS=${cfg!.escrowAddress ?? ""}`,
      `NEXT_PUBLIC_EXPLORER_URL=${cfg!.explorerUrl}`,
      `DEMO_MODE=${cfg!.demoMode}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PageHero
        eyebrow="Network"
        title="Settings & live status"
        subtitle="See whether Paylane is DEMO or LIVE on Arc, copy env snippets, and jump to deploy docs."
        imageSrc="/brand/paylane-hero-lanes.png"
        imageAlt=""
      />

      <div className="card space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Active network</h2>
          <span
            className={
              !cfg.demoMode && cfg.escrowAddress ? "badge badge-ok" : "badge badge-brand"
            }
          >
            {!cfg.demoMode && cfg.escrowAddress ? "LIVE" : cfg.chainName}
          </span>
        </div>
        <Row label="Mode" value={cfg.demoMode ? "DEMO (simulated escrow)" : "LIVE (on-chain)"} />
        <Row label="Chain ID" value={String(cfg.chainId)} />
        <Row label="USDC" value={cfg.usdcAddress} mono />
        <Row label="Escrow proxy" value={cfg.escrowAddress ?? "Not set — deploy with scripts/deploy-arc-testnet.sh"} mono />
        <a
          href={cfg.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block font-semibold text-[var(--brand)]"
        >
          Open Arcscan →
        </a>
        {cfg.faucetUrl && (
          <a
            href={cfg.faucetUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-4 inline-block font-semibold text-[var(--accent)]"
          >
            Circle faucet →
          </a>
        )}
        <button type="button" className="btn-secondary text-sm" onClick={copyEnv}>
          {copied ? "Copied" : "Copy env snippet"}
        </button>
      </div>

      <div className="card space-y-2 text-sm">
        <h2 className="font-display text-lg font-semibold">Money parameters</h2>
        <Row label="Platform fee" value={`${cfg.platformFeeBps / 100}%`} />
        <Row label="Review window" value={`${cfg.reviewWindowHours} hours`} />
        <Row label="Revision limit" value={String(cfg.revisionLimit)} />
        <Row label="Dispute evidence" value={`${cfg.disputeEvidenceHours} hours`} />
        <Link href="/docs/money-rules" className="font-semibold text-[var(--brand)]">
          Money rules →
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
      <span className="text-[var(--muted)]">{label}</span>
      <span className={mono ? "break-all font-mono text-xs" : "font-medium"}>{value}</span>
    </p>
  );
}
