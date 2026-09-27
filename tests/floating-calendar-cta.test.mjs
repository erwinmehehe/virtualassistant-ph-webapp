import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("floating discovery CTA links directly to Google Calendar with clean copy", async () => {
  const source=await read("src/components/floating-cta.tsx");
  assert.match(source,/https:\/\/calendar\.app\.google\/FxedmioyeJhKras87/);
  assert.match(source,/Book a discovery call/);
  assert.doesNotMatch(source,/Discuss your VA needs/);
  assert.doesNotMatch(source,/DISCOVERY_CALL_URL = "\/book-client-call"/);
});

test("floating discovery CTA has no white wrapper shell", async () => {
  const css=await read("src/app/globals.css");
  const start=css.indexOf(".floating-cta {");
  const end=css.indexOf("/* Compact confirmation recovery on login */",start);
  const block=css.slice(start,end);
  assert.match(block,/background: linear-gradient\(135deg, #444ce7/);
  assert.match(block,/min-height: 46px/);
  assert.doesNotMatch(block,/background: #fff;/);
  assert.doesNotMatch(block,/padding: 4px;/);
});
