import test from "node:test";
import assert from "node:assert/strict";
import ms from "ms";
import { sum } from "./sum.mjs";
test("adds", () => assert.equal(sum(2, 3), 5));
test("ms parses", () => assert.equal(ms("1s"), 1000));
