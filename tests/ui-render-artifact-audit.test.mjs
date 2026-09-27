import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

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

test("rendered JSX text does not leak source artifacts", async () => {
  const files = await walk("src");
  const findings = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    function visit(node) {
      if (ts.isJsxText(node)) {
        const raw = node.getText(ast);
        const visible = raw.replace(/\s+/g, " ").trim();
        if (
          /\\[ntr]/.test(visible) ||
          /\[object Object\]/.test(visible) ||
          /\b(?:undefined|NaN|null|TODO|FIXME)\b/.test(visible)
        ) {
          const { line } = ast.getLineAndCharacterOfPosition(node.getStart(ast));
          findings.push(`${file}:${line + 1}: ${visible}`);
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(ast);
  }

  assert.equal(
    findings.length,
    0,
    `Found source artifacts in rendered JSX text:\n${findings.join("\n")}`,
  );
});


test("inventory workspace feedback surfaces for visual review", async () => {
  const files = await walk("src/app/workspace");
  const findings = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    source.split("\n").forEach((line, index) => {
      if (/className=.*(?:success-banner|\balert\b)/.test(line)) {
        findings.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    });
  }
  console.log(`WORKSPACE_FEEDBACK_SURFACES ${findings.length}\n${findings.join("\n")}`);
  assert.ok(true);
});
