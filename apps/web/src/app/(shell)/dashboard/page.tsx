"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UsdcAmount } from "@/components/UsdcAmount";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout, StatPill, QuickLinks } from "@/components/PageChrome";
import { Stagger, StaggerItem, MotionCard, Reveal } from "@/components/motion";
import { SessionGate } from "@/components/SessionGate";
import { formatPlatformFeePercent } from "@/lib/money";

type Job = {
  id: string;
  title: string;
  status: string;
  amountMinor: string;
  clientId: string;
  workerId?: string | null;
  reviewDeadline?: string | null;
};

type Receipt = { id: string; amountMinor: string; kind: string };

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [me, setMe] = useState<{ id: string; displayName?: string | null } | null>(null);
  const [cfg, setCfg] = useState<{
    chainName?: string;
    platformFeeBps?: number;
    demoMode?: boolean;
    escrowAddress?: string | null;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/jobs").then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/receipts")
        .then((r) => r.json())
        .catch(() => ({ receipts: [] })),
      fetch("/api/config").then((r) => r.json()),
    ]).then(([j, m, rec, c]) => {
      setJobs(j.jobs ?? []);
      setMe(m.user);
      setReceipts(rec.receipts ?? []);
      setCfg(c);
    });
  }, []);

  const asClient = jobs.filter((j) => j.clientId === me?.id);
  const asWorker = jobs.filter((j) => j.workerId === me?.id);
  const actionNeeded = jobs.filter((j) =>
    ["Delivered", "RevisionRequested", "Disputed", "Funded", "Assigned"].includes(j.status),
  );

  const volume = useMemo(
    () => receipts.reduce((s, r) => s + BigInt(r.amountMinor || "0"), 0n),
    [receipts],
  );

  if (!me) {
    return (
      <div className="space-y-10">
        <NetworkBanner />
        <PageHero
          eyebrow="Dashboard"
          title="Your Paylane workspace"
          subtitle="Sign in to see jobs that need action, escrow status, and ledger volume across Hire/Work and API modes."
          imageSrc="/brand/paylane-hero-lanes.png"
          imageAlt=""
          actions={
            <>
              <Link href="/jobs" className="btn-secondary text-sm">
                Browse jobs
              </Link>
              <Link href="/docs/user-guide-clients" className="btn-ghost text-sm">
                How it works →
              </Link>
            </>
          }
        />
        <EmptyState
          title="Sign in to open your dashboard"
          description="Connect a wallet on Arc Testnet and Sign in (SIWE). Escrow is live on-chain — not a demo."
        />
        <SessionGate />
      </div>
    );
  }

  const live = cfg && !cfg.demoMode && cfg.escrowAddress;

  return (
    <div className="space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow={cfg?.chainName ?? "Arc"}
        title={`Welcome${me.displayName ? `, ${me.displayName}` : ""}`}
        subtitle={
          live
            ? "Live escrow is connected. Fund jobs from your wallet — USDC locks in PaylaneEscrow before work starts."
            : "Switch your wallet to Arc Testnet. Escrow is live on-chain."
        }
        imageSrc="/brand/paylane-mode-escrow.png"
        imageAlt="Escrow illustration"
        actions={
          <>
            <Link href="/jobs/new" className="btn-primary text-sm">
              Post job
            </Link>
            <Link href="/api-seller" className="btn-secondary text-sm">
              New paid API
            </Link>
            <Link href="/agents" className="btn-ghost text-sm">
              Agent spend →
            </Link>
          </>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatPill label="Active jobs" value={String(jobs.length)} />
        </StaggerItem>
        <StaggerItem>
          <StatPill label="Needs action" value={String(actionNeeded.length)} />
        </StaggerItem>
        <StaggerItem>
          <div className="stat">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
              Ledger volume
            </p>
            <p className="font-display mt-2 text-2xl font-bold tracking-tight">
              <UsdcAmount minor={volume.toString()} />
            </p>
          </div>
        </StaggerItem>
      </Stagger>

      <InfoCallout title="What this dashboard shows" tone="brand">
        <p>
          <strong>As client</strong> — jobs you funded or drafted.{" "}
          <strong>As worker</strong> — assignments you accepted. Action items include deliveries
          waiting for accept, funded jobs ready to assign, and open disputes. Platform fee{" "}
          {formatPlatformFeePercent(cfg?.platformFeeBps ?? 10)} applies only when USDC releases to a worker.
        </p>
      </InfoCallout>

      {actionNeeded.length > 0 && (
        <Reveal>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">
              Needs your attention
            </h2>
            <Stagger className="space-y-2">
              {actionNeeded.slice(0, 8).map((j) => (
                <StaggerItem key={j.id}>
                  <Link
                    href={`/jobs/${j.id}`}
                    className="card-quiet flex items-center justify-between gap-3 text-sm hover:border-[var(--brand)]"
                  >
                    <span className="font-medium">{j.title}</span>
                    <StatusBadge status={j.status} />
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        </Reveal>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        <Reveal>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">As client</h2>
            <JobList items={asClient} empty="No hire jobs yet — post one to lock escrow." />
          </section>
        </Reveal>
        <Reveal delay={0.06}>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">As worker</h2>
            <JobList items={asWorker} empty="No assignments yet — accept a funded job." />
          </section>
        </Reveal>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">Shortcuts</h2>
        <QuickLinks
          links={[
            { href: "/receipts", label: "Receipts", desc: "Every fund, release, and API pay" },
            { href: "/docs/money-rules", label: "Money rules", desc: "Fees, auto-release, credits" },
            { href: "/settings", label: "Network settings", desc: "LIVE status & escrow address" },
          ]}
        />
      </section>
    </div>
  );
}

function JobList({
  items,
  empty,
}: {
  items: Array<{ id: string; title: string; status: string; amountMinor: string }>;
  empty: string;
}) {
  if (items.length === 0) return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  return (
    <Stagger className="space-y-2">
      {items.map((j) => (
        <StaggerItem key={j.id}>
          <MotionCard>
            <Link
              href={`/jobs/${j.id}`}
              className="card flex items-center justify-between gap-3 text-sm"
            >
              <div>
                <p className="font-medium text-[var(--ink)]">{j.title}</p>
                <StatusBadge status={j.status} className="mt-1" />
              </div>
              <UsdcAmount minor={j.amountMinor} />
            </Link>
          </MotionCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
