import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("My Day renders the complete queue inside an accessible scroll region on short desktop screens", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css")
  ]);

  assert.match(page, /queue\.map\(/);
  assert.match(page, /styles\.queue/);
  assert.match(page, /tabIndex=\{0\}/);
  assert.match(page, /All \{queue\.length\} items are below/);
  assert.match(css, /max-height: clamp\(/);
  assert.match(css, /overflow-y: auto/);
  assert.match(css, /scrollbar-gutter: stable/);
  assert.match(css, /@media \(max-width: 980px\)/);
  assert.match(css, /overflow: visible/);
});
