"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UsdcAmount } from "@/components/UsdcAmount";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout, StepRail } from "@/components/PageChrome";
import { Stagger, StaggerItem, MotionCard } from "@/components/motion";

interface JobRow {
  id: string;
  title: string;
  status: string;
  amountMinor: string;
  description?: string;
}

const FILTERS = ["All", "Published", "Funded", "InProgress", "Delivered", "Disputed"] as const;

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs ?? []))
      .catch(() => setJobs([]));
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (filter !== "All" && j.status !== filter) return false;
      if (q && !j.title.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [jobs, filter, q]);

  return (
    <div className="space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Mode A · Hire / Work"
        title="Jobs marketplace"
        subtitle="Escrow-backed freelance work on Arc. Clients fund USDC before work starts. Workers deliver against a locked checklist — accept, revise, dispute, or auto-release."
        imageSrc="/brand/paylane-mode-escrow.png"
        imageAlt="Escrow illustration"
        actions={
          <>
            <Link href="/jobs/new" className="btn-primary text-sm">
              Post a job
            </Link>
            <Link href="/docs/user-guide-clients" className="btn-secondary text-sm">
              Client guide
            </Link>
            <Link href="/docs/user-guide-workers" className="btn-ghost text-sm">
              Worker guide →
            </Link>
          </>
        }
      />

      <InfoCallout title="Before you fund" tone="brand">
        <p>
          Full amount locks in <strong>PaylaneEscrow</strong>. Platform fee (default 2%) is taken only
          when releasing to the worker — not on full client refunds. After delivery, you have the
          review window to act or the worker is auto-paid.
        </p>
      </InfoCallout>

      <StepRail
        steps={[
          { title: "Draft & publish", body: "Write the brief and at least one acceptance criterion." },
          { title: "Fund", body: "Approve USDC and lock escrow (live) or simulate (demo)." },
          { title: "Assign", body: "Hire a worker wallet — then work may begin." },
          { title: "Settle", body: "Accept, revise ≤2×, dispute, or auto-release." },
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="input max-w-sm"
          placeholder="Search jobs…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "badge badge-brand cursor-pointer"
                  : "badge badge-muted cursor-pointer hover:bg-[var(--brand-soft)]"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No jobs match"
          description="Post a funded job or adjust filters. Published listings appear here for signed-in users."
          action={
            <Link href="/jobs/new" className="btn-secondary text-sm">
              Create job
            </Link>
          }
        />
      ) : (
        <Stagger className="space-y-3">
          {filtered.map((j) => (
            <StaggerItem key={j.id}>
              <MotionCard>
                <Link
                  href={`/jobs/${j.id}`}
                  className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-[var(--ink)]">{j.title}</p>
                      <StatusBadge status={j.status} />
                    </div>
                    {j.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{j.description}</p>
                    )}
                  </div>
                  <UsdcAmount minor={j.amountMinor} className="shrink-0 text-base font-semibold" />
                </Link>
              </MotionCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}
