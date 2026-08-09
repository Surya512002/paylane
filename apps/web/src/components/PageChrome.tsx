"use client";

import Link from "next/link";
import clsx from "clsx";
import { MotionCard, Reveal, Stagger, StaggerItem } from "@/components/motion";

export function PageHero({
  eyebrow,
  title,
  subtitle,
  actions,
  imageSrc,
  imageAlt,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}) {
  return (
    <Reveal
      className={clsx(
        "relative overflow-hidden border border-[var(--border)] bg-[var(--surface)]",
        "rounded-[var(--radius-2xl)] shadow-[var(--shadow-sm)]",
        imageSrc && "md:grid md:grid-cols-[1.2fr_0.8fr]",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden>
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-[var(--brand)]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-[var(--accent)]/10 blur-3xl" />
      </div>
      <div className="relative z-10 p-5 pb-7 sm:p-7 sm:pb-9 md:p-9 md:pb-10">
        {eyebrow && <p className="badge badge-brand mb-3">{eyebrow}</p>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
          {subtitle}
        </p>
        {actions && <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">{actions}</div>}
      </div>
      {imageSrc && (
        <div className="relative flex min-h-[11rem] items-center justify-center bg-[var(--surface-2)]/70 md:min-h-[14rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt ?? ""}
            className="h-full max-h-52 w-full object-contain p-4 md:max-h-none md:min-h-[14rem] md:object-cover md:object-center md:p-0"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)]/45 to-transparent md:from-[var(--surface)]/90 md:via-[var(--surface)]/30" />
        </div>
      )}
    </Reveal>
  );
}

export function InfoCallout({
  title,
  children,
  tone = "brand",
}: {
  title: string;
  children: React.ReactNode;
  tone?: "brand" | "ok" | "warn";
}) {
  const tones = {
    brand: "border-[var(--brand)]/25 bg-[var(--brand-soft)]/70 text-[var(--brand-dark)]",
    ok: "border-[var(--accent)]/30 bg-[var(--accent-soft)]/70 text-[var(--accent-dark)]",
    warn: "border-amber-300/80 bg-[var(--warning-soft)] text-amber-950",
  };
  return (
    <aside
      className={clsx(
        "rounded-[var(--radius-lg)] border p-4 text-sm shadow-[var(--shadow-xs)]",
        tones[tone],
      )}
    >
      <p className="font-semibold tracking-tight">{title}</p>
      <div className="mt-2 space-y-1 text-[var(--ink-soft)] opacity-95">{children}</div>
    </aside>
  );
}

export function StepRail({
  steps,
}: {
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <StaggerItem key={s.title}>
          <MotionCard className="card-quiet relative h-full">
            <span className="font-display text-2xl font-bold text-[var(--brand)]/25">{i + 1}</span>
            <p className="mt-1 font-semibold text-[var(--ink)]">{s.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{s.body}</p>
          </MotionCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--muted)]">{label}</p>
      <p className="font-display mt-2 text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
        {value}
      </p>
    </div>
  );
}

export function QuickLinks({
  links,
}: {
  links: Array<{ href: string; label: string; desc: string }>;
}) {
  return (
    <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <StaggerItem key={l.href}>
          <MotionCard>
            <Link href={l.href} className="card block h-full">
              <p className="font-semibold text-[var(--ink)]">{l.label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{l.desc}</p>
            </Link>
          </MotionCard>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
