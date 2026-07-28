import fs from "fs";
import path from "path";

const DOCS_DIR = path.join(process.cwd(), "../../docs");

export type DocSection =
  | "Users"
  | "Developers/Agents"
  | "Trust & Safety"
  | "For Officials";

const SECTION_MAP: Record<string, DocSection> = {
  PRODUCT_OVERVIEW: "Users",
  USER_GUIDE_CLIENTS: "Users",
  USER_GUIDE_WORKERS: "Users",
  USER_GUIDE_API_SELLERS: "Users",
  USER_GUIDE_AGENTS: "Developers/Agents",
  FAQ: "Users",
  ARCHITECTURE: "Developers/Agents",
  CONTRACT_SPEC: "Developers/Agents",
  STATE_MACHINE: "Developers/Agents",
  ARC_TESTNET_GUIDE: "Developers/Agents",
  DISPUTE_POLICY: "Trust & Safety",
  SAFETY_AND_PROTECTIONS: "Trust & Safety",
  RISK_DISCLOSURE: "Trust & Safety",
  MONEY_RULES: "Trust & Safety",
  TERMS_STUB: "Trust & Safety",
  FOR_OFFICIALS: "For Officials",
  MAINNET_CHECKLIST: "For Officials",
  QA_CHECKLIST: "For Officials",
};

export function filenameToSlug(filename: string): string {
  return filename.replace(/\.md$/i, "").replace(/_/g, "-").toLowerCase();
}

export function slugToFilename(slug: string): string | null {
  if (!fs.existsSync(DOCS_DIR)) return null;
  const files = fs.readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
  const match = files.find((f) => filenameToSlug(f) === slug);
  return match ?? null;
}

function extractTitle(content: string, fallback: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return fallback.replace(/_/g, " ");
}

export interface DocMeta {
  slug: string;
  filename: string;
  title: string;
  section: DocSection;
}

export function listDocs(): DocMeta[] {
  if (!fs.existsSync(DOCS_DIR)) return [];
  return fs
    .readdirSync(DOCS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const base = filename.replace(/\.md$/, "");
      const content = fs.readFileSync(path.join(DOCS_DIR, filename), "utf8");
      return {
        slug: filenameToSlug(filename),
        filename,
        title: extractTitle(content, base),
        section: SECTION_MAP[base] ?? "Users",
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function loadDoc(slug: string): { meta: DocMeta; content: string } | null {
  const filename = slugToFilename(slug);
  if (!filename) return null;
  const content = fs.readFileSync(path.join(DOCS_DIR, filename), "utf8");
  const base = filename.replace(/\.md$/, "");
  return {
    meta: {
      slug,
      filename,
      title: extractTitle(content, base),
      section: SECTION_MAP[base] ?? "Users",
    },
    content,
  };
}

export const DOC_SECTIONS: DocSection[] = [
  "Users",
  "Developers/Agents",
  "Trust & Safety",
  "For Officials",
];
