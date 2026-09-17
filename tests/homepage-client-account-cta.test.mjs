import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage brief success offers client account creation linked to the submitted lead", async () => {
  const form = await read("src/components/hiring-brief-form.tsx");

  assert.match(form, /Create a client account/);
  assert.match(form, /\/auth\/join\/client\?lead=/);
  assert.match(form, /params\.get\("lead"\)/);
  assert.match(form, /sourcePath === "\/"/);
});
