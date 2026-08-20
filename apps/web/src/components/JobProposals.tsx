"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SubmitButton } from "@/components/SubmitButton";
import { UsdcAmount } from "@/components/UsdcAmount";

type Proposal = {
  id: string;
  coverLetter: string;
  proposedAmountMinor?: string | null;
  status: string;
  createdAt: string;
  worker: {
    id: string;
    displayName?: string | null;
    walletAddress: string;
    headline?: string | null;
    skills?: string[];
    trustScore: number;
    meritScore: number;
    completedJobs: number;
    avgRating?: number | null;
  };
};

export function JobProposals({
  jobId,
  jobStatus,
  isClient,
  hasWorker,
  isSignedIn,
}: {
  jobId: string;
  jobStatus: string;
  isClient: boolean;
  hasWorker: boolean;
  isSignedIn: boolean;
}) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [cover, setCover] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const open = ["Published", "Funded"].includes(jobStatus) && !hasWorker;

  const load = useCallback(() => {
    if (!isSignedIn) return;
    fetch(`/api/jobs/${jobId}/proposals`)
      .then((r) => r.json())
      .then((d) => setProposals(d.proposals ?? []))
      .catch(() => null);
  }, [jobId, isSignedIn]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitProposal() {
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/jobs/${jobId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coverLetter: cover }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not submit proposal");
      return;
    }
    setCover("");
    setMsg("Proposal submitted");
    load();
  }

  async function decide(proposalId: string, action: "accept" | "reject") {
    setError(null);
    setMsg(null);
    const res = await fetch(`/api/jobs/${jobId}/proposals/${proposalId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Action failed");
      return;
    }
    setMsg(action === "accept" ? "Worker hired from proposal" : "Proposal declined");
    load();
    if (action === "accept") window.location.reload();
  }

  if (!isSignedIn && !open) return null;

  return (
    <div className="card space-y-4">
      <h2 className="font-display text-lg font-semibold">Proposals</h2>
      <p className="text-sm text-[var(--muted)]">
        Workers apply with a short pitch. Clients accept after the job is{" "}
        <strong>Funded</strong> — that assigns the wallet on-chain / in escrow.
      </p>

      {!isClient && open && isSignedIn && (
        <div className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <label className="block">
            <span className="label">Your pitch (min 20 chars)</span>
            <textarea
              className="input min-h-[100px]"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="Why you are a fit, relevant skills, delivery plan…"
            />
          </label>
          <SubmitButton onClick={submitProposal}>Submit proposal</SubmitButton>
        </div>
      )}

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {msg && <p className="text-sm text-[var(--accent-dark)]">{msg}</p>}

      {proposals.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No proposals yet.</p>
      ) : (
        <ul className="space-y-3">
          {proposals.map((p) => (
            <li key={p.id} className="rounded-xl border border-[var(--border)] p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link
                    href={`/talent/${p.worker.id}`}
                    className="font-semibold text-[var(--brand)]"
                  >
                    {p.worker.displayName || short(p.worker.walletAddress)}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    Trust {p.worker.trustScore} · Merit {p.worker.meritScore} ·{" "}
                    {p.worker.completedJobs} jobs · {p.status}
                  </p>
                </div>
                {p.proposedAmountMinor && (
                  <UsdcAmount minor={p.proposedAmountMinor} className="font-semibold" />
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[var(--ink-soft)]">{p.coverLetter}</p>
              {isClient && p.status === "Pending" && open && jobStatus === "Funded" && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-sm"
                    onClick={() => void decide(p.id, "accept")}
                  >
                    Accept & assign
                  </button>
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => void decide(p.id, "reject")}
                  >
                    Decline
                  </button>
                </div>
              )}
              {isClient && p.status === "Pending" && jobStatus === "Published" && (
                <p className="mt-2 text-xs text-[var(--warning)]">
                  Fund escrow first, then you can accept this proposal.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function short(a: string) {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
