"use client";

import Link from "next/link";
import { InfoCallout, StepRail, QuickLinks } from "@/components/PageChrome";
import {
  HeroCopy,
  HeroLine,
  LaneMotionBackdrop,
  MotionCard,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/motion";

export default function HomePage() {
  return (
    <div className="w-full overflow-x-clip">
      <section className="relative w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/paylane-hero-lanes.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#eef3fb]/95 via-[#eef3fb]/88 to-[#eef3fb]/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />
        <LaneMotionBackdrop />
        <div className="lane-rail lane-animated absolute bottom-0 left-0 right-0 h-1.5" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 md:min-h-[min(72vh,40rem)] md:py-20 lg:px-8">
          <HeroCopy>
            <HeroLine
              as="p"
              className="font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl md:text-7xl"
            >
              Paylane
            </HeroLine>
            <HeroLine
              as="h1"
              className="mt-4 max-w-2xl font-display text-xl font-semibold leading-snug text-[var(--ink-soft)] sm:mt-5 sm:text-2xl md:text-3xl"
            >
              The USDC lane for work and agents on Arc and Base.
            </HeroLine>
            <HeroLine
              as="p"
              className="mt-3 max-w-xl text-sm text-[var(--muted)] sm:mt-4 sm:text-base md:text-lg"
            >
              Escrow protects freelance jobs. Instant x402 pay unlocks APIs. One wallet, clear rules,
              and receipts on Arc Testnet or Base Sepolia today.
            </HeroLine>
            <HeroLine className="mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
              <Link href="/jobs/new" className="btn-primary w-full sm:w-auto">
                Post a job
              </Link>
              <Link href="/agents" className="btn-secondary w-full sm:w-auto">
                Pay an API
              </Link>
              <Link
                href="/docs"
                className="btn-ghost w-full justify-center sm:w-auto sm:justify-start"
              >
                Docs →
              </Link>
            </HeroLine>
          </HeroCopy>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-20 md:pt-24 lg:px-8">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold">How money moves</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Two products, two rulebooks — never mixed. Pick the lane that matches your work.
          </p>
        </Reveal>
        <Stagger className="mt-8 grid gap-6 md:grid-cols-2">
          <StaggerItem>
            <MotionCard className="card h-full overflow-hidden p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/paylane-mode-escrow.png"
                alt="Escrow vault illustration"
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <span className="badge badge-brand">Mode A · Humans</span>
                <h3 className="font-display mt-3 text-xl font-semibold">Hire / Work escrow</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Client locks full USDC in a non-custodial smart contract before paid work starts.
                  Worker delivers against a checklist. Accept, revise (max 2), dispute, or
                  auto-release after silence — no blind trust.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
                  <li>· 2% fee only on release to worker</li>
                  <li>· Auto-release protects workers from ghosting</li>
                  <li>· Admin can split disputed escrow</li>
                </ul>
                <Link
                  href="/jobs"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--brand)]"
                >
                  Browse jobs →
                </Link>
              </div>
            </MotionCard>
          </StaggerItem>
          <StaggerItem>
            <MotionCard className="card h-full overflow-hidden p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/paylane-mode-api.png"
                alt="API micropayments illustration"
                className="h-48 w-full object-cover"
              />
              <div className="p-5">
                <span className="badge badge-ok">Mode B · Machines</span>
                <h3 className="font-display mt-3 text-xl font-semibold">API / Agent pay</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                  Sellers meter endpoints. Buyers and agents pay per request via HTTP 402 (x402).
                  Payment unlocks access immediately — this is not freelance escrow and successful
                  responses are generally final.
                </p>
                <ul className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
                  <li>· Spend caps & kill switch for agents</li>
                  <li>· Usage logs + unified receipts</li>
                  <li>· Credit if seller returns 5xx after valid pay</li>
                </ul>
                <Link
                  href="/api-seller"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--accent)]"
                >
                  Monetize an endpoint →
                </Link>
              </div>
            </MotionCard>
          </StaggerItem>
        </Stagger>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display mb-8 text-2xl font-semibold">Typical escrow journey</h2>
        </Reveal>
        <StepRail
          steps={[
            {
              title: "Post & fund",
              body: "Publish a job with a checklist, then lock USDC in PaylaneEscrow on Arc.",
            },
            {
              title: "Assign & deliver",
              body: "Worker starts only after Funded. Delivery includes notes and artifacts.",
            },
            {
              title: "Review",
              body: "Accept, request revision (≤2), or open a dispute within the review window.",
            },
            {
              title: "Settle",
              body: "Release to worker, auto-release on silence, or admin split — all receipted.",
            },
          ]}
        />
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-20 pt-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold">Explore Paylane</h2>
        </Reveal>
        <QuickLinks
          links={[
            { href: "/dashboard", label: "Dashboard", desc: "Jobs needing action, volume, roles" },
            { href: "/receipts", label: "Receipts", desc: "Unified ledger for jobs & API pays" },
            { href: "/trust", label: "Trust Center", desc: "Money rules, disputes, risk" },
            { href: "/settings", label: "Settings", desc: "Network, escrow address, LIVE vs demo" },
            { href: "/docs/networks", label: "Arc + Base networks", desc: "Multi-chain env & deploy" },
            { href: "/docs/for-officials", label: "For officials", desc: "Arc / Circle alignment" },
          ]}
        />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="card flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Built for Arc and Base</h2>
              <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                Escrow is live on Arc Testnet via an upgradeable proxy. Add Base Sepolia from the
                header network menu — deploy escrow per chain, same app.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/settings" className="btn-primary">
                View network
              </Link>
              <Link href="/trust" className="btn-secondary">
                Trust Center
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <InfoCallout title="Non-custodial by design">
              <p>
                Paylane never holds your USDC in a platform hot wallet. Mode A funds sit in the
                escrow contract; Mode B settles via payment proofs / Gateway patterns.
              </p>
            </InfoCallout>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
