import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("public requests bypass auth middleware invocation entirely", async () => {
  const [middleware, vercelConfig] = await Promise.all([read("middleware.ts"), read("vercel.json")]);
  assert.match(middleware, /matcher: \["\/workspace\/:path\*", "\/auth\/:path\*"\]/);
  assert.doesNotMatch(middleware, /matcher: \["\/\(\(\?!/);
  // Canonical WWW redirects run on the platform and do not need middleware CPU.
  const config = JSON.parse(vercelConfig);
  assert.ok(config.redirects.some((r) =>
    r.source === "/:path*" && r.permanent === true &&
    r.destination === "https://virtualassistant.com.ph/:path*" &&
    r.has?.some((condition) => condition.type === "host"),
  ));
});

test("anonymous public headers skip expensive user fetches", async () => {
  const auth = await read("src/lib/auth.ts");
  const body = auth.split("export const getSessionProfile = cache(")[1]
    ?.split("export const getFastRoleProfile = cache(")[0] ?? "";
  assert.ok(body, "public-session helper must exist");
  const cookieCheck = body.indexOf('const cookieStore = await cookies()');
  const earlyExit = body.indexOf('if (!hasSupabaseSession) return { user: null, profile: null };');
  const supabaseClient = body.indexOf("const supabase = await createClient()");
  const userFetch = body.indexOf("await supabase.auth.getUser()");
  assert.ok(cookieCheck >= 0 && earlyExit > cookieCheck);
  assert.ok(supabaseClient > earlyExit && userFetch > supabaseClient);
  assert.match(body, /name\.startsWith\("sb-"\) && name\.includes\("-auth-token"\)/);
});

test("public LMS course catalog remains shared ISR rather than per-user SSR", async () => {
  const [page, loader] = await Promise.all([
    read("src/app/training/page.tsx"),
    read("src/lib/public-training.ts"),
  ]);
  assert.match(page, /export const dynamic = "force-static"/);
  assert.match(page, /export const revalidate = 300/);
  assert.match(loader, /unstable_cache/);
  assert.match(page, /const signedIn = false/);
});
