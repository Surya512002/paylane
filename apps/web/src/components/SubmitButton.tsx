"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export function SubmitButton({
  children,
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (busy) return;
    setBusy(true);
    try {
      await onClick?.(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      {...props}
      disabled={busy || props.disabled}
      onClick={handleClick}
      className={clsx(!className || !className.includes("btn-") ? "btn-primary" : null, className)}
    >
      {busy ? "Working…" : children}
    </button>
  );
}
