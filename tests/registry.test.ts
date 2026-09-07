import { strict as assert } from "node:assert";
import { test } from "node:test";
import { repository } from "../src/lib/content-store";

test("every skill points at a category and a layer that exist", async () => {
  const [skills, categories, layers] = await Promise.all([
    repository.listSkills(),
    repository.listCategories(),
    repository.listLayers(),
  ]);
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const layerIds = new Set(layers.map((l) => l.id));
  for (const skill of skills) {
    assert.ok(categorySlugs.has(skill.category), `${skill.slug}: unknown category`);
    assert.ok(layerIds.has(skill.layer), `${skill.slug}: unknown layer`);
  }
});

test("every referenced tool is registered", async () => {
  const [skills, tools] = await Promise.all([repository.listSkills(), repository.listTools()]);
  const ids = new Set(tools.map((t) => t.id));
  for (const skill of skills) {
    for (const tool of skill.tools) {
      assert.ok(ids.has(tool), `${skill.slug}: unregistered tool "${tool}"`);
    }
  }
});

test("every relationship resolves to a published skill", async () => {
  const skills = await repository.listSkills();
  const slugs = new Set(skills.map((s) => s.slug));
  for (const skill of skills) {
    for (const [relation, list] of Object.entries(skill.related_skills)) {
      for (const target of list as string[]) {
        assert.ok(slugs.has(target), `${skill.slug}.${relation}: dangling edge "${target}"`);
        assert.notEqual(target, skill.slug, `${skill.slug}.${relation}: refers to itself`);
      }
    }
  }
});

test("slugs are unique", async () => {
  const skills = await repository.listSkills();
  assert.equal(new Set(skills.map((s) => s.slug)).size, skills.length);
});

test("a lookup by an unknown slug returns null rather than throwing", async () => {
  assert.equal(await repository.getSkill("no-such-skill"), null);
  assert.equal(await repository.getCategory("no-such-category"), null);
  assert.equal(await repository.getLayer("no-such-layer"), null);
});

test("a layer resolves by id as well as by slug", async () => {
  const byId = await repository.getLayer("L1");
  const bySlug = await repository.getLayer("cognitive");
  assert.deepEqual(byId, bySlug);
});
