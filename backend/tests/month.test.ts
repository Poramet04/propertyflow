import assert from "node:assert/strict";
import test from "node:test";
import { monthRange } from "../src/utils/month.js";

test("month range accepts a Gregorian dashboard month", () => {
  const result = monthRange("2026-08");
  assert.equal(result.month, "2026-08");
  assert.equal(result.start.getFullYear(), 2026);
  assert.equal(result.start.getMonth(), 7);
  assert.equal(result.start.getDate(), 1);
  assert.equal(result.end.getFullYear(), 2026);
  assert.equal(result.end.getMonth(), 8);
  assert.equal(result.end.getDate(), 1);
});

test("invalid month values safely fall back to the current Gregorian month", () => {
  const result = monthRange("2569-13");
  const now = new Date();
  const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  assert.equal(result.month, expected);
});
