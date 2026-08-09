import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadDoc, listDocs, DOC_SECTIONS } from "@/lib/docs";

export default async function DocSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = loadDoc(slug);
  if (!doc) notFound();

  const all = listDocs();

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside className="section-panel h-fit space-y-4 p-4 text-sm lg:sticky lg:top-24">
        {DOC_SECTIONS.map((section) => {
          const items = all.filter((d) => d.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {section}
              </p>
              <ul className="space-y-0.5">
                {items.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/docs/${d.slug}`}
                      className={
                        d.slug === slug
                          ? "block rounded-lg bg-[var(--brand-soft)] px-2.5 py-1.5 font-semibold text-[var(--brand-dark)]"
                          : "block rounded-lg px-2.5 py-1.5 text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                      }
                    >
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </aside>
      <article className="section-panel prose-paylane max-w-3xl p-5 sm:p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </article>
    </div>
  );
}
