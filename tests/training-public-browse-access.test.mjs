import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("anonymous workspace browse links open the public course library", async () => {
  const [middleware, publicPage, trainingLayout] = await Promise.all([
    source("middleware.ts"),
    source("src/app/training/page.tsx"),
    source("src/app/workspace/training/layout.tsx"),
  ]);

  assert.match(middleware, /request\.nextUrl\.pathname === "\/workspace\/training"/);
  assert.match(middleware, /request\.nextUrl\.searchParams\.get\("browse"\) === "1"/);
  assert.match(middleware, /destination\.pathname = "\/training"/);
  assert.match(middleware, /destination\.search = ""/);
  assert.match(middleware, /destination\.hash = "course-library"/);
  assert.match(middleware, /NextResponse\.redirect\(destination, 307\)/);
  assert.match(
    middleware,
    /if \(!hasSupabaseSession\) \{\s*if \(isPublicBrowseRequest\) return publicTrainingBrowseRedirect\(request\);/,
  );
  assert.match(publicPage, /id="course-library"/);
  assert.match(publicPage, /getPublicTrainingOverview\(\)/);

  // This exception must not remove the authentication gate from personal learning.
  assert.match(trainingLayout, /requireTrainingAccessFast\(\)/);
});

test("expired auth cookies are not a prerequisite for public course discovery", async () => {
  const middleware = await source("middleware.ts");
  assert.match(middleware, /const \{ data, error \} = await supabase\.auth\.getClaims\(\)/);
  assert.match(middleware, /sessionVerified = !error && Boolean\(data\?\.claims\?\.sub\)/);
  assert.match(
    middleware,
    /if \(isPublicBrowseRequest && !sessionVerified\) return publicTrainingBrowseRedirect\(request\);/,
  );
  assert.match(middleware, /return response;/);
});
