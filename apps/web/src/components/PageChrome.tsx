import Link from "next/link";
import clsx from "clsx";

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
    <div
      className={clsx(
        "relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)]",
        imageSrc && "md:grid md:grid-cols-[1.2fr_0.8fr]",
      )}
    >
      <div className="relative z-10 p-6 pb-8 md:p-8 md:pb-10">
        {eyebrow && <p className="badge badge-brand mb-3">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
          {subtitle}
        </p>
        {actions && <div className="mt-6 flex flex-wrap gap-2">{actions}</div>}
      </div>
      {imageSrc && (
        <div className="relative min-h-[160px] md:min-h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt ?? ""}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--surface)] via-transparent to-transparent md:from-[var(--surface)]/80" />
        </div>
      )}
    </div>
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
    brand: "border-[var(--brand)]/25 bg-[var(--brand-soft)]/50 text-[var(--brand-dark)]",
    ok: "border-[var(--accent)]/30 bg-[var(--accent-soft)]/60 text-[#067a68]",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
  };
  return (
    <aside className={clsx("rounded-2xl border p-4 text-sm", tones[tone])}>
      <p className="font-semibold">{title}</p>
      <div className="mt-2 space-y-1 text-[var(--ink-soft)] opacity-90">{children}</div>
    </aside>
  );
}

export function StepRail({
  steps,
}: {
  steps: Array<{ title: string; body: string }>;
}) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="card-quiet relative">
          <span className="font-display text-2xl font-bold text-[var(--brand)]/30">{i + 1}</span>
          <p className="mt-1 font-semibold">{s.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="font-display mt-2 text-2xl font-bold md:text-3xl">{value}</p>
    </div>
  );
}

export function QuickLinks({
  links,
}: {
  links: Array<{ href: string; label: string; desc: string }>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="card block h-full transition hover:border-[var(--brand)]">
            <p className="font-semibold">{l.label}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{l.desc}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
