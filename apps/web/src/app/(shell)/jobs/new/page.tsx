"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseUsdcToMinor } from "@/lib/money";
import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout } from "@/components/PageChrome";
import { SessionGate } from "@/components/SessionGate";
import { useWalletSession } from "@/components/WalletSession";

export default function NewJobPage() {
  const router = useRouter();
  const wallet = useWalletSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("1");
  const [deadlineDays, setDeadlineDays] = useState("14");
  const [checklist, setChecklist] = useState(["Deliver source files", "Include README"]);
  const [cfg, setCfg] = useState<{
    platformFeeBps: number;
    reviewWindowHours: number;
    revisionLimit: number;
    chainName: string;
    demoMode?: boolean;
    escrowAddress?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => null);
  }, []);

  async function submit() {
    setError(null);
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const criteria = checklist.map((c) => c.trim()).filter(Boolean);

    if (trimmedTitle.length < 3) {
      setError("Title must be at least 3 characters");
      return;
    }
    if (trimmedDescription.length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }
    if (criteria.length < 1) {
      setError("Add at least one acceptance criterion");
      return;
    }

    let amountMinor: bigint;
    try {
      amountMinor = parseUsdcToMinor(amount);
    } catch {
      setError("Enter a valid USDC amount");
      return;
    }
    if (amountMinor <= 0n) {
      setError("Budget must be greater than 0 USDC");
      return;
    }

    const days = Number(deadlineDays);
    const deadlineAt =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null;

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmedTitle,
          description: trimmedDescription,
          amountMinor: amountMinor.toString(),
          checklist: criteria,
          deadlineAt,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not create job");
        return;
      }
      if (data.job?.id) router.push(`/jobs/${data.job.id}`);
      else setError("Job created but no id returned — refresh and check Dashboard");
    } catch {
      setError("Network error — check your connection and try again");
    }
  }

  const amountMinor = (() => {
    try {
      return parseUsdcToMinor(amount);
    } catch {
      return 0n;
    }
  })();
  const feeBps = cfg?.platformFeeBps ?? 10;
  const fee = (amountMinor * BigInt(feeBps)) / 10000n;
  const net = amountMinor - fee;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Mode A · New job"
        title="Post escrow-backed work"
        subtitle={`USDC locks in PaylaneEscrow on ${cfg?.chainName ?? "Arc Testnet"} — real testnet txs, not a simulation. Get USDC from the Circle faucet if needed.`}
        imageSrc="/brand/paylane-mode-escrow.png"
        imageAlt=""
      />

      {!wallet.ready && (
        <SessionGate
          title="Sign in to post a job"
          description="Connect on Arc Testnet, sign SIWE, then save a draft. Default budget is 1 USDC so a faucet is enough."
        />
      )}

      <InfoCallout title="How money works on this job" tone="brand">
        <ul className="list-disc space-y-1 pl-5">
          <li>Full amount locks when you fund</li>
          <li>
            {(feeBps / 100).toFixed(1)}% platform fee only on release to the worker (not on full
            refunds)
          </li>
          <li>
            After delivery you have {cfg?.reviewWindowHours ?? 72}h to accept, revise (max{" "}
            {cfg?.revisionLimit ?? 2}), or dispute — silence auto-releases to the worker
          </li>
        </ul>
        <Link
          href="/docs/money-rules"
          className="mt-2 inline-block text-xs font-semibold text-[var(--brand-dark)]"
        >
          Full money rules →
        </Link>
      </InfoCallout>

      <div className="card space-y-4">
        <label className="block">
          <span className="label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea
            className="input min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Budget (USDC)</span>
            <input className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Deadline (days)</span>
            <input
              className="input"
              value={deadlineDays}
              onChange={(e) => setDeadlineDays(e.target.value)}
            />
          </label>
        </div>
        <div className="rounded-xl bg-[var(--surface-2)] px-4 py-3 text-sm">
          <p>
            Gross <UsdcInline minor={amountMinor} /> · fee <UsdcInline minor={fee} /> · worker net{" "}
            <UsdcInline minor={net} />
          </p>
        </div>
        <div>
          <p className="label">Acceptance checklist (required)</p>
          {checklist.map((c, i) => (
            <input
              key={i}
              className="input mt-2"
              value={c}
              onChange={(e) => {
                const next = [...checklist];
                next[i] = e.target.value;
                setChecklist(next);
              }}
            />
          ))}
          <button
            type="button"
            className="btn-ghost mt-2 text-sm"
            onClick={() => setChecklist([...checklist, ""])}
          >
            + Criterion
          </button>
        </div>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <SubmitButton onClick={submit} disabled={!wallet.ready}>
          Save draft
        </SubmitButton>
      </div>
    </div>
  );
}

function UsdcInline({ minor }: { minor: bigint }) {
  const whole = minor / 1000000n;
  const frac = (minor % 1000000n).toString().padStart(6, "0");
  return (
    <span className="font-semibold">
      ${whole.toString()}.{frac} USDC
    </span>
  );
}
