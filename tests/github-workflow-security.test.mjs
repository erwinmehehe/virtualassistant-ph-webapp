import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const workflowDir = new URL("../.github/workflows/", import.meta.url);

test("GitHub Actions use immutable revisions and do not persist checkout credentials", async () => {
  const files = (await readdir(workflowDir)).filter((name) => /\.ya?ml$/i.test(name));
  assert.ok(files.length > 0);

  for (const name of files) {
    const source = await readFile(new URL(name, workflowDir), "utf8");
    assert.doesNotMatch(source, /pull_request_target\s*:/, `${name} must not use pull_request_target`);
    assert.doesNotMatch(source, /VERCEL_TOKEN/, `${name} must not depend on a long-lived Vercel token`);

    for (const match of source.matchAll(/uses:\s*([^\s#]+)/g)) {
      const action = match[1];
      if (action.startsWith("./")) continue;
      assert.match(
        action,
        /^[^@\s]+@[0-9a-f]{40}$/i,
        `${name} action must be pinned to a full commit SHA: ${action}`,
      );
    }

    if (/actions\/checkout@/i.test(source)) {
      assert.match(source, /persist-credentials:\s*false/, `${name} checkout must not persist the GitHub token`);
    }
  }
});

test("normal production deployment stays on the Vercel Git integration", async () => {
  await assert.rejects(
    readFile(new URL("../.github/workflows/vercel-production.yml", import.meta.url), "utf8"),
    (error) => error?.code === "ENOENT",
  );

  const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  assert.equal(vercel.git?.deploymentEnabled?.main, true);
  assert.equal(vercel.git?.deploymentEnabled?.["**"], false);
});

test("CI declares least-privilege repository permissions", async () => {
  const ci = await readFile(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  assert.match(ci, /permissions:\s*\n\s+contents:\s*read/);
  assert.doesNotMatch(ci, /contents:\s*write/);
});
