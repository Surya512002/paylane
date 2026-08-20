"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { isAddress } from "viem";
import { useAccount } from "wagmi";
import { formatDistanceToNow } from "date-fns";
import { UsdcAmount } from "@/components/UsdcAmount";
import { SubmitButton } from "@/components/SubmitButton";
import { StatusBadge } from "@/components/StatusBadge";
import { NetworkBanner } from "@/components/NetworkBanner";
import { useEscrowActions } from "@/hooks/useEscrowActions";
import { resolveWalletChainConfig } from "@/components/ChainSwitcher";

interface DeliveryRow {
  id: string;
  note?: string | null;
  artifactUrl?: string | null;
  artifactHash?: string | null;
  createdAt: string;
}

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
  deliveries?: DeliveryRow[];
}

type Cfg = {
  demoMode: boolean;
  chainId?: number;
  escrowAddress?: string | null;
  usdcAddress: string;
  usdcDecimals?: number;
  reviewWindowHours: number;
  revisionLimit: number;
  platformFeeBps: number;
  explorerUrl: string;
  explorerName?: string;
  supportedChains: Array<{
    key: string;
    chainId: number;
    name: string;
    family: string;
    live: boolean;
    escrowAddress?: string | null;
    usdcAddress?: string;
    usdcDecimals?: number;
    explorerUrl?: string;
    explorerName?: string;
  }>;
};

