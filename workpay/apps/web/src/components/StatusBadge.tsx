import clsx from "clsx";

const STYLES: Record<string, string> = {
  Draft: "badge-muted",
  Published: "badge-brand",
  Funded: "badge-ok",
  Assigned: "badge-brand",
  InProgress: "badge-brand",
  Delivered: "badge-warn",
  RevisionRequested: "badge-warn",
  Accepted: "badge-ok",
  AutoReleased: "badge-ok",
  Disputed: "badge-warn",
  Resolved: "badge-ok",
  Cancelled: "badge-muted",
  Expired: "badge-muted",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span className={clsx("badge", STYLES[status] ?? "badge-muted", className)}>{status}</span>
  );
}
