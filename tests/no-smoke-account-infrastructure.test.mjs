import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const missing = async (path) => {
  try {
    await access(new URL("../"+path, import.meta.url));
    return false;
  } catch (error) {
    return error?.code === "ENOENT";
  }
};

test("production repository no longer contains smoke-account provisioning", async () => {
  for (const path of [
    ".github/workflows/authenticated-production-smoke.yml",
    ".github/workflows/dashboard-visual.yml",
    "scripts/bootstrap-github-smoke.mjs",
    "scripts/authenticated-production-smoke.mjs",
    "scripts/authenticated-dashboard-visual.mjs",
    "src/app/api/internal/github-smoke-auth/route.ts",
  ]) {
    assert.equal(await missing(path), true, `${path} should remain removed`);
  }
});

test("test command no longer references smoke-account scripts", async () => {
  const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.doesNotMatch(pkg.scripts.test, /smoke|authenticated-dashboard-visual/i);
});
