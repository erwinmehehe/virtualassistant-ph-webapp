import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("public site header no longer calls Supabase or reads cookies while rendering", async () => {
  const [nav, header, account] = await Promise.all([
    source("src/components/site-nav.tsx"),
    source("src/components/site-header.tsx"),
    source("src/components/public-nav-account-controls.tsx"),
  ]);
  assert.match(nav, /export function SiteNav\(/);
  assert.match(nav, /<PublicNavAccountControls isTrainingContext=\{isTrainingContext\} \/>/);
  assert.match(header, /<SiteNav \/>/);
  assert.doesNotMatch(nav + header, /getSessionProfile|cookies\(|headers\(|getUser\(|createClient\(/);
  assert.match(account, /^"use client";/);
  assert.match(account, /useEffect\(/);
  assert.match(account, /auth\.onAuthStateChange/);
  assert.match(account, /auth\.getUser\(\)/);
  assert.match(account, /\.from\("profiles"\)/);
  assert.match(account, /\.select\("role,account_status"\)/);
  const config = await source("next.config.ts");
  assert.match(config, /localSupabaseConnectSrc/);
  assert.match(config, /process\.env\.VERCEL_ENV === "production"/);
  assert.match(config, /url\.hostname === "127\.0\.0\.1"/);
  assert.match(config, /supabaseOrigin\.origin/);
  assert.doesNotMatch(account, /createAdminClient\(|SUPABASE_SERVICE_ROLE_KEY|\.auth\.admin\./);
});

test("public nav preserves recruiter, admin, client, VA, and training links", async () => {
  const account = await source("src/components/public-nav-account-controls.tsx");
  for (const expected of [
    'return "/workspace/client"',
    'return "/workspace/va"',
    'return "/workspace/recruiter/today"',
    'return "/workspace/admin/today"',
    '"/workspace/client/jobs/new"',
    '"/workspace/training"',
    '"My learning"',
    '"Continue training"',
    '"Training login"',
    '"Start free training"',
    '"My workspace"',
    '"Log in"',
    'href="/auth/join/va"',
  ]) {
    assert.ok(account.includes(expected), "Missing public nav contract: " + expected);
  }
  // Private authorization remains in server-only guards, not browser navigation.
  const auth = await source("src/lib/auth.ts");
  assert.match(auth, /export async function requireAuthenticatedUserFast/);
  assert.match(auth, /export async function requireRoleFast/);
  assert.match(auth, /getFastRoleProfile\(\)/);
});

test("homepage, service pages, and public training can be rendered from shared caches", async () => {
  const [home, service, services, training] = await Promise.all([
    source("src/app/page.tsx"),
    source("src/app/service/[slug]/page.tsx"),
    source("src/app/services/page.tsx"),
    source("src/app/training/page.tsx"),
  ]);
  assert.match(home, /export const revalidate = 300/);
  assert.match(service, /export const revalidate = 3600/);
  assert.match(services, /export const revalidate = 300/);
  assert.match(training, /export const dynamic = "force-static"/);
  assert.match(training, /export const revalidate = 300/);
  assert.doesNotMatch(home + services + service + training, /getSessionProfile\(|cookies\(|headers\(/);
});

test("public services availability is cached, cookie-free and serializable", async () => {
  const [serviceIndex, publicClient] = await Promise.all([
    source("src/app/services/page.tsx"),
    source("src/lib/supabase/public.ts"),
  ]);
  assert.match(serviceIndex, /import \{ createPublicClient \} from "@\/lib\/supabase\/public"/);
  assert.doesNotMatch(serviceIndex, /@\/lib\/supabase\/server|await createClient\(/);
  assert.match(serviceIndex, /unstable_cache\(/);
  assert.match(serviceIndex, /\["public-services-availability-v1"\]/);
  assert.match(serviceIndex, /\{ revalidate: 300, tags: \["public-va-directory"\] \}/);
  assert.match(serviceIndex, /return \[\.\.\.counts\.entries\(\)\]/);
  assert.match(serviceIndex, /new Map<string, number>\(await cachedServiceAvailability\(\)\)/);
  assert.match(publicClient, /persistSession: false/);
  assert.doesNotMatch(publicClient, /cookies\(|getUser\(/);
});
