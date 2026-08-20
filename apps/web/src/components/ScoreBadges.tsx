"use client";

export function ScoreBadges({
  trust,
  merit,
  completed,
  hired,
  rating,
}: {
  trust: number;
  merit: number;
  completed?: number;
  hired?: number;
  rating?: number | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="stat">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Trust</p>
        <p className="font-display mt-1 text-2xl font-bold text-[var(--ink)]">{trust}</p>
        <p className="text-[10px] text-[var(--muted)]">/ 100</p>
      </div>
      <div className="stat">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Merit</p>
        <p className="font-display mt-1 text-2xl font-bold text-[var(--brand)]">{merit}</p>
        <p className="text-[10px] text-[var(--muted)]">from completed work</p>
      </div>
      <div className="stat">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Jobs done</p>
        <p className="font-display mt-1 text-2xl font-bold">{completed ?? 0}</p>
        {hired != null && hired > 0 && (
          <p className="text-[10px] text-[var(--muted)]">{hired} hired as client</p>
        )}
      </div>
      <div className="stat">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Rating</p>
        <p className="font-display mt-1 text-2xl font-bold">
          {rating != null ? rating.toFixed(1) : "—"}
        </p>
        <p className="text-[10px] text-[var(--muted)]">avg review</p>
      </div>
    </div>
  );
}
