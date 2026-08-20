import { getPublicConfig } from "@/lib/config";
import { jsonOk } from "@/lib/api-utils";

export async function GET() {
  return jsonOk(await getPublicConfig());
}
