import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("/hire owns its closing CTA without a second global footer CTA", async () => {
  const [hire, footer] = await Promise.all([
    readFile(new URL("../src/app/hire/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/site-footer.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(hire, /id="hire-form"/);
  assert.doesNotMatch(footer, /FooterCta|footer-cta/);
});

test("/hire hero stays focused on the hiring brief instead of duplicating service-model cards", async () => {
  const source = await readFile(new URL("../src/app/hire/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /aria-label="Hiring options"/);
  assert.match(source, /className="pvh-proof-list"/);
  assert.match(source, /id="hire-form"/);
});

test("/hire premium CSS contains the compact visual cleanup", async () => {
  const source = await readFile(new URL("../src/app/premium-hire.css", import.meta.url), "utf8");
  assert.match(source, /\/\* \/hire visual cleanup: quieter hero, tighter proof, clearer form \*\//);
  assert.match(source, /\.pva-hire \.pvh-proof-list \{/);
  assert.match(source, /\.pva-hire \.pvh-form-card \{/);
});
