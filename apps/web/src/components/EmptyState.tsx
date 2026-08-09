import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="mx-auto mb-4 h-10 w-10 rounded-xl lane-rail opacity-90" aria-hidden />
      <h3 className="font-display text-lg font-semibold tracking-tight text-[var(--ink)]">{title}</h3>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--muted)]">{description}</p>
      )}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
