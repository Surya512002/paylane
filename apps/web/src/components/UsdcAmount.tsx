import { formatUsdc } from "@/lib/money";
import clsx from "clsx";

export function UsdcAmount({
  minor,
  className,
}: {
  minor: string | number | bigint;
  className?: string;
}) {
  return (
    <span className={clsx("font-mono tabular-nums text-[var(--brand-dark)]", className)}>
      {formatUsdc(minor)}
    </span>
  );
}
