"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { JobTimeline } from "@/components/JobTimeline";
import { UsdcAmount } from "@/components/UsdcAmount";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge } from "@/components/StatusBadge";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { useEscrowActions } from "@/hooks/useEscrowActions";

interface JobDetail {
  id: string;
  title: string;
  description: string;
  status: string;
  amountMinor: string;
  checklist: string[];
  reviewDeadline?: string;
  deliveredAt?: string;
  deadlineAt?: string | null;
  revisionsUsed: number;
  onchainJobId?: string | null;
  escrowTxHash?: string | null;
  releaseTxHash?: string | null;
  client: { id: string; walletAddress: string };
  worker?: { id: string; walletAddress: string } | null;
}

type Cfg = {
  demoMode: boolean;
  escrowAddress?: string | null;
  usdcAddress: string;
  reviewWindowHours: number;
  revisionLimit: number;
  platformFeeBps: number;
  explorerUrl: string;
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [me, setMe] = useState<{ id: string; walletAddress: string } | null>(null);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [deliverNote, setDeliverNote] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const escrow = useEscrowActions(
    cfg
      ? {
          escrowAddress: (cfg.escrowAddress as `0x${string}` | null) ?? null,
          usdcAddress: cfg.usdcAddress as `0x${string}`,
          demoMode: cfg.demoMode,
        }
      : null,
  );

  async function load() {
    const [j, m, c] = await Promise.all([
      fetch(`/api/jobs/${id}`).then((r) => r.json()),
      fetch("/api/me").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]);
    setJob(j.job);
    setMe(m.user);
    setCfg(c);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function act(path: string, body?: object) {
    setError(null);
    const res = await fetch(`/api/jobs/${id}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : "{}",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? `Action failed (${res.status})`);
      return false;
    }
    await load();
    return true;
  }

  async function fundEscrow() {
    if (!job || !cfg) return;
    setError(null);
    setStatusMsg(null);
    try {
      if (!cfg.demoMode && cfg.escrowAddress) {
        const deadlineUnix = job.deadlineAt
          ? Math.floor(new Date(job.deadlineAt).getTime() / 1000)
          : 0;
        const result = await escrow.fundOnchain({
          jobDbId: job.id,
          amountMinor: BigInt(job.amountMinor),
          deadlineUnix,
        });
        if (result.mode === "live") {
          setStatusMsg(`Funded on-chain · ${result.txHash.slice(0, 10)}…`);
          await act("fund", { txHash: result.txHash, onchainJobId: result.onchainJobId });
          return;
        }
      }
      await act("fund", {});
      setStatusMsg("Escrow funded (demo mode)");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function acceptRelease() {
    if (!job || !cfg) return;
    try {
      if (!cfg.demoMode && cfg.escrowAddress && job.onchainJobId) {
        const result = await escrow.acceptOnchain(job.onchainJobId);
        if (result.mode === "live") {
          await act("accept", { txHash: result.txHash });
          setStatusMsg("Released on-chain");
          return;
        }
      }
      await act("accept");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submitDelivery() {
    if (!job || !cfg) return;
    const note = deliverNote || "Delivery submitted";
    try {
      if (!cfg.demoMode && cfg.escrowAddress && job.onchainJobId) {
        const result = await escrow.deliverOnchain(job.onchainJobId, note);
        if (result.mode === "live") {
          await act("deliver", {
            note,
            artifactUrl: artifactUrl || undefined,
            artifactHash: result.deliveryHash,
            txHash: result.txHash,
          });
          return;
        }
      }
      await act("deliver", { note, artifactUrl: artifactUrl || undefined });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!job) return <p className="text-[var(--muted)]">Loading job…</p>;

  const isClient = me?.id === job.client.id;
  const isWorker = me?.id === job.worker?.id;
  const fee = (Number(job.amountMinor) * (cfg?.platformFeeBps ?? 200)) / 10_000;
  const net = Number(job.amountMinor) - fee;
  const live = Boolean(cfg && !cfg.demoMode && cfg.escrowAddress);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <span className={live ? "badge badge-ok" : "badge badge-muted"}>
              {live ? "On-chain escrow" : "Demo escrow"}
            </span>
            {job.reviewDeadline && job.status === "Delivered" && (
              <span className="text-xs text-[var(--muted)]">
                Auto-release {formatDistanceToNow(new Date(job.reviewDeadline), { addSuffix: true })}
              </span>
            )}
          </div>
          <h1 className="font-display mt-2 text-3xl font-semibold">{job.title}</h1>
          <p className="mt-2 text-2xl font-semibold text-[var(--ink)]">
            <UsdcAmount minor={job.amountMinor} />
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Fee {(cfg?.platformFeeBps ?? 200) / 100}% on release → worker ≈{" "}
            <UsdcAmount minor={Math.round(net).toString()} />
          </p>
        </div>
      </div>

      <JobTimeline
        status={job.status}
        reviewDeadline={job.reviewDeadline}
        deliveredAt={job.deliveredAt}
      />

      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="card space-y-4">
          <h2 className="font-display text-lg font-semibold">Brief</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{job.description}</p>
          <div>
            <p className="label">Acceptance checklist</p>
            <ul className="mt-1 space-y-1.5">
              {job.checklist.map((c) => (
                <li key={c} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card space-y-3 text-sm">
          <h2 className="font-display text-lg font-semibold">Parties & chain</h2>
          <p>
            <span className="text-[var(--muted)]">Client</span>
            <br />
            <span className="font-mono text-xs">{job.client.walletAddress}</span>
          </p>
          <p>
            <span className="text-[var(--muted)]">Worker</span>
            <br />
            <span className="font-mono text-xs">{job.worker?.walletAddress ?? "Unassigned"}</span>
          </p>
          {job.onchainJobId && (
            <p className="text-xs text-[var(--muted)]">On-chain job #{job.onchainJobId}</p>
          )}
          {job.escrowTxHash && (
            <a
              className="text-xs font-medium text-[var(--brand)]"
              href={
                job.escrowTxHash.startsWith("demo:")
                  ? undefined
                  : `${cfg?.explorerUrl}/tx/${job.escrowTxHash}`
              }
              target="_blank"
              rel="noreferrer"
            >
              {job.escrowTxHash.startsWith("demo:")
                ? `Simulated: ${job.escrowTxHash}`
                : "View fund tx →"}
            </a>
          )}
          {escrow.pending && (
            <p className="rounded-lg bg-[var(--brand-soft)] px-3 py-2 text-xs text-[var(--brand-dark)]">
              {escrow.pending}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {statusMsg && (
        <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[#067a68]">{statusMsg}</p>
      )}

      <div className="card space-y-4">
        <h2 className="font-display text-lg font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          {isClient && job.status === "Draft" && (
            <SubmitButton onClick={() => act("publish")}>Publish listing</SubmitButton>
          )}
          {isClient && job.status === "Published" && (
            <SubmitButton onClick={fundEscrow}>
              {live ? "Approve USDC & fund escrow" : "Fund escrow"}
            </SubmitButton>
          )}
          {isClient && job.status === "Funded" && !job.worker && (
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
              <input
                className="input"
                placeholder="Worker wallet 0x…"
                value={workerAddress}
                onChange={(e) => setWorkerAddress(e.target.value)}
              />
              <SubmitButton
                onClick={() => act("assign", { workerAddress: workerAddress || address })}
              >
                Assign worker
              </SubmitButton>
            </div>
          )}
          {job.status === "Funded" && address && !isClient && (
            <SubmitButton onClick={() => act("assign", { workerAddress: address })}>
              Accept assignment
            </SubmitButton>
          )}
          {isWorker && job.status === "Assigned" && (
            <SubmitButton onClick={() => act("start")}>Start work</SubmitButton>
          )}
          {isWorker && ["InProgress", "RevisionRequested"].includes(job.status) && (
            <div className="w-full space-y-2">
              <textarea
                className="input min-h-[80px]"
                placeholder="Delivery notes"
                value={deliverNote}
                onChange={(e) => setDeliverNote(e.target.value)}
              />
              <input
                className="input"
                placeholder="Artifact URL (optional)"
                value={artifactUrl}
                onChange={(e) => setArtifactUrl(e.target.value)}
              />
              <SubmitButton onClick={submitDelivery}>
                {live ? "Deliver on-chain" : "Submit delivery"}
              </SubmitButton>
            </div>
          )}
          {isClient && job.status === "Delivered" && (
            <>
              <SubmitButton onClick={acceptRelease}>
                {live ? "Accept & release on-chain" : "Accept & release USDC"}
              </SubmitButton>
              <SubmitButton
                className="btn-secondary"
                onClick={() =>
                  act("revision", {
                    reason: "Needs fixes against checklist",
                    remainingIssues: ["Address open checklist items"],
                  })
                }
              >
                Request revision ({job.revisionsUsed}/{cfg?.revisionLimit ?? 2})
              </SubmitButton>
            </>
          )}
          {["Delivered", "RevisionRequested", "InProgress"].includes(job.status) &&
            (isClient || isWorker) && (
              <SubmitButton
                className="btn-secondary"
                onClick={() =>
                  act("dispute", { reason: "Opening dispute with evidence to follow" })
                }
              >
                Open dispute
              </SubmitButton>
            )}
        </div>
      </div>
    </div>
  );
}
