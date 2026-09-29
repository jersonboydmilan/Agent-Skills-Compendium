/**
 * Agent Skills Compendium
 * Copyright © 2026 Jerson Boyd Milan
 */

import { z } from "zod";

/**
 * The canonical Agent Skill Specification.
 *
 * This file is the source of truth for the entire product. The UI, the search
 * index, the export endpoints and the composer are all generated from these
 * shapes. Adding a field here is the only supported way to add a field to the
 * system — nothing downstream may invent its own skill shape.
 */

export const LAYER_IDS = ["L1", "L2", "L3", "L4", "L5"] as const;
export const COMPLEXITIES = ["beginner", "intermediate", "advanced", "expert"] as const;
export const MATURITIES = ["experimental", "prototype", "beta", "production"] as const;
export const RISK_LEVELS = ["low", "medium", "high", "critical"] as const;

export type LayerId = (typeof LAYER_IDS)[number];
export type Complexity = (typeof COMPLEXITIES)[number];
export type Maturity = (typeof MATURITIES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

const slug = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "must be lowercase kebab or snake case");

const rating = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const inputSchema = z.object({
  name: z.string().min(1),
  required: z.boolean(),
  type: z.string().min(1),
  description: z.string().min(1),
});

export const procedureStepSchema = z.object({
  step: z.string().min(1),
  description: z.string().min(1),
});

export const decisionRuleSchema = z.object({
  condition: z.string().min(1),
  action: z.string().min(1),
});

export const outputSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
});

export const validationSchema = z.object({
  check: z.string().min(1),
});

export const failureModeSchema = z.object({
  failure: z.string().min(1),
  mitigation: z.string().min(1),
});

export const escalationSchema = z.object({
  condition: z.string().min(1),
  action: z.string().min(1),
});

export const exampleSchema = z.object({
  title: z.string().min(1),
  // zod v4 requires the key schema explicitly; v3's single-argument form is gone.
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()),
});

export const relatedSkillsSchema = z.object({
  prerequisites: z.array(slug).default([]),
  complementary: z.array(slug).default([]),
  successors: z.array(slug).default([]),
  related: z.array(slug).default([]),
});

export const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug,
  version: z.string().regex(/^\d+\.\d+\.\d+$/, "must be semver"),

  category: slug,
  layer: z.enum(LAYER_IDS),
  domain: z.string().nullable().default(null),

  description: z.string().min(1),
  purpose: z.string().min(1),

  trigger: z.string().min(1),
  inputs: z.array(inputSchema).min(1),
  prerequisites: z.array(slug).default([]),

  tools: z.array(slug).default([]),
  dependencies: z.array(z.string()).default([]),

  procedure: z.array(procedureStepSchema).min(2),
  decision_rules: z.array(decisionRuleSchema).default([]),
  outputs: z.array(outputSchema).min(1),
  validation: z.array(validationSchema).min(1),
  failure_modes: z.array(failureModeSchema).min(1),
  escalation: z.array(escalationSchema).default([]),
  examples: z.array(exampleSchema).default([]),

  related_skills: relatedSkillsSchema.default({
    prerequisites: [],
    complementary: [],
    successors: [],
    related: [],
  }),

  complexity: z.enum(COMPLEXITIES),
  build_speed: rating,
  shareability: rating,
  maturity: z.enum(MATURITIES),

  tags: z.array(z.string()).default([]),
  author: z.string().default("Agent Skills Compendium"),
  license: z.string().default("MIT"),
  risk_level: z.enum(RISK_LEVELS),
  required_permissions: z.array(z.string()).default([]),
  restricted_actions: z.array(z.string()).default([]),

  created_at: z.string(),
  updated_at: z.string(),
});

/** A YAML skill file is `skill: { ... }` — one skill per file. */
export const skillFileSchema = z.object({ skill: skillSchema });

export const layerSchema = z.object({
  id: z.enum(LAYER_IDS),
  slug,
  name: z.string(),
  tagline: z.string(),
  description: z.string(),
  characteristics: z.array(z.string()).min(1),
  question: z.string(),
});

export const categorySchema = z.object({
  id: z.string(),
  slug,
  name: z.string(),
  description: z.string(),
  glyph: z.string(),
  order: z.number().int(),
  primary_layers: z.array(z.enum(LAYER_IDS)).default([]),
});

export const toolSchema = z.object({
  id: slug,
  name: z.string(),
  kind: z.enum(["interface", "retrieval", "compute", "storage", "generation", "control"]),
  description: z.string(),
});

export const taxonomyFileSchema = z.object({
  layers: z.array(layerSchema).optional(),
  categories: z.array(categorySchema).optional(),
  tools: z.array(toolSchema).optional(),
});

export type Skill = z.infer<typeof skillSchema>;
export type SkillInput = z.infer<typeof inputSchema>;
export type SkillOutput = z.infer<typeof outputSchema>;
export type ProcedureStep = z.infer<typeof procedureStepSchema>;
export type DecisionRule = z.infer<typeof decisionRuleSchema>;
export type FailureMode = z.infer<typeof failureModeSchema>;
export type Escalation = z.infer<typeof escalationSchema>;
export type SkillExample = z.infer<typeof exampleSchema>;
export type RelatedSkills = z.infer<typeof relatedSkillsSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type Category = z.infer<typeof categorySchema>;
export type Tool = z.infer<typeof toolSchema>;