const FLOW = ["Draft", "Published", "Funded", "Assigned", "InProgress", "Delivered", "Accepted"] as const;

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { address, chainId } = useAccount();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [me, setMe] = useState<{ id: string; walletAddress: string } | null>(null);
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [deliverNote, setDeliverNote] = useState("");
  const [artifactUrl, setArtifactUrl] = useState("");
  const [workerAddress, setWorkerAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const walletChain = resolveWalletChainConfig(chainId, cfg?.supportedChains ?? []);

  const escrow = useEscrowActions(
    walletChain
      ? {
          escrowAddress: (walletChain.escrowAddress as `0x${string}` | null) ?? null,
          usdcAddress: walletChain.usdcAddress as `0x${string}`,
          usdcDecimals: walletChain.usdcDecimals,
          demoMode: cfg?.demoMode ?? false,
        }
      : cfg
        ? {
            escrowAddress: (cfg.escrowAddress as `0x${string}` | null) ?? null,
            usdcAddress: cfg.usdcAddress as `0x${string}`,
            usdcDecimals: cfg.usdcDecimals ?? 6,
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
    setJob(j.job ?? null);
    setMe(m.user ?? null);
    setCfg(c);
    if (!j.job) {
      setLoadError(j.error === "Unauthorized" ? "Sign in to open this job." : (j.error ?? "Job not found"));
    } else {
      setLoadError(null);
    }
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
    const liveFund = !cfg.demoMode;
    const escrowAddr = walletChain?.escrowAddress ?? null;

    try {
      if (liveFund) {
        if (!address) {
          setError("Connect a wallet, then approve USDC to fund escrow.");
          return;
        }
        if (!escrowAddr) {
          setError(
            "Switch your wallet to Arc Testnet, then fund again.",
          );
          return;
        }
        const deadlineUnix = job.deadlineAt
          ? Math.floor(new Date(job.deadlineAt).getTime() / 1000)
          : 0;
        const result = await escrow.fundOnchain({
          jobDbId: job.id,
          amountMinor: BigInt(job.amountMinor),
          deadlineUnix,
        });
        if (result.mode !== "live" || !result.txHash || !result.onchainJobId) {
          setError("On-chain funding did not complete. Confirm network, USDC balance, and approvals.");
          return;
        }
        const ok = await act("fund", {
          txHash: result.txHash,
          onchainJobId: result.onchainJobId,
          chainId: walletChain?.chainId ?? cfg.chainId,
        });
        if (ok) setStatusMsg(`Funded on-chain · ${result.txHash.slice(0, 10)}…`);
        return;
      }

      const ok = await act("fund", { chainId: walletChain?.chainId });
      if (ok) setStatusMsg("Escrow funded");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function assignWorker(explicit?: string) {
    if (!job || !cfg) return;
    setError(null);
    setStatusMsg(null);
    const raw = (explicit || workerAddress || address || "").trim();
    if (!isAddress(raw)) {
      setError("Enter a valid worker wallet (0x…).");
      return;
    }
    const worker = raw as `0x${string}`;

    try {
      if (!cfg.demoMode) {
        if (!job.onchainJobId) {
          setError("This job has no on-chain id yet. Fund escrow on testnet first.");
          return;
        }
        if (me?.id !== job.client.id) {
          setError("On testnet the client must assign the worker on-chain.");
          return;
        }
        const result = await escrow.assignOnchain(job.onchainJobId, worker);
        if (result.mode !== "live") {
          setError("On-chain assign did not complete.");
          return;
        }
      }
      const ok = await act("assign", { workerAddress: worker });
      if (ok) setStatusMsg(`Worker assigned · ${worker.slice(0, 6)}…${worker.slice(-4)}`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function acceptRelease() {
    if (!job || !cfg) return;
    setError(null);
    try {
      if (!cfg.demoMode && job.onchainJobId) {
        const result = await escrow.acceptOnchain(job.onchainJobId);
        if (result.mode === "live") {
          const ok = await act("accept", { txHash: result.txHash });
          if (ok) setStatusMsg("Released on-chain");
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
    setError(null);
    setStatusMsg(null);
    const note = deliverNote.trim() || "Delivery submitted";
    const url = artifactUrl.trim();
    try {
      if (!cfg.demoMode) {
        if (!job.onchainJobId) {
          setError("This job has no on-chain id. Fund and assign on testnet first.");
          return;
        }
        const result = await escrow.deliverOnchain(job.onchainJobId, `${note}\n${url}`);
        if (result.mode !== "live") {
          setError("On-chain delivery did not complete. The assigned worker wallet must submit.");
          return;
        }
        const ok = await act("deliver", {
          note,
          artifactUrl: url || undefined,
          artifactHash: result.deliveryHash,
          txHash: result.txHash,
        });
        if (ok) {
          setStatusMsg("Work submitted on-chain");
          setDeliverNote("");
          setArtifactUrl("");
        }
        return;
      }
      const ok = await act("deliver", { note, artifactUrl: url || undefined });
      if (ok) {
        setStatusMsg("Work submitted");
        setDeliverNote("");
        setArtifactUrl("");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!job) {
    return (
      <div className="space-y-4">
        <NetworkBanner />
        <p className="text-[var(--muted)]">{loadError ?? "Loading job…"}</p>
      </div>
    );
  }

  const isClient = me?.id === job.client.id;
  const isWorker = me?.id === job.worker?.id;
  const fee = (Number(job.amountMinor) * (cfg?.platformFeeBps ?? 10)) / 10_000;
  const net = Number(job.amountMinor) - fee;
  const escrowAddr = walletChain ? walletChain.escrowAddress : (cfg?.escrowAddress ?? null);
  const live = Boolean(cfg && !cfg.demoMode && escrowAddr);
  const explorerUrl = walletChain?.explorerUrl ?? cfg?.explorerUrl;
  const deliveries = job.deliveries ?? [];
  const canSubmit =
    Boolean(isWorker) && ["Assigned", "InProgress", "RevisionRequested"].includes(job.status);

  const hint = !me
    ? "Sign in (SIWE) with the client or worker wallet to take actions."
    : job.status === "Draft" && isClient
      ? "1) Publish the listing. 2) Fund escrow with testnet USDC. 3) Assign a worker (yourself to test). 4) Submit work."
      : job.status === "Published" && isClient
        ? live
          ? "Fund escrow next: connect the client wallet on Arc Testnet, then approve USDC."
          : "Switch to Arc Testnet in the header, then fund escrow."
        : job.status === "Funded" && isClient && !job.worker
          ? "Assign a worker wallet so they can submit work. To test end-to-end, assign your own wallet."
          : canSubmit
            ? "Submit work below — notes or an artifact URL. On Arc this also calls markDelivered."
            : job.status === "Delivered" && isClient
              ? "Review the submission, then accept to release USDC on-chain."
              : isClient && !isWorker
                ? "You are the client on this job. Submission is done by the assigned worker wallet."
                : "No action for this wallet at the current step.";

  return (
    <div className="space-y-6">
      <NetworkBanner />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <span className={live ? "badge badge-ok" : "badge badge-muted"}>
              {live ? "On-chain escrow" : "Escrow pending"}
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
            Fee {(cfg?.platformFeeBps ?? 10) / 100}% on release → worker ≈{" "}
            <UsdcAmount minor={Math.round(net).toString()} />
          </p>
        </div>
      </div>

      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {FLOW.map((step, i) => {
          const current = FLOW.indexOf(job.status as (typeof FLOW)[number]);
          const done = current >= i || ["Accepted", "AutoReleased"].includes(job.status);
          const active = job.status === step;
          return (
            <li
              key={step}
              className={
                active
                  ? "rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-xs font-semibold text-[var(--brand-dark)]"
                  : done
                    ? "rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)]/60 px-3 py-2 text-xs text-[var(--accent-dark)]"
                    : "rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--muted)]"
              }
            >
              {i + 1}. {step === "InProgress" ? "Work" : step}
            </li>
          );
        })}
      </ol>

      <p className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--brand-soft)]/50 px-4 py-3 text-sm text-[var(--ink-soft)]">
        {hint}
      </p>

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
            <span className="break-all font-mono text-xs">{job.client.walletAddress}</span>
          </p>
          <p>
            <span className="text-[var(--muted)]">Worker</span>
            <br />
            <span className="break-all font-mono text-xs">
              {job.worker?.walletAddress ?? "Unassigned — assign a wallet to unlock submit"}
            </span>
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
                  : `${explorerUrl}/tx/${job.escrowTxHash}`
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

      <div className="card space-y-3">
        <h2 className="font-display text-lg font-semibold">Work submissions</h2>
        {deliveries.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            No submissions yet. After the job is funded and a worker is assigned, that worker submits
            notes and an optional artifact URL here.
          </p>
        ) : (
          <ul className="space-y-3">
            {deliveries.map((d) => (
              <li key={d.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <p className="whitespace-pre-wrap">{d.note || "Delivery"}</p>
                {d.artifactUrl && (
                  <a
                    href={d.artifactUrl}
                    className="mt-1 inline-block text-xs font-semibold text-[var(--brand-dark)]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Artifact →
                  </a>
                )}
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}
                </p>
              </li>
            ))}
          </ul>
        )}
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
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  className="input"
                  placeholder="Worker wallet 0x…"
                  value={workerAddress}
                  onChange={(e) => setWorkerAddress(e.target.value)}
                />
                <SubmitButton onClick={() => assignWorker()}>Assign worker</SubmitButton>
              </div>
              {address && (
                <SubmitButton className="btn-secondary" onClick={() => assignWorker(address)}>
                  Assign myself (test end-to-end)
                </SubmitButton>
              )}
            </div>
          )}
          {cfg?.demoMode && job.status === "Funded" && address && !isClient && !job.worker && (
            <SubmitButton onClick={() => act("assign", { workerAddress: address })}>
              Accept assignment
            </SubmitButton>
          )}
          {isWorker && job.status === "Assigned" && (
            <SubmitButton onClick={() => act("start")}>Start work</SubmitButton>
          )}
          {canSubmit && (
            <div className="w-full space-y-2 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]/60 p-3">
              <p className="text-sm font-semibold text-[var(--ink)]">Submit work</p>
              <textarea
                className="input min-h-[80px]"
                placeholder="What you delivered (required for a useful review)"
                value={deliverNote}
                onChange={(e) => setDeliverNote(e.target.value)}
              />
              <input
                className="input"
                placeholder="Artifact URL (GitHub, Drive, IPFS…)"
                value={artifactUrl}
                onChange={(e) => setArtifactUrl(e.target.value)}
              />
              <SubmitButton onClick={submitDelivery}>
                {live ? "Submit work on-chain" : "Submit work"}
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
