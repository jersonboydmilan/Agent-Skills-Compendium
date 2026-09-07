import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parse } from "yaml";
import { exportFilename, toJson, toYaml } from "../src/lib/export";
import { skillFileSchema } from "../src/lib/schema";
import { repository } from "../src/lib/content-store";

test("every published definition round-trips through YAML export unchanged", async () => {
  const skills = await repository.listSkills();
  assert.ok(skills.length > 0, "the registry must not be empty");
  for (const skill of skills) {
    const parsed = skillFileSchema.safeParse(parse(toYaml(skill)));
    assert.ok(parsed.success, `${skill.slug} does not re-validate after export`);
    assert.deepEqual(parsed.data!.skill, skill, `${skill.slug} changed shape on export`);
  }
});

test("JSON export re-parses to the same document", async () => {
  const [skill] = await repository.listSkills();
  assert.deepEqual(JSON.parse(toJson(skill)).skill, skill);
});

test("the export filename is the slug", async () => {
  const [skill] = await repository.listSkills();
  assert.equal(exportFilename(skill, "yaml"), `${skill.slug}.yaml`);
});
