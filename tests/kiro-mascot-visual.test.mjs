import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Kiro keeps the approved kingfisher identity across states", async () => {
  const mascot = await read("src/components/kiro-mascot.tsx");

  assert.match(mascot, /viewBox="0 0 160 160"/);
  assert.match(mascot, /#22c3ff/);
  assert.match(mascot, /#f59c2e/);
  assert.match(mascot, /#15226f/);
  assert.match(mascot, /Kiro, the VAPH kingfisher guide/);
  assert.match(mascot, /isTraining/);
  assert.match(mascot, /withLaptop/);
  assert.match(mascot, /m68 99 8 12 8-12/);
});

test("Kiro SVG gradients are unique per rendered mascot", async () => {
  const mascot = await read("src/components/kiro-mascot.tsx");

  assert.match(mascot, /useId/);
  assert.match(mascot, /replace\(\/:\/g, ""\)/);
  assert.match(mascot, /headGradient/);
  assert.match(mascot, /bodyGradient/);
  assert.match(mascot, /wingGradient/);
  assert.match(mascot, /scarfGradient/);
});

test("Training gives the redesigned Kiro enough visual space", async () => {
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(css, /grid-template-columns: 210px minmax\(0,1fr\) minmax\(190px,240px\)/);
  assert.match(css, /\.training-reference-hero-mascot \{[\s\S]*?width: 198px;[\s\S]*?height: 198px;/);
  assert.match(css, /\.training-reference-hero-art \{[\s\S]*?overflow: visible;/);
});
