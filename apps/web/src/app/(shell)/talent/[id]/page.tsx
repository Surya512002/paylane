"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero } from "@/components/PageChrome";
import { ScoreBadges } from "@/components/ScoreBadges";
import { RoleBadges } from "@/components/RoleBadges";
import { UsdcAmount } from "@/components/UsdcAmount";
import { format } from "date-fns";

type ProfileDetail = {
  id: string;
  walletAddress: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  roleTags: string[];
  availability: string;
  location?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  hourlyRateMinor?: string | null;
  trustScore: number;
  meritScore: number;
  completedJobs: number;
  jobsHired: number;
  avgRating?: number | null;
  agentConfigured?: boolean;
  reviewsReceived: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    from: { displayName?: string | null; walletAddress: string };
    job: { id: string; title: string };
  }>;
  jobsAsWorker: Array<{
    id: string;
    title: string;
    status: string;
    amountMinor: string;
    updatedAt: string;
  }>;
};

export default function TalentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/talent/${id}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Not found");
        setProfile(d.profile);
      })
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-6">
        <NetworkBanner />
        <p className="text-[var(--danger)]">{error}</p>
        <Link href="/talent" className="btn-secondary text-sm">
          ← Talent board
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-[var(--muted)]">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <NetworkBanner />
      <PageHero
        eyebrow="Talent"
        title={profile.displayName || short(profile.walletAddress)}
        subtitle={profile.headline || "Paylane talent profile"}
        actions={
          <>
            <Link href="/jobs/new" className="btn-primary text-sm">
              Hire them — post a job
            </Link>
            <Link href="/talent" className="btn-ghost text-sm">
              ← Board
            </Link>
          </>
        }
      />

      <ScoreBadges
        trust={profile.trustScore}
        merit={profile.meritScore}
        completed={profile.completedJobs}
        hired={profile.jobsHired}
        rating={profile.avgRating}
      />

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-ok">{profile.availability.replace(/([A-Z])/g, " $1").trim()}</span>
          <RoleBadges roleTags={profile.roleTags} agentConfigured={profile.agentConfigured} />
          {profile.location && <span className="badge badge-muted">{profile.location}</span>}
        </div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink-soft)]">
          {profile.bio || "No bio yet."}
        </p>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((s) => (
            <span key={s} className="badge badge-brand">
              {s}
            </span>
          ))}
        </div>
        <p className="font-mono text-xs text-[var(--muted)]">{profile.walletAddress}</p>
        {profile.hourlyRateMinor && (
          <p className="text-sm">
            Indicative rate: <UsdcAmount minor={profile.hourlyRateMinor} /> / hr
          </p>
        )}
        <div className="flex flex-wrap gap-3 text-sm">
          {profile.portfolioUrl && (
            <a className="font-semibold text-[var(--brand)]" href={profile.portfolioUrl} target="_blank" rel="noreferrer">
              Portfolio →
            </a>
          )}
          {profile.githubUrl && (
            <a className="font-semibold text-[var(--brand)]" href={profile.githubUrl} target="_blank" rel="noreferrer">
              GitHub →
            </a>
          )}
          {profile.websiteUrl && (
            <a className="font-semibold text-[var(--brand)]" href={profile.websiteUrl} target="_blank" rel="noreferrer">
              Website →
            </a>
          )}
        </div>
      </div>

      {profile.jobsAsWorker.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-lg font-semibold">Completed jobs</h2>
          <ul className="space-y-2">
            {profile.jobsAsWorker.map((j) => (
              <li key={j.id}>
                <Link href={`/jobs/${j.id}`} className="card-quiet flex justify-between text-sm">
                  <span>{j.title}</span>
                  <UsdcAmount minor={j.amountMinor} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {profile.reviewsReceived.length > 0 && (
        <section>
          <h2 className="font-display mb-3 text-lg font-semibold">Reviews</h2>
          <ul className="space-y-3">
            {profile.reviewsReceived.map((r) => (
              <li key={r.id} className="card text-sm">
                <p className="font-semibold">
                  {"★".repeat(r.rating)}
                  <span className="ml-2 text-[var(--muted)]">
                    {r.from.displayName || short(r.from.walletAddress)} · {r.job.title}
                  </span>
                </p>
                {r.comment && <p className="mt-1 text-[var(--ink-soft)]">{r.comment}</p>}
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {format(new Date(r.createdAt), "MMM d, yyyy")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
