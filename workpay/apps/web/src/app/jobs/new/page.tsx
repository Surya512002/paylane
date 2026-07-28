"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseUsdcToMinor } from "@/lib/money";
import { SubmitButton } from "@/components/SubmitButton";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout } from "@/components/PageChrome";

export default function NewJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("100");
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
    const days = Number(deadlineDays);
    const deadlineAt =
      Number.isFinite(days) && days > 0
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null;
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        amountMinor: parseUsdcToMinor(amount).toString(),
        checklist: checklist.filter(Boolean),
        deadlineAt,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create job");
      return;
    }
    if (data.job?.id) router.push(`/jobs/${data.job.id}`);
  }

  const amountMinor = (() => {
    try {
      return parseUsdcToMinor(amount);
    } catch {
      return 0n;
    }
  })();
  const feeBps = cfg?.platformFeeBps ?? 200;
  const fee = (amountMinor * BigInt(feeBps)) / 10000n;
  const net = amountMinor - fee;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Mode A · New job"
        title="Post escrow-backed work"
        subtitle={`Funds lock on ${cfg?.chainName ?? "Arc"} before paid work starts. Add clear checklist items so “done” isn’t ambiguous.`}
        imageSrc="/brand/paylane-mode-escrow.png"
        imageAlt=""
      />

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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <SubmitButton onClick={submit}>Save draft</SubmitButton>
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
