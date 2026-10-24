import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("public browse entrypoint redirects via static Next routing without auth compute", async () => {
  const [nextConfig, middleware, publicPage] = await Promise.all([
    source("next.config.ts"),
    source("middleware.ts"),
    source("src/app/training/page.tsx"),
  ]);
  assert.match(nextConfig, /source: "\/workspace\/training",[\s\S]*?has: \[\{ type: "query", key: "browse", value: "1" \}\],[\s\S]*?destination: "\/training#course-library",[\s\S]*?permanent: false/);
  assert.match(publicPage, /id="course-library"/);
  assert.match(publicPage, /getPublicTrainingOverview\(\)/);
  assert.match(publicPage, /const signedIn = false/);
  // Public catalog, blog, and other marketing traffic must not invoke the auth proxy.
  assert.match(middleware, /matcher: \["\/workspace\/:path\*", "\/auth\/:path\*"\]/);
  assert.doesNotMatch(middleware, /matcher: \["\/\(\(\?!/);
});

test("learner personal browse and account data remain protected", async () => {
  const [layout, page, shell] = await Promise.all([
    source("src/app/workspace/training/layout.tsx"),
    source("src/app/workspace/training/page.tsx"),
    source("src/components/training-shell.tsx"),
  ]);
  assert.match(layout, /requireTrainingAccessFast\(\)/);
  assert.match(page, /params\.browse === "personal"/);
  assert.match(shell, /\/workspace\/training\?browse=personal#course-library-title/);
  assert.doesNotMatch(shell, /\/workspace\/training\?browse=1/);
});

test("HTTP local/CI builds do not force HTTPS and production keeps secure headers", async () => {
  const config = await source("next.config.ts");
  assert.match(config, /process\.env\.NODE_ENV === "production"/);
  assert.match(config, /NEXT_PUBLIC_APP_URL \|\| "https:\/\/virtualassistant\.com\.ph"/);
  assert.match(config, /\.startsWith\("https:\/\/"\)/);
  assert.match(config, /"upgrade-insecure-requests"/);
  assert.match(config, /trailingSlash: false/);
});
