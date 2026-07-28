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
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-4 text-sm">
        {DOC_SECTIONS.map((section) => {
          const items = all.filter((d) => d.section === section);
          if (items.length === 0) return null;
          return (
            <div key={section}>
              <p className="mb-2 font-medium text-[var(--muted)]">{section}</p>
              <ul className="space-y-1">
                {items.map((d) => (
                  <li key={d.slug}>
                    <Link
                      href={`/docs/${d.slug}`}
                      className={d.slug === slug ? "text-[var(--brand-dark)] font-medium" : "hover:text-[var(--brand)]"}
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
      <article className="prose-paylane max-w-3xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
      </article>
    </div>
  );
}
