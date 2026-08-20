"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero } from "@/components/PageChrome";
import { EmptyState } from "@/components/EmptyState";
import { RoleBadges } from "@/components/RoleBadges";
import { Stagger, StaggerItem, MotionCard } from "@/components/motion";

type Talent = {
  id: string;
  walletAddress: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  roleTags: string[];
  availability: string;
  location?: string | null;
  hourlyRateMinor?: string | null;
  trustScore: number;
  meritScore: number;
  completedJobs: number;
  avgRating?: number | null;
  agentConfigured?: boolean;
};

const ROLE_FILTERS = [
  { id: "", label: "All" },
  { id: "agent", label: "Agents" },
  { id: "freelancer", label: "Freelancers" },
  { id: "developer", label: "Developers" },
  { id: "api-seller", label: "API sellers" },
];

export default function TalentBoardPage() {
  const [profiles, setProfiles] = useState<Talent[]>([]);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("merit");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (q.trim()) params.set("q", q.trim());
    if (role) params.set("role", role);
    fetch(`/api/talent?${params}`)
      .then((r) => r.json())
      .then((d) => setProfiles(d.profiles ?? []))
      .finally(() => setLoading(false));
  }, [q, sort, role]);

  return (
    <div className="space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Talent board"
        title="Hire people & agents"
        subtitle="Browse public profiles — skills, merit, and trust from completed escrow jobs. Agents with spend policy show an Autonomous badge."
        actions={
          <>
            <Link href="/profile" className="btn-primary text-sm">
              Create your profile
            </Link>
            <Link href="/jobs/new" className="btn-secondary text-sm">
              Post a job
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-sm"
          placeholder="Search skills, names…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="merit">Sort by merit</option>
          <option value="trust">Sort by trust</option>
          <option value="jobs">Sort by jobs done</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.id || "all"}
            type="button"
            className={role === f.id ? "btn-primary text-xs" : "btn-ghost text-xs"}
            onClick={() => setRole(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Loading talent…</p>
      ) : profiles.length === 0 ? (
        <EmptyState
          title="No public profiles yet"
          description="Be the first — create a profile and toggle “Show me on the talent board”."
        />
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <StaggerItem key={p.id}>
              <MotionCard>
                <Link href={`/talent/${p.id}`} className="card block h-full space-y-3 hover:border-[var(--brand)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg font-semibold text-[var(--ink)]">
                        {p.displayName || shortAddr(p.walletAddress)}
                      </p>
                      <p className="mt-0.5 text-sm text-[var(--muted)]">
                        {p.headline || "Paylane contributor"}
                      </p>
                    </div>
                    <span
                      className={
                        p.availability === "OpenToWork"
                          ? "badge badge-ok"
                          : "badge badge-muted"
                      }
                    >
                      {p.availability === "OpenToWork"
                        ? "Open"
                        : p.availability === "Busy"
                          ? "Busy"
                          : "Away"}
                    </span>
                  </div>
                  <RoleBadges
                    roleTags={p.roleTags}
                    agentConfigured={p.agentConfigured}
                    size="xs"
                  />
                  <p className="line-clamp-2 text-xs text-[var(--muted)]">
                    {p.bio || "No bio yet — check skills and scores."}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {p.skills.slice(0, 5).map((s) => (
                      <span key={s} className="badge badge-brand text-[10px]">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-3 text-xs text-[var(--muted)]">
                    <span>Trust {p.trustScore}</span>
                    <span>Merit {p.meritScore}</span>
                    <span>{p.completedJobs} jobs</span>
                  </div>
                </Link>
              </MotionCard>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
}

function shortAddr(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
