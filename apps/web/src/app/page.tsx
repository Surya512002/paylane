"use client";

import Link from "next/link";
import { Shield, Zap, Receipt, Globe, Wallet, ArrowRight } from "lucide-react";
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
import { useWalletSession } from "@/components/WalletSession";

export default function HomePage() {
  const w = useWalletSession();

  return (
    <div className="w-full overflow-x-clip">
      <section className="relative w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/paylane-hero-lanes.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/96 via-[var(--background)]/88 to-[var(--background)]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-[var(--brand-soft)]/20" />
        <div className="mesh-noise absolute inset-0 opacity-40" />
        <LaneMotionBackdrop />
        <div className="lane-rail lane-animated absolute bottom-0 left-0 right-0 h-1.5" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16 md:min-h-[min(78vh,44rem)] md:py-20 lg:px-8">
          <HeroCopy>
            <HeroLine className="flex flex-wrap items-center gap-2">
              <span className="badge badge-ok">Live on Arc Testnet</span>
              <span className="badge badge-brand">Non-custodial USDC</span>
            </HeroLine>
            <HeroLine
              as="p"
              className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl md:text-7xl"
            >
              Paylane
            </HeroLine>
            <HeroLine
              as="h1"
              className="mt-4 max-w-2xl font-display text-xl font-semibold leading-snug text-[var(--ink-soft)] sm:mt-5 sm:text-2xl md:text-3xl"
            >
              Lock work in escrow. Pay APIs in the same USDC lane.
            </HeroLine>
            <HeroLine
              as="p"
              className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)] sm:mt-4 sm:text-base md:text-lg"
            >
              Freelance jobs settle through a verified smart contract. Agents pay per request with
              x402. One wallet, receipts on-chain, no platform hot wallet.
            </HeroLine>
            <HeroLine className="mt-7 flex w-full flex-col gap-2.5 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-3">
              {!w.ready ? (
                <button
                  type="button"
                  className="btn-primary w-full sm:w-auto"
                  onClick={() => void (w.isConnected ? w.signIn() : w.connectWallet())}
                >
                  {w.isConnected ? "Sign in" : "Connect wallet"}
                </button>
              ) : (
                <Link href="/jobs/new" className="btn-primary w-full sm:w-auto">
                  Post a job
                </Link>
              )}
              <Link href="/jobs" className="btn-secondary w-full sm:w-auto">
                Browse marketplace
              </Link>
              <Link href="/docs" className="btn-ghost w-full justify-center sm:w-auto">
                Read the docs →
              </Link>
            </HeroLine>
          </HeroCopy>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Globe, label: "Network", value: "Arc Testnet", hint: "Chain 5042002 · live" },
            { icon: Shield, label: "Escrow fee", value: "0.1%", hint: "Only on worker release" },
            { icon: Zap, label: "API pay", value: "x402", hint: "HTTP 402 → unlock" },
            { icon: Receipt, label: "Custody", value: "None", hint: "Funds stay in contract" },
          ].map((s) => (
            <StaggerItem key={s.label}>
              <div className="stat flex gap-3">
                <s.icon className="mt-1 h-5 w-5 text-[var(--brand)]" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">
                    {s.label}
                  </p>
                  <p className="font-display text-xl font-bold tracking-tight">{s.value}</p>
                  <p className="text-xs text-[var(--muted)]">{s.hint}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="section-panel p-5 sm:p-7">
            <div className="lane-divider mb-4 w-12" />
            <h2 className="section-title">Getting started</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
              Paylane runs on real blockchain infrastructure. Follow these steps to use escrow-backed jobs.
            </p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { n: "1", t: "Connect wallet", d: "MetaMask on Arc Testnet (chain ID 5042002)" },
                { n: "2", t: "Sign in (SIWE)", d: "Sign a message to authenticate — no password needed" },
                { n: "3", t: "Post & fund", d: "Create a job, approve USDC if needed, then createJob + fundJob on escrow" },
                { n: "4", t: "Work & submit", d: "Assign a worker, submit delivery notes and artifacts" },
                { n: "5", t: "Accept & settle", d: "Client accepts → USDC releases to worker on-chain" },
              ].map((s) => (
                <li key={s.n} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <p className="font-display text-2xl font-bold text-[var(--brand)]/30">{s.n}</p>
                  <p className="font-semibold text-[var(--ink)]">{s.t}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{s.d}</p>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/jobs/new" className="btn-primary text-sm">
                Post your first job
              </Link>
              <a
                className="btn-secondary text-sm"
                href="https://faucet.circle.com"
                target="_blank"
                rel="noreferrer"
              >
                Get testnet USDC
              </a>
              <Link href="/docs" className="btn-ghost text-sm">
                Full documentation →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Reveal>
          <div className="lane-divider mb-5 w-12" />
          <h2 className="section-title">How money moves</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
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
                  auto-release after silence.
                </p>
                <Link href="/jobs" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">
                  Browse jobs <ArrowRight className="h-4 w-4" />
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
                  Sellers meter endpoints. Buyers and agents pay per request via HTTP 402. Payment
                  unlocks access immediately — not freelance escrow.
                </p>
                <Link
                  href="/api-seller"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]"
                >
                  Monetize an endpoint <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </MotionCard>
          </StaggerItem>
        </Stagger>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="lane-divider mb-5 w-12" />
          <h2 className="section-title mb-8">Typical escrow journey</h2>
        </Reveal>
        <StepRail
          steps={[
            { title: "Post & fund", body: "Publish a job, then lock USDC in PaylaneEscrow on testnet." },
            { title: "Assign & deliver", body: "Assign a worker (or yourself). Submit notes + artifacts." },
            { title: "Review", body: "Accept, request revision (≤2), or open a dispute." },
            { title: "Settle", body: "Release on-chain, auto-release on silence, or admin split." },
          ]}
        />
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-8 px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal>
          <div className="lane-divider mb-5 w-12" />
          <h2 className="section-title">Explore Paylane</h2>
        </Reveal>
        <QuickLinks
          links={[
            { href: "/dashboard", label: "Dashboard", desc: "Jobs needing action, volume, roles" },
            { href: "/receipts", label: "Ledger", desc: "Every fund, release, and API pay" },
            { href: "/trust", label: "Trust Center", desc: "Money rules, disputes, risk" },
            { href: "/settings", label: "Live status", desc: "Escrow addresses & explorers" },
            { href: "/docs/networks", label: "Networks", desc: "Arc Testnet (USDC native)" },
            { href: "/docs/for-officials", label: "For officials", desc: "Arc / Circle alignment" },
          ]}
        />
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div className="pointer-events-none absolute inset-0 opacity-90" aria-hidden style={{ background: "var(--lane-soft)" }} />
            <div className="relative z-10">
              <Wallet className="mb-3 h-6 w-6 text-[var(--brand)]" />
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Ready for the room
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                Open Settings to copy explorer links. Fund a tiny USDC job, submit work, then
                accept — judges can watch the txs land on Arcscan or Basescan.
              </p>
            </div>
            <div className="relative z-10 mt-6 flex flex-wrap gap-2 md:mt-0">
              <Link href="/settings" className="btn-primary">
                Live contracts
              </Link>
              <Link href="/trust" className="btn-secondary">
                Trust Center
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <InfoCallout title="Non-custodial by design">
              <p>
                Paylane never holds USDC in a platform hot wallet. Mode A funds sit in the escrow
                contract; Mode B settles via payment proofs.
              </p>
            </InfoCallout>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
