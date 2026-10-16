import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { AUSTRALIA_SPECIALIZATIONS } from "../src/lib/training-specializations.ts";

test("public catalogue promotes four real Australian specialisation paths", async () => {
  const page = await readFile(new URL("../src/app/training/page.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/app/training-landing.css", import.meta.url), "utf8");
  assert.equal(AUSTRALIA_SPECIALIZATIONS.length, 4);
  assert.match(page, /AUSTRALIA_SPECIALIZATIONS\.map/);
  assert.match(page, /workspace\/training\/paths\/\$\{track\.slug\}/);
  assert.match(page, /trainingJoinHref\(track\.startSignals\[0\]\)/);
  assert.match(page, /training_australia_path_interest/);
  assert.match(page, /Complete shared courses once/);
  assert.match(css, /tr-australia-path-grid/);
});
