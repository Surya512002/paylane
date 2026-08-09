"use client";

import { useEffect, useState } from "react";
import { UsdcAmount } from "@/components/UsdcAmount";
import { SubmitButton } from "@/components/SubmitButton";
import { EmptyState } from "@/components/EmptyState";
import { parseUsdcToMinor } from "@/lib/money";
import Link from "next/link";
import { NetworkBanner } from "@/components/NetworkBanner";
import { PageHero, InfoCallout, StepRail } from "@/components/PageChrome";

interface Resource {
  id: string;
  name: string;
  path: string;
  description: string;
  priceMinor: string;
  enabled: boolean;
  _count?: { usageEvents: number };
}

export default function ApiSellerPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({
    name: "",
    path: "/api/v1/insight",
    description: "",
    price: "0.01",
  });
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/resources").then((res) => res.json());
    setResources(r.resources ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError(null);
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        path: form.path,
        description: form.description,
        priceMinor: parseUsdcToMinor(form.price).toString(),
        rateLimitPerMinute: 60,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Create failed");
      return;
    }
    setForm({ name: "", path: "/api/v1/insight", description: "", price: "0.01" });
    await load();
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    await load();
  }

  return (
    <div className="space-y-10">
      <NetworkBanner />
      <PageHero
        eyebrow="Mode B · Sellers"
        title="Monetize your API"
        subtitle="Price per request in USDC. Unpaid traffic gets HTTP 402. Verify payment before returning the resource — never conflate this with freelance escrow."
        imageSrc="/brand/paylane-mode-api.png"
        imageAlt="API seller illustration"
        actions={
          <Link href="/docs/user-guide-api-sellers" className="btn-secondary text-sm">
            Seller guide →
          </Link>
        }
      />

      <InfoCallout title="Instant-pay rules" tone="ok">
        <ul className="list-disc space-y-1 pl-5">
          <li>Return 402 until a valid payment proof is presented</li>
          <li>Successful responses are generally non-refundable</li>
          <li>Seller 5xx after valid pay → buyer credit (default)</li>
          <li>Disable an endpoint to stop new paid calls safely</li>
        </ul>
      </InfoCallout>

      <StepRail
        steps={[
          { title: "Register", body: "Create a paid resource with path + price." },
          { title: "Challenge", body: "Middleware issues x402 requirements." },
          { title: "Verify", body: "Only paid requests get the payload." },
          { title: "Settle", body: "Receipt + usage event in Paylane." },
        ]}
      />

      <div className="card space-y-4">
        <h2 className="font-display text-lg font-semibold">New paid resource</h2>
        <label className="block">
          <span className="label">Name</span>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Market insight API"
          />
        </label>
        <label className="block">
          <span className="label">Path</span>
          <input
            className="input font-mono text-xs"
            value={form.path}
            onChange={(e) => setForm({ ...form, path: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea
            className="input min-h-[80px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What the buyer receives after payment"
          />
        </label>
        <label className="block">
          <span className="label">Price per request (USDC)</span>
          <input
            className="input"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </label>
        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <SubmitButton onClick={create}>Create resource</SubmitButton>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Your endpoints</h2>
        {resources.length === 0 ? (
          <EmptyState
            title="No resources yet"
            description="Create a metered endpoint so agents can pay per call."
          />
        ) : (
          <ul className="space-y-3">
            {resources.map((r) => (
              <li key={r.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{r.name}</p>
                    <span className={r.enabled ? "badge badge-ok" : "badge badge-muted"}>
                      {r.enabled ? "Live" : "Off"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-[var(--muted)]">{r.path}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {r.description} · {r._count?.usageEvents ?? 0} paid calls
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <UsdcAmount minor={r.priceMinor} className="font-semibold" />
                  <SubmitButton
                    className="btn-secondary text-sm"
                    onClick={() => toggle(r.id, r.enabled)}
                  >
                    {r.enabled ? "Disable" : "Enable"}
                  </SubmitButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
