"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHero } from "@/components/PageChrome";

type ChainRow = {
  key: string;
  chainId: number;
  name: string;
  family: string;
  usdcAddress: string;
  escrowAddress: string | null;
  explorerUrl: string;
  explorerName: string;
  faucetUrl: string | null;
  live: boolean;
  isTestnet: boolean;
};

type PublicCfg = {
  activeChainKey: string;
  networkId: string;
  chainId: number;
  chainName: string;
  usdcAddress: string;
  escrowAddress: string | null;
  explorerUrl: string;
  explorerName: string;
  faucetUrl: string | null;
  demoMode: boolean;
  platformFeeBps: number;
  reviewWindowHours: number;
  revisionLimit: number;
  disputeEvidenceHours: number;
  supportedChains: ChainRow[];
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
      `NEXT_PUBLIC_ACTIVE_CHAIN=${cfg!.activeChainKey}`,
      `NEXT_PUBLIC_SUPPORTED_CHAINS=${cfg!.supportedChains.map((c) => c.key).join(",")}`,
      `NEXT_PUBLIC_CHAIN_ID=${cfg!.chainId}`,
      `NEXT_PUBLIC_CHAIN_NAME=${cfg!.chainName}`,
      `NEXT_PUBLIC_USDC_ADDRESS=${cfg!.usdcAddress}`,
      `NEXT_PUBLIC_ESCROW_ADDRESS=${cfg!.escrowAddress ?? ""}`,
      `NEXT_PUBLIC_EXPLORER_URL=${cfg!.explorerUrl}`,
      ...cfg!.supportedChains.flatMap((c) =>
        c.escrowAddress
          ? [`NEXT_PUBLIC_ESCROW_ADDRESS_${c.key.toUpperCase().replace(/-/g, "_")}=${c.escrowAddress}`]
          : [],
      ),
      `DEMO_MODE=${cfg!.demoMode}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-10">
      <PageHero
        eyebrow="Network"
        title="Settings & live status"
        subtitle="Paylane runs on Arc and Base. Switch networks in the header wallet menu, then fund escrow on the chain you pick."
        imageSrc="/brand/paylane-hero-lanes.png"
        imageAlt=""
      />

      <div className="card min-w-0 space-y-3 overflow-hidden text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">Server default chain</h2>
          <span
            className={
              !cfg.demoMode && cfg.escrowAddress ? "badge badge-ok" : "badge badge-brand"
            }
          >
            {!cfg.demoMode && cfg.escrowAddress ? "LIVE" : cfg.chainName}
          </span>
        </div>
        <Row label="Active chain key" value={cfg.activeChainKey} />
        <Row label="Mode" value={cfg.demoMode ? "DEMO (simulated escrow)" : "LIVE (on-chain)"} />
        <Row label="Chain ID" value={String(cfg.chainId)} />
        <Row label="USDC" value={cfg.usdcAddress} mono />
        <Row
          label="Escrow proxy"
          value={cfg.escrowAddress ?? "Not set — deploy per chain (see docs/NETWORKS.md)"}
          mono
        />
        <a
          href={cfg.explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block font-semibold text-[var(--brand)]"
        >
          Open {cfg.explorerName} →
        </a>
        {cfg.faucetUrl && (
          <a
            href={cfg.faucetUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-4 inline-block font-semibold text-[var(--accent)]"
          >
            Faucet →
          </a>
        )}
        <button type="button" className="btn-secondary text-sm" onClick={copyEnv}>
          {copied ? "Copied" : "Copy env snippet"}
        </button>
      </div>

      <div className="card min-w-0 space-y-3 overflow-hidden text-sm">
        <h2 className="font-display text-lg font-semibold">Supported chains</h2>
        <p className="text-[var(--muted)]">
          Your wallet can switch between these networks in the header. Each needs its own escrow
          deployment for live Mode A funding.
        </p>
        <ul className="space-y-3">
          {cfg.supportedChains.map((c) => (
            <li key={c.key} className="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{c.name}</p>
                <span className={c.live ? "badge badge-ok" : "badge badge-muted"}>
                  {c.live ? "Live escrow" : c.isTestnet ? "Testnet" : "No escrow"}
                </span>
              </div>
              <Row label="Key" value={c.key} />
              <Row label="Chain ID" value={String(c.chainId)} />
              <Row label="Family" value={c.family === "arc" ? "Arc (Circle)" : "Base (Coinbase)"} />
              <Row label="USDC" value={c.usdcAddress} mono />
              <Row label="Escrow" value={c.escrowAddress ?? "—"} mono />
              <a
                href={c.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block font-semibold text-[var(--brand)]"
              >
                {c.explorerName} →
              </a>
            </li>
          ))}
        </ul>
        <Link href="/docs/networks" className="font-semibold text-[var(--brand)]">
          Multi-chain setup guide →
        </Link>
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
    <p className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-[var(--muted)]">{label}</span>
      <span
        className={
          mono ? "min-w-0 break-all font-mono text-xs sm:max-w-[65%] sm:text-right" : "min-w-0 font-medium"
        }
      >
        {value}
      </span>
    </p>
  );
}
