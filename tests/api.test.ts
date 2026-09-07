import { strict as assert } from "node:assert";
import { test } from "node:test";
import { parseLimit } from "../src/lib/api";

test("a valid limit is honoured", () => {
  assert.equal(parseLimit("5"), 5);
});

test("a missing limit falls back to the default", () => {
  assert.equal(parseLimit(null), 20);
});

test("a non-numeric limit falls back rather than producing NaN", () => {
  assert.equal(parseLimit("abc"), 20);
});

test("a negative limit never reaches slice as a negative index", () => {
  assert.equal(parseLimit("-5"), 20);
  assert.equal(parseLimit("0"), 20);
});

test("a limit is capped", () => {
  assert.equal(parseLimit("100000"), 100);
});

test("a fractional limit is floored", () => {
  assert.equal(parseLimit("7.9"), 7);
});
