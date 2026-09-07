import { readFileSync } from "node:fs";
import { join } from "node:path";
import { apiText } from "@/lib/api";

/**
 * GET /api/schema — the canonical JSON Schema every definition validates against.
 *
 * The file is generated from src/lib/schema.ts by `npm run generate:schema`. It is
 * served here so a consumer can validate a definition without cloning the repository.
 */
const SCHEMA_PATH = join(process.cwd(), "schema", "skill.schema.json");

let cached: string | null = null;

export async function GET() {
  cached ??= readFileSync(SCHEMA_PATH, "utf8");
  return apiText(cached, "application/schema+json");
}
