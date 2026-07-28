"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DocMeta, DocSection } from "@/lib/docs";
import { PageHero, InfoCallout } from "@/components/PageChrome";

const SECTIONS: DocSection[] = ["Users", "Developers/Agents", "Trust & Safety", "For Officials"];

export function DocsHomeClient({ docs }: { docs: DocMeta[] }) {
  const [q, setQ] = useState("");
  const [section, setSection] = useState<DocSection | "All">("All");

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (section !== "All" && d.section !== section) return false;
      if (!q) return true;
      const hay = `${d.title} ${d.slug}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [docs, q, section]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Docs"
        title="Paylane documentation"
        subtitle="Practical guides for clients, workers, API sellers, agents, and officials — including the Arc Testnet go-live path."
        imageSrc="/brand/paylane-hero-lanes.png"
        imageAlt=""
      />
      <InfoCallout title="Start here" tone="brand">
        <p>
          New to Paylane? Read{" "}
          <Link href="/docs/product-overview" className="font-semibold underline">
            Product overview
          </Link>
          , then{" "}
          <Link href="/docs/arc-testnet-guide" className="font-semibold underline">
            Arc Testnet guide
          </Link>{" "}
          if you are funding real escrow.
        </p>
      </InfoCallout>
      <input
        className="input max-w-md"
        placeholder="Search docs…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {(["All", ...SECTIONS] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={
              section === s ? "badge badge-brand cursor-pointer" : "badge badge-muted cursor-pointer"
            }
          >
            {s}
          </button>
        ))}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((d) => (
          <li key={d.slug}>
            <Link href={`/docs/${d.slug}`} className="card block hover:border-[var(--brand)]">
              <p className="text-xs text-[var(--muted)]">{d.section}</p>
              <p className="font-medium">{d.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
