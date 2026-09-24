import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssPath = "src/app/training-landing.css";

test("Foundations recommendation keeps metadata and CTA out of a single cramped row", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.tr-foundation-callout \{[\s\S]*grid-template-columns: 48px minmax\(0, 1fr\) minmax\(250px, auto\)/);
  assert.match(css, /\.tr-foundation-facts \{[\s\S]*grid-template-columns: repeat\(3, max-content\)/);
  assert.match(css, /\.tr-foundation-cta \{[\s\S]*grid-column: 1 \/ -1/);
  assert.match(css, /\.tr-foundation-cta \{[\s\S]*width: 100%/);
});

test("Foundations recommendation reflows cleanly at laptop and phone widths", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 1280px\) and \(min-width: 1081px\)/);
  assert.match(css, /grid-template-columns: 48px minmax\(0, 1fr\) 270px/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.tr-foundation-facts span:last-of-type \{[\s\S]*grid-column: 1 \/ -1/);
});
