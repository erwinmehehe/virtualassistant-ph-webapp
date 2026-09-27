import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (/\.(tsx|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

test("UI source does not contain literal escape artifacts that can render on screen", async () => {
  const files = await walk("src");
  const findings = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      if (/\\[ntr]/.test(line)) {
        findings.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  assert.equal(findings.length, 0, `Found literal escape sequences in TSX/JSX that need review:\n${findings.join("\n")}`);
});
