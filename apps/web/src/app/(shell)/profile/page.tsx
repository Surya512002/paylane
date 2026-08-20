"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { parseUsdcToMinor } from "@/lib/money";
import { SubmitButton } from "@/components/SubmitButton";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout } from "@/components/PageChrome";
import { SessionGate } from "@/components/SessionGate";
import { useWalletSession } from "@/components/WalletSession";
import { ScoreBadges } from "@/components/ScoreBadges";
import { getProfileCompletion } from "@/lib/profileCompletion";

const ROLE_OPTIONS = ["freelancer", "agent", "api-seller", "designer", "developer", "writer"];
const AVAIL = [
  { v: "OpenToWork", l: "Open to work" },
  { v: "Busy", l: "Busy" },
  { v: "NotLooking", l: "Not looking" },
] as const;

type Profile = {
  id: string;
  walletAddress: string;
  displayName?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills: string[];
  roleTags: string[];
  availability: string;
  profilePublic: boolean;
  location?: string | null;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  websiteUrl?: string | null;
  hourlyRateMinor?: string | null;
  email?: string | null;
  trustScore: number;
  meritScore: number;
  completedJobs: number;
  jobsHired: number;
  avgRating?: number | null;
};

export default function ProfilePage() {
  const wallet = useWalletSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [hourly, setHourly] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet.ready) {
      setLoading(false);
      return;
    }
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.user);
        if (d.user?.hourlyRateMinor) {
          const m = BigInt(d.user.hourlyRateMinor);
          setHourly((Number(m) / 1e6).toString());
        }
      })
      .finally(() => setLoading(false));
  }, [wallet.ready]);

  async function save() {
    if (!profile) return;
    setError(null);
    setSaved(false);
    let hourlyRateMinor: string | null = null;
    if (hourly.trim()) {
      try {
        hourlyRateMinor = parseUsdcToMinor(hourly).toString();
      } catch {
        setError("Invalid hourly rate");
        return;
      }
    }
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: profile.displayName,
        headline: profile.headline,
        bio: profile.bio,
        skills: profile.skills,
        roleTags: profile.roleTags,
        availability: profile.availability,
        profilePublic: profile.profilePublic,
        location: profile.location,
        portfolioUrl: profile.portfolioUrl,
        githubUrl: profile.githubUrl,
        websiteUrl: profile.websiteUrl,
        email: profile.email,
        hourlyRateMinor,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save profile");
      return;
    }
    setProfile(data.user);
    setSaved(true);
  }

  function addSkill() {
    const s = skillInput.trim();
    if (!s || !profile) return;
    if (profile.skills.includes(s)) {
      setSkillInput("");
      return;
    }
    setProfile({ ...profile, skills: [...profile.skills, s].slice(0, 24) });
    setSkillInput("");
  }

  if (!wallet.ready) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <NetworkBanner />
        <PageHero
          eyebrow="Profile"
          title="Create your Paylane profile"
          subtitle="Sign in with your wallet to publish skills, get hired on the talent board, and build merit & trust scores."
        />
        <SessionGate title="Sign in to create your profile" />
      </div>
    );
  }

  if (loading || !profile) {
    return <p className="text-sm text-[var(--muted)]">Loading profile…</p>;
  }

  const completion = getProfileCompletion(profile);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <NetworkBanner />
      <PageHero
        eyebrow="Your profile"
        title={profile.displayName || "Complete your profile"}
        subtitle="Publish what you are good at so clients and agents can hire you. Scores rise when you finish escrow jobs."
        actions={
          profile.profilePublic ? (
            <Link href={`/talent/${profile.id}`} className="btn-secondary text-sm">
              View public page →
            </Link>
          ) : undefined
        }
      />

      <ScoreBadges
        trust={profile.trustScore}
        merit={profile.meritScore}
        completed={profile.completedJobs}
        hired={profile.jobsHired}
        rating={profile.avgRating}
      />

      {!completion.complete && (
        <div className="card-quiet space-y-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Profile strength</span>
            <span>{completion.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--brand)]"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
          <ul className="grid gap-1 pt-1 sm:grid-cols-2">
            {completion.checks
              .filter((c) => !c.done)
              .map((c) => (
                <li key={c.key} className="text-xs text-[var(--muted)]">
                  ○ {c.label}
                </li>
              ))}
          </ul>
        </div>
      )}

      <InfoCallout title="How scores work" tone="brand">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>Trust</strong> starts at 100 and dips on disputes; recovers with successful
            releases.
          </li>
          <li>
            <strong>Merit</strong> grows when you complete funded jobs and earn good reviews.
          </li>
          <li>Keep your skills and availability current so the talent board ranks you well.</li>
        </ul>
      </InfoCallout>

      <div className="card space-y-4">
        <label className="block">
          <span className="label">Display name</span>
          <input
            className="input"
            value={profile.displayName ?? ""}
            onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
            placeholder="Ada Lovelace"
          />
        </label>
        <label className="block">
          <span className="label">Headline</span>
          <input
            className="input"
            value={profile.headline ?? ""}
            onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            placeholder="Full-stack engineer · Arc / USDC escrow"
          />
        </label>
        <label className="block">
          <span className="label">Bio</span>
          <textarea
            className="input min-h-[120px]"
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="What you ship, languages, and how you work with clients or agents…"
          />
        </label>

        <div>
          <p className="label">Skills</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <button
                key={s}
                type="button"
                className="badge badge-brand"
                onClick={() =>
                  setProfile({ ...profile, skills: profile.skills.filter((x) => x !== s) })
                }
                title="Remove"
              >
                {s} ×
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="input"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              placeholder="Add skill (Solidity, React…)"
            />
            <button type="button" className="btn-secondary shrink-0" onClick={addSkill}>
              Add
            </button>
          </div>
        </div>

        <div>
          <p className="label">Roles</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((r) => {
              const on = profile.roleTags.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  className={on ? "badge badge-ok" : "badge badge-muted"}
                  onClick={() =>
                    setProfile({
                      ...profile,
                      roleTags: on
                        ? profile.roleTags.filter((x) => x !== r)
                        : [...profile.roleTags, r],
                    })
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Availability</span>
            <select
              className="input"
              value={profile.availability}
              onChange={(e) => setProfile({ ...profile, availability: e.target.value })}
            >
              {AVAIL.map((a) => (
                <option key={a.v} value={a.v}>
                  {a.l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Hourly rate (USDC, optional)</span>
            <input className="input" value={hourly} onChange={(e) => setHourly(e.target.value)} />
          </label>
        </div>

        <label className="block">
          <span className="label">Location</span>
          <input
            className="input"
            value={profile.location ?? ""}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Portfolio URL</span>
            <input
              className="input"
              value={profile.portfolioUrl ?? ""}
              onChange={(e) => setProfile({ ...profile, portfolioUrl: e.target.value })}
            />
          </label>
          <label className="block">
            <span className="label">GitHub</span>
            <input
              className="input"
              value={profile.githubUrl ?? ""}
              onChange={(e) => setProfile({ ...profile, githubUrl: e.target.value })}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={profile.profilePublic}
            onChange={(e) => setProfile({ ...profile, profilePublic: e.target.checked })}
          />
          Show me on the public talent board
        </label>

        <p className="text-xs text-[var(--muted)]">
          Wallet <span className="font-mono">{profile.walletAddress}</span>
        </p>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        {saved && <p className="text-sm text-[var(--accent-dark)]">Profile saved.</p>}
        <SubmitButton onClick={save}>Save profile</SubmitButton>
      </div>
    </div>
  );
}
