import { listDocs } from "@/lib/docs";
import { DocsHomeClient } from "@/components/DocsHomeClient";

export default function DocsPage() {
  const docs = listDocs();
  return <DocsHomeClient docs={docs} />;
}
