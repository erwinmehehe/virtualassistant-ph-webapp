import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("shared site footer links to the official VAPH Facebook page", async () => {
  const footer = await read("src/components/site-footer.tsx");
  const styles = await read("src/components/site-footer.module.css");

  assert.match(footer, /https:\/\/www\.facebook\.com\/profile\.php\?id=61595768241097/);
  assert.match(footer, /aria-label="Visit Virtual Assistant Philippines on Facebook/);
  assert.match(footer, /target="_blank"/);
  assert.match(footer, /rel="noopener noreferrer"/);
  assert.match(footer, /<span>Facebook<\/span>/);
  assert.match(styles, /\.facebookLink:focus-visible/);
});
