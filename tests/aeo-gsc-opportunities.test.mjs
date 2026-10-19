import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("GSC query-page export identifies zero-click opportunities and URL overlap without asserting AI causality", () => {
  const dir = mkdtempSync(join(tmpdir(), "vaph-aeo-"));
  try {
    const file = join(dir, "gsc.csv");
    writeFileSync(file, [
      "Query,Page,Clicks,Impressions,CTR,Position",
      '"how to hire a va","https://virtualassistant.com.ph/blog/how-to-hire",0,120,0%,2.0',
      '"how to hire a va","https://virtualassistant.com.ph/service/executive-virtual-assistant",3,100,3%,4.0',
      '"va pay","https://virtualassistant.com.ph/blog/va-pay",1,300,0.33%,7.0',
    ].join("\n"));
    const result = spawnSync(process.execPath, ["scripts/aeo-gsc-opportunities.mjs", file], {
      encoding: "utf8",
      cwd: new URL("../", import.meta.url).pathname,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Positions 1-3 with impressions but zero clicks/);
    assert.match(result.stdout, /how to hire a va/);
    assert.match(result.stdout, /Query overlap candidates/);
    assert.match(result.stdout, /not proof that AI Overviews caused lost clicks/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});


test("GSC table cell output escapes backslashes before pipes and HTML metacharacters", () => {
  const dir = mkdtempSync(join(tmpdir(), "vaph-aeo-escaping-"));
  try {
    const file = join(dir, "gsc-escaping.csv");
    const query = String.raw`va\|pay<test>`;
    writeFileSync(file, [
      "Query,Page,Clicks,Impressions,CTR,Position",
      `"${query}","https://virtualassistant.com.ph/blog/va-pay",0,100,0%,2.0`
    ].join("\n"));
    const result = spawnSync(process.execPath, ["scripts/aeo-gsc-opportunities.mjs", file], {
      encoding: "utf8",
      cwd: new URL("../", import.meta.url).pathname,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(String.raw`va\\\|pay&lt;test&gt;`), result.stdout);
    assert.doesNotMatch(result.stdout, /<test>/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
