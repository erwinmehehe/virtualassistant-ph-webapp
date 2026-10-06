import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("favicon.ico has an explicit cached redirect to the generated PNG favicon", async () => {
  const icoRoute = await read("src/app/favicon.ico/route.ts");
  const pngRoute = await read("src/app/favicon.png/route.ts");

  assert.match(icoRoute, /new URL\("\/favicon\.png", request\.url\)/);
  assert.match(icoRoute, /status:\s*308/);
  assert.match(icoRoute, /Cache-Control/);
  assert.match(icoRoute, /export function GET/);
  assert.match(icoRoute, /export function HEAD/);

  assert.match(pngRoute, /createSiteIconResponse\(96\)/);
});
