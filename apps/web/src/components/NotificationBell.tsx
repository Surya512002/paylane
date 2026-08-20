"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

type N = {
  id: string;
  title: string;
  body: string;
  href?: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<N[]>([]);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  async function load() {
    const r = await fetch("/api/notifications");
    if (!r.ok) return;
    const d = await r.json();
    setItems(d.notifications ?? []);
    setUnread(d.unread ?? 0);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  async function markAll() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    await load();
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn-ghost relative text-xs"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        Alerts
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button type="button" className="text-xs text-[var(--brand)]" onClick={markAll}>
                Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">No alerts yet — proposals and hires show here.</p>
          ) : (
            <ul className="max-h-64 space-y-2 overflow-auto">
              {items.slice(0, 12).map((n) => (
                <li
                  key={n.id}
                  className={`rounded-lg px-2 py-1.5 text-xs ${n.read ? "opacity-60" : "bg-[var(--brand-soft)]/40"}`}
                >
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => {
                        void markOne(n.id);
                        setOpen(false);
                      }}
                      className="font-semibold"
                    >
                      {n.title}
                    </Link>
                  ) : (
                    <p className="font-semibold">{n.title}</p>
                  )}
                  <p className="text-[var(--muted)]">{n.body}</p>
                  {n.createdAt && (
                    <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
