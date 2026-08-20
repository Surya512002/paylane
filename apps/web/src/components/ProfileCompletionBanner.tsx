"use client";

import Link from "next/link";
import { getProfileCompletion, type ProfileCompletionInput } from "@/lib/profileCompletion";

export function ProfileCompletionBanner({ profile }: { profile: ProfileCompletionInput | null }) {
  if (!profile) return null;

  const { percent, checks, complete } = getProfileCompletion(profile);
  if (complete) return null;

  const missing = checks.filter((c) => !c.done);

  return (
    <aside className="card border-[var(--brand)]/30 bg-[var(--brand-soft)]/40 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-[var(--ink)]">
            Complete your profile
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Publish skills and roles so clients and agents can find you on the talent board.
          </p>
        </div>
        <Link href="/profile" className="btn-primary shrink-0 text-sm">
          Edit profile
        </Link>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-semibold text-[var(--muted)]">
          <span>Profile strength</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--brand)] transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="grid gap-1 sm:grid-cols-2">
        {missing.slice(0, 4).map((c) => (
          <li key={c.key} className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <span className="text-[var(--warning)]" aria-hidden>
              ○
            </span>
            {c.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
