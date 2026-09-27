import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("floating discovery CTA never appears on the booking page", async () => {
  const source=await read("src/components/floating-cta.tsx");
  assert.match(source, /const INTERNAL_PATHS = \["\/workspace", "\/auth", "\/book-client-call"\]/);
  assert.match(source, /if \(event\.relatedTarget \|\| !started \|\| !isHighIntentPath\(pathname\)\) return;/);
});
