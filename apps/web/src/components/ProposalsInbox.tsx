"use client";

import Link from "next/link";
import { RoleBadges } from "@/components/RoleBadges";
import { StatusBadge } from "@/components/StatusBadge";

type InboxProposal = {
  id: string;
  status: string;
  job: { id: string; title: string; status: string; amountMinor?: string };
  worker?: {
    id: string;
    displayName?: string | null;
    walletAddress: string;
    roleTags?: string[];
    trustScore: number;
    meritScore: number;
  };
};

export function ProposalsInbox({
  incoming,
  mine,
}: {
  incoming: InboxProposal[];
  mine: InboxProposal[];
}) {
  if (incoming.length === 0 && mine.length === 0) return null;

  return (
    <section className="space-y-6">
      <h2 className="font-display text-lg font-semibold tracking-tight">Proposals</h2>

      {incoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--ink)]">
            On your jobs ({incoming.length} pending)
          </p>
          <ul className="space-y-2">
            {incoming.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/jobs/${p.job.id}#proposals`}
                  className="card-quiet flex flex-wrap items-center justify-between gap-2 text-sm hover:border-[var(--brand)]"
                >
                  <div>
                    <p className="font-medium">{p.job.title}</p>
                    {p.worker && (
                      <p className="mt-0.5 text-xs text-[var(--muted)]">
                        From{" "}
                        <span className="text-[var(--brand)]">
                          {p.worker.displayName || short(p.worker.walletAddress)}
                        </span>
                        {" · "}
                        Trust {p.worker.trustScore} · Merit {p.worker.meritScore}
                      </p>
                    )}
                    {p.worker?.roleTags && p.worker.roleTags.length > 0 && (
                      <div className="mt-1">
                        <RoleBadges roleTags={p.worker.roleTags} size="xs" max={2} />
                      </div>
                    )}
                  </div>
                  <StatusBadge status={p.job.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mine.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-[var(--ink)]">
            Your applications ({mine.length} pending)
          </p>
          <ul className="space-y-2">
            {mine.slice(0, 6).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/jobs/${p.job.id}#proposals`}
                  className="card-quiet flex items-center justify-between gap-2 text-sm hover:border-[var(--brand)]"
                >
                  <span className="font-medium">{p.job.title}</span>
                  <span className="badge badge-brand text-[10px]">Pending</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
