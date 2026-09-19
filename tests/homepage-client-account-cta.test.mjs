import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// The account CTA is no longer homepage-only or secondary to booking: every
// hiring brief now ends on it, with the call offered underneath.
test("brief success offers client account creation linked to the submitted lead", async () => {
  const form = await read("src/components/hiring-brief-form.tsx");

  assert.match(form, /Create my account/);
  assert.match(form, /`\/auth\/join\/client\?\$\{joinParams\.toString\(\)\}`/);
  assert.match(form, /new URLSearchParams\(leadId \? \{ lead: leadId, next \} : \{ next \}\)/);
  assert.match(form, /params\.get\("lead"\)/);
});
