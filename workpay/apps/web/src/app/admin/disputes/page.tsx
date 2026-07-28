"use client";

import { useEffect, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";
import { UsdcAmount } from "@/components/UsdcAmount";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";

interface DisputeRow {
  id: string;
  reason: string;
  status?: string;
  job: { id: string; title: string; amountMinor: string };
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [splits, setSplits] = useState<
    Record<string, { worker: string; client: string; rationale: string }>
  >({});
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const d = await fetch("/api/admin/disputes").then((r) => r.json());
    setDisputes(d.disputes ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  function setSplit(id: string, patch: Partial<{ worker: string; client: string; rationale: string }>) {
    setSplits((prev) => ({
      ...prev,
      [id]: {
        worker: prev[id]?.worker ?? "",
        client: prev[id]?.client ?? "",
        rationale: prev[id]?.rationale ?? "",
        ...patch,
      },
    }));
  }

  async function resolve(id: string, amountMinor: string) {
    setMsg(null);
    const s = splits[id] ?? {
      worker: amountMinor,
      client: "0",
      rationale: "Resolved per evidence",
    };
    const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workerAmountMinor: s.worker || amountMinor,
        clientAmountMinor: s.client || "0",
        rationale: s.rationale || "Resolved per evidence",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error ?? "Resolve failed");
      return;
    }
    setMsg("Dispute resolved");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Dispute queue</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Arbitrator tools — release, refund, or split. Decisions are final and audit-logged.
        </p>
      </div>
      {msg && <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-2 text-sm">{msg}</p>}
      {disputes.length === 0 ? (
        <EmptyState title="No open disputes" description="When parties dispute a delivery, they appear here." />
      ) : (
        <ul className="space-y-4">
          {disputes.map((d) => (
            <li key={d.id} className="card space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <Link href={`/jobs/${d.job.id}`} className="font-semibold hover:text-[var(--brand)]">
                    {d.job.title}
                  </Link>
                  <p className="mt-1 text-sm text-[var(--muted)]">{d.reason}</p>
                </div>
                <UsdcAmount minor={d.job.amountMinor} className="font-semibold" />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="label">To worker (minor)</span>
                  <input
                    className="input"
                    placeholder={d.job.amountMinor}
                    onChange={(e) => setSplit(d.id, { worker: e.target.value })}
                  />
                </label>
                <label className="block">
                  <span className="label">To client (minor)</span>
                  <input
                    className="input"
                    placeholder="0"
                    onChange={(e) => setSplit(d.id, { client: e.target.value })}
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className="label">Rationale</span>
                  <input
                    className="input"
                    placeholder="Why this split"
                    onChange={(e) => setSplit(d.id, { rationale: e.target.value })}
                  />
                </label>
              </div>
              <p className="text-xs text-[var(--muted)]">
                Worker + client amounts must equal escrow. Fee applies to worker share only.
              </p>
              <SubmitButton onClick={() => resolve(d.id, d.job.amountMinor)}>
                Confirm resolve
              </SubmitButton>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
