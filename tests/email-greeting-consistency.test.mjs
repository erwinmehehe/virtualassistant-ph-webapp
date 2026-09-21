import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcRoot = join(repoRoot, "src");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test("shared branded renderer strips a caller-supplied leading greeting", async () => {
  const email = await readFile(join(srcRoot, "lib/email.ts"), "utf8");
  const start = email.indexOf("function renderBrandedEmail");
  const end = email.indexOf("function renderHiringEmail", start);
  const renderer = email.slice(start, end);

  assert.match(email, /function stripLeadingBrandedGreeting\(bodyHtml: string\)/);
  assert.match(renderer, /const bodyHtml = stripLeadingBrandedGreeting\(args\.bodyHtml\)/);
  assert.match(renderer, /Hi \$\{escapeHtml\(args\.firstName\)\},/);
  assert.match(renderer, /\$\{bodyHtml\}\$\{cta\}\$\{signature\}/);
  assert.doesNotMatch(renderer, /\$\{args\.bodyHtml\}\$\{cta\}\$\{signature\}/);
});

test("transactional email call sites do not start their body with another greeting", async () => {
  const offenders = [];
  const files = await walk(srcRoot);
  for (const file of files) {
    const source = await readFile(file, "utf8");
    let offset = 0;
    while (true) {
      const index = source.indexOf("sendTransactionalEventEmail({", offset);
      if (index < 0) break;
      const chunk = source.slice(index, index + 2200);
      if (/body:\s*[`'"]\s*(?:Hi|Hello|Hey|Dear)\b/i.test(chunk)) {
        offenders.push(relative(repoRoot, file).replaceAll("\\", "/"));
        break;
      }
      offset = index + 1;
    }
  }
  assert.deepEqual(offenders, [], `Transactional email bodies must not add their own greeting: ${offenders.join(", ")}`);
});

test("VA match alert reuses the shared talent wrapper instead of maintaining a separate greeting shell", async () => {
  const matchEmail = await readFile(join(srcRoot, "lib/match-email.ts"), "utf8");
  assert.match(matchEmail, /renderTalentEmail/);
  assert.doesNotMatch(matchEmail, /<!doctype html>/);
  assert.match(matchEmail, /firstName: "there"/);
});
