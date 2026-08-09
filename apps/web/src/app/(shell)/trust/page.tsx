import Link from "next/link";
import { publicConfig } from "@/lib/config";
import { PageHero, InfoCallout, StepRail } from "@/components/PageChrome";

export default function TrustPage() {
  const cfg = publicConfig();

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Trust Center"
        title="How Paylane protects money"
        subtitle="Clear separation of Mode A escrow vs Mode B instant pay — for users, operators, and Arc/Circle officials."
        imageSrc="/brand/paylane-hero-lanes.png"
        imageAlt=""
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card animate-rise overflow-hidden p-0">
          <img
            src="/brand/paylane-mode-escrow.png"
            alt="Escrow"
            className="h-40 w-full object-cover"
          />
          <div className="p-4 text-sm">
            <p className="font-semibold text-[var(--ink)]">Mode A — Escrow</p>
            <p className="mt-1 text-[var(--muted)]">
              Funds locked on-chain before work. Accept / revise / dispute / auto-release.
            </p>
          </div>
        </div>
        <div className="card animate-rise-delay overflow-hidden p-0">
          <img src="/brand/paylane-mode-api.png" alt="API pay" className="h-40 w-full object-cover" />
          <div className="p-4 text-sm">
            <p className="font-semibold text-[var(--ink)]">Mode B — Instant pay</p>
            <p className="mt-1 text-[var(--muted)]">
              x402 access-for-payment. No freelance dispute flow after a successful response.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="stat animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">Network</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">{cfg.chainName}</p>
          <p className="text-xs text-[var(--muted)]">ID {cfg.chainId}</p>
        </div>
        <div className="stat animate-rise-delay">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">Platform fee</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">{cfg.platformFeeBps / 100}%</p>
          <p className="text-xs text-[var(--muted)]">On worker release only</p>
        </div>
        <div className="stat animate-rise-delay-2">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">Review window</p>
          <p className="mt-2 font-semibold text-[var(--ink)]">{cfg.reviewWindowHours}h</p>
          <p className="text-xs text-[var(--muted)]">Then auto-release</p>
        </div>
      </div>

      <InfoCallout title="Live escrow address" tone={cfg.escrowAddress ? "ok" : "warn"}>
        <p className="font-mono text-xs break-all">
          USDC {cfg.usdcAddress}
          <br />
          Escrow {cfg.escrowAddress ?? "Not deployed"}
        </p>
        <a
          href={cfg.explorerUrl}
          className="mt-2 inline-block font-semibold"
          target="_blank"
          rel="noreferrer"
        >
          Open explorer →
        </a>
      </InfoCallout>

      <StepRail
        steps={[
          {
            title: "Non-custodial",
            body: "No platform omnibus hot wallet for user funds.",
          },
          {
            title: "Auditable",
            body: "DB receipts + on-chain events when LIVE.",
          },
          {
            title: "Hostile-user ready",
            body: "Auto-release, revisions, disputes, rate limits.",
          },
          {
            title: "Mainnet path",
            body: "Env switch + checklist — same product surface.",
          },
        ]}
      />

      <ul className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/docs/money-rules", label: "Money rules", desc: "Fees, release, API credits" },
          { href: "/docs/dispute-policy", label: "Dispute policy", desc: "Evidence & admin splits" },
          {
            href: "/docs/safety-and-protections",
            label: "Safety & protections",
            desc: "Threat model",
          },
          { href: "/docs/risk-disclosure", label: "Risk disclosure", desc: "What can go wrong" },
          { href: "/docs/for-officials", label: "For officials", desc: "Arc / Circle alignment" },
          { href: "/docs/arc-testnet-guide", label: "Arc Testnet guide", desc: "Go live steps" },
          { href: "/docs/mainnet-checklist", label: "Mainnet checklist", desc: "Production gates" },
          { href: "/settings", label: "Settings", desc: "LIVE vs demo status" },
        ].map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="card block hover:border-[var(--brand)]">
              <p className="font-semibold">{l.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{l.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
