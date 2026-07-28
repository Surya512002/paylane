"use client";

import { formatDistanceToNow } from "date-fns";
import clsx from "clsx";

const STEPS = [
  "Draft",
  "Published",
  "Funded",
  "Assigned",
  "InProgress",
  "Delivered",
  "RevisionRequested",
  "Accepted",
  "Disputed",
  "Resolved",
  "AutoReleased",
  "Cancelled",
  "Expired",
] as const;

export function JobTimeline({
  status,
  reviewDeadline,
  deliveredAt,
}: {
  status: string;
  reviewDeadline?: string | null;
  deliveredAt?: string | null;
}) {
  const idx = STEPS.indexOf(status as (typeof STEPS)[number]);
  const active = idx >= 0 ? idx : 0;

  return (
    <div className="space-y-4">
      <ol className="flex flex-wrap gap-2">
        {["Draft", "Published", "Funded", "InProgress", "Delivered", "Accepted"].map((s) => {
          const stepIdx = STEPS.indexOf(s as (typeof STEPS)[number]);
          const done = active >= stepIdx;
          const current = status === s || (s === "InProgress" && ["Assigned", "InProgress"].includes(status));
          return (
            <li
              key={s}
              className={clsx(
                "rounded-full px-3 py-1 text-xs",
                done ? "bg-[var(--brand)]/15 text-[var(--brand-dark)]" : "bg-[var(--border)]/40 text-[var(--muted)]",
                current && "ring-2 ring-[var(--brand)]",
              )}
            >
              {s.replace(/([A-Z])/g, " $1").trim()}
            </li>
          );
        })}
      </ol>
      {reviewDeadline && ["Delivered", "RevisionRequested"].includes(status) && (
        <p className="text-sm text-[var(--muted)]">
          Auto-release{" "}
          {new Date(reviewDeadline) > new Date()
            ? `in ${formatDistanceToNow(new Date(reviewDeadline))}`
            : "eligible now"}
          {deliveredAt && ` · delivered ${formatDistanceToNow(new Date(deliveredAt), { addSuffix: true })}`}
        </p>
      )}
    </div>
  );
}
