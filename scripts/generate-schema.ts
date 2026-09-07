/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

/**
 * Emits portable schema artifacts from the canonical zod definition.
 *
 * `src/lib/schema.ts` is the single source of truth. This script derives the
 * language-neutral forms so consumers outside TypeScript can validate a skill
 * definition without reimplementing the schema by hand — and so those forms
 * cannot drift, because they are generated rather than maintained.
 *
 * Run with `npm run generate:schema`. CI should run it and fail if the working
 * tree changes, which proves the committed artifacts match the source.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { stringify } from "yaml";
import { zodToJsonSchema } from "zod-to-json-schema";
import { skillSchema } from "../src/lib/schema";

const OUT = join(process.cwd(), "schema");

// No `name`: that would nest the schema under `definitions` and leave a bare
// $ref at the root, which is awkward for consumers to use directly.
const jsonSchema = zodToJsonSchema(skillSchema, {
  $refStrategy: "none",
  target: "jsonSchema7",
}) as Record<string, unknown>;
delete jsonSchema.$schema;

const annotated = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://github.com/jersonboydmilan/Agent-Skills-Compendium/schema/skill.schema.json",
  title: "Agent Skill",
  description:
    "The canonical Agent Skill Specification. Generated from src/lib/schema.ts — " +
    "edit that file, then run `npm run generate:schema`. Do not edit by hand.",
  ...jsonSchema,
};

writeFileSync(join(OUT, "skill.schema.json"), `${JSON.stringify(annotated, null, 2)}\n`);
writeFileSync(
  join(OUT, "skill.schema.yaml"),
  `# Agent Skills Compendium\n` +
    `# Copyright © 2026 Jerson Boyd Milan\n#\n` +
    `# GENERATED FILE — do not edit.\n` +
    `# Source of truth: src/lib/schema.ts\n` +
    `# Regenerate with: npm run generate:schema\n\n` +
    stringify(annotated, { lineWidth: 100 }),
);

const props = Object.keys(
  ((annotated as Record<string, unknown>).properties ?? {}) as Record<string, unknown>,
);
const required = ((annotated as Record<string, unknown>).required ?? []) as string[];
console.log(`schema/skill.schema.json  ${props.length} properties, ${required.length} required`);
console.log(`schema/skill.schema.yaml  written`);

// ---------------------------------------------------------------------------
// Self-test: the generated schema must accept every skill in the registry.
// A schema nobody can validate against is documentation, not an interface.
// ---------------------------------------------------------------------------
import { readFileSync, readdirSync } from "node:fs";
import { parse } from "yaml";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(annotated);

const skillDir = join(process.cwd(), "content", "skills");
const failures: string[] = [];
let checked = 0;

for (const file of readdirSync(skillDir).filter((f) => f.endsWith(".yaml"))) {
  const doc = parse(readFileSync(join(skillDir, file), "utf8")) as { skill: unknown };
  checked += 1;
  if (!validate(doc.skill)) {
    const detail = (validate.errors ?? [])
      .slice(0, 3)
      .map((e) => `${e.instancePath || "/"} ${e.message}`)
      .join("; ");
    failures.push(`${file}: ${detail}`);
  }
}

if (failures.length) {
  console.error(`\nGenerated schema rejected ${failures.length} of ${checked} skills:`);
  for (const f of failures.slice(0, 5)) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`self-test              ${checked}/${checked} registry skills validate against it`);
