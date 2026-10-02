import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage metadata declares dynamic OG and Twitter share images", async () => {
  const [page, helper] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/lib/og.ts"),
  ]);

  assert.match(page, /HOME_META_TITLE = "Virtual Assistant Philippines \\| Hire Vetted Filipino VAs"/);
  assert.match(page, /socialMetadata\(/);
  assert.match(page, /category: "hiring"/);
  assert.match(helper, /\/api\/og\?/);
  assert.match(helper, /width: 1200/);
  assert.match(helper, /height: 630/);
  assert.match(helper, /alt: input\.title/);
  assert.match(helper, /card: "summary_large_image"/);
});

test("site share generator is light branded and conversion focused", async () => {
  const image = await read("src/app/api/og/route.tsx");

  assert.match(image, /linear-gradient\(135deg,#ffffff/);
  assert.match(image, /VirtualAssistant/);
  assert.match(image, /#4F46E5/);
  assert.match(image, /Brief/);
  assert.match(image, /Match/);
  assert.match(image, /Interview/);
  assert.match(image, /Hire/);
  assert.match(image, /width: 1200, height: 630/);
});
