"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { SubmitButton } from "@/components/SubmitButton";
import { UsdcAmount } from "@/components/UsdcAmount";
import { EmptyState } from "@/components/EmptyState";
import { createDemoPaymentProof } from "@/lib/x402-client";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout, StepRail } from "@/components/PageChrome";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export default function AgentsPage() {
  const { address } = useAccount();
  const [policy, setPolicy] = useState<{
    dailySpendCapMinor?: string | null;
    paused: boolean;
    allowlistedHosts?: string[];
  } | null>(null);
  const [usage, setUsage] = useState<
    Array<{ id: string; amountMinor: string; status: string; resource: { name: string } }>
  >([]);
  const [weather, setWeather] = useState<object | null>(null);
  const [cap, setCap] = useState("10");
  const [hosts, setHosts] = useState("localhost,127.0.0.1");
  const [cfg, setCfg] = useState<{
    demoMode?: boolean;
    faucetUrl?: string | null;
    chainName?: string;
  } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [d, c] = await Promise.all([
      fetch("/api/agent/policy").then((r) => r.json()),
      fetch("/api/config").then((r) => r.json()),
    ]);
    setPolicy(d.policy ?? { paused: false });
    setUsage(d.usage ?? []);
    setCfg(c);
    if (d.policy?.dailySpendCapMinor) {
      setCap(String(Number(d.policy.dailySpendCapMinor) / 1_000_000));
    }
    if (d.policy?.allowlistedHosts?.length) {
      setHosts(d.policy.allowlistedHosts.join(","));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePolicy() {
    await fetch("/api/agent/policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailySpendCapMinor: cap ? String(Math.round(Number(cap) * 1_000_000)) : null,
        allowlistedHosts: hosts
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        paused: policy?.paused ?? false,
      }),
    });
    await load();
  }

  async function togglePause() {
    await fetch("/api/agent/policy", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailySpendCapMinor: policy?.dailySpendCapMinor ?? null,
        allowlistedHosts: policy?.allowlistedHosts ?? [],
        paused: !(policy?.paused ?? false),
      }),
    });
    await load();
  }

  async function payWeather() {
    setErr(null);
    const buyer = address ?? "0x4444444444444444444444444444444444444444";
    const idempotencyKey = `pay-${Date.now()}`;
    const res1 = await fetch("/api/demo/paid-weather", {
      headers: { "x-buyer-address": buyer, "x-idempotency-key": idempotencyKey },
    });
    if (res1.status === 402) {
      const hint = res1.headers.get("X-Demo-Proof-Hint");
      const proof =
        hint ??
        createDemoPaymentProof({
          resourceId: "seed",
          buyerAddress: buyer,
          amountMinor: 10000n,
          idempotencyKey,
        });
      const res2 = await fetch("/api/demo/paid-weather", {
        headers: {
          "x-buyer-address": buyer,
          "x-idempotency-key": idempotencyKey,
          "x-payment": proof,
        },
      });
      const body = await res2.json();
      if (!res2.ok) {
        setErr(body.error ?? "Payment failed");
        return;
      }
      setWeather(body);
    } else {
      setWeather(await res1.json());
    }
    await load();
  }

  return (
    <div className="space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Mode B · API / Agents"
        title="Agent spend desk"
        subtitle="Instant access-for-payment on Arc — not freelance escrow. Set caps, allowlists, and a kill switch before your agent pays metered APIs."
        imageSrc="/brand/paylane-mode-api.png"
        imageAlt="API payments illustration"
        actions={
          <>
            <Link href="/docs/user-guide-agents" className="btn-secondary text-sm">
              Agent guide
            </Link>
            <Link href="/api-seller" className="btn-ghost text-sm">
              Sell an API →
            </Link>
          </>
        }
      />

      <InfoCallout title="Mode B is different from jobs" tone="ok">
        <p>
          Successful API responses are generally <strong>non-refundable</strong>. There is no
          accept/dispute flow like Mode A. If a seller returns 5xx after a valid payment, Paylane
          issues a credit by default.
        </p>
      </InfoCallout>

      <StepRail
        steps={[
          { title: "Fund", body: "Hold USDC / Gateway balance for nanopayments on Arc." },
          { title: "Policy", body: "Daily cap, host allowlist, kill switch." },
          { title: "402 → pay", body: "Unpaid calls get HTTP 402 with exact price requirements." },
          { title: "Receipt", body: "Every successful paid call lands in your ledger." },
        ]}
      />

      <Reveal>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold tracking-tight">Spend policy</h2>
              <span className={policy?.paused ? "badge badge-warn" : "badge badge-ok"}>
                {policy?.paused ? "Paused" : "Active"}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Policies apply to agent operators signed into Paylane on {cfg?.chainName ?? "Arc"}.
            </p>
            <label className="block">
              <span className="label">Daily spend cap (USDC)</span>
              <input className="input" value={cap} onChange={(e) => setCap(e.target.value)} />
            </label>
            <label className="block">
              <span className="label">Allowlisted hosts</span>
              <input className="input" value={hosts} onChange={(e) => setHosts(e.target.value)} />
            </label>
            <div className="flex flex-wrap gap-2">
              <SubmitButton onClick={savePolicy}>Save policy</SubmitButton>
              <SubmitButton className="btn-secondary" onClick={togglePause}>
                {policy?.paused ? "Resume spending" : "Kill switch"}
              </SubmitButton>
            </div>
            {cfg?.faucetUrl && (
              <a
                href={cfg.faucetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-[var(--brand)]"
              >
                Get testnet USDC from Circle faucet →
              </a>
            )}
          </div>

          <div className="card space-y-4">
            <h2 className="font-display text-lg font-semibold tracking-tight">Try a paid endpoint</h2>
            <p className="text-sm text-[var(--muted)]">
              Demo resource{" "}
              <code className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-xs">
                /api/demo/paid-weather
              </code>{" "}
              — unpaid returns 402, then pay ~$0.01 USDC equivalent to unlock JSON weather.
            </p>
            <SubmitButton onClick={payWeather}>Pay $0.01 & fetch</SubmitButton>
            {err && <p className="text-sm text-[var(--danger)]">{err}</p>}
            {weather && (
              <pre className="overflow-auto rounded-xl bg-[var(--ink)] p-4 text-xs text-white/90">
                {JSON.stringify(weather, null, 2)}
              </pre>
            )}
            <p className="text-xs text-[var(--muted)]">
              CLI: <code>examples/agent-buyer</code> ·{" "}
              <Link href="/receipts" className="font-semibold text-[var(--brand)]">
                View receipts →
              </Link>
            </p>
          </div>
        </div>
      </Reveal>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight">Recent usage</h2>
        {usage.length === 0 ? (
          <EmptyState title="No paid calls yet" description="Run a paid request to populate usage." />
        ) : (
          <Stagger className="space-y-2">
            {usage.map((u) => (
              <StaggerItem key={u.id}>
                <div className="card flex justify-between text-sm">
                  <span>
                    {u.resource.name} · {u.status}
                  </span>
                  <UsdcAmount minor={u.amountMinor} />
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
