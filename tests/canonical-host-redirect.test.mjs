import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("www host is permanently redirected to the apex domain at Vercel edge", async () => {
  const raw = await readFile(new URL("../vercel.json", import.meta.url), "utf8");
  const config = JSON.parse(raw);

  const redirect = config.redirects?.find(
    (rule) =>
      rule.destination === "https://virtualassistant.com.ph/:path*" &&
      rule.permanent === true
  );

  assert.ok(redirect, "missing permanent www-to-apex redirect");
  assert.deepEqual(redirect.has, [
    {
      type: "host",
      value: "^www\\.virtualassistant\\.com\\.ph$"
    }
  ]);
});

test("middleware keeps a canonical-host fallback for forwarded requests", async () => {
  const source = await readFile(new URL("../middleware.ts", import.meta.url), "utf8");

  assert.match(source, /x-forwarded-host/);
  assert.match(source, /request\.headers\.get\("host"\)/);
  assert.match(source, /request\.nextUrl\.hostname/);
  assert.match(source, /www\.virtualassistant\.com\.ph/);
  assert.match(source, /NextResponse\.redirect\(canonicalUrl, 308\)/);
});
