import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("cross-request training cache contains only published curriculum, never learner data", async () => {
  const cache = await read("src/lib/training-curriculum-cache.ts");
  assert.match(cache, /unstable_cache\(/);
  assert.match(cache, /revalidate: 120, tags: \["training-curriculum"\]/);
  assert.match(cache, /\.eq\("status", "published"\)/);
  assert.match(cache, /\.eq\("is_published", true\)/);
  assert.match(cache, /LESSON_SUMMARY_FIELDS/);
  const summarySelect = cache.match(/const LESSON_SUMMARY_FIELDS\s*=\s*"([^"]+)"/);
  assert.ok(summarySelect, "Training dashboard needs a dedicated metadata-only projection");
  assert.doesNotMatch(summarySelect[1], /\bcontent\b/);
  assert.match(cache, /LESSON_DETAIL_FIELDS/);
  assert.match(cache, /if \(slug\.length > 120 \|\|/);
  assert.doesNotMatch(cache, /\.from\("(training_enrollments|training_lesson_progress|training_lesson_engagement|training_assessment_submissions|training_certificates|training_notifications|training_saved_courses|profiles)"\)/);
  assert.doesNotMatch(cache, /cookies\(\)|headers\(\)|getUser\(\)|userId/);
});

test("learner state still loads by owner from the request client, not cached curriculum", async () => {
  const source = await read("src/lib/training.ts");
  const dashboard = source.slice(source.indexOf("export async function getTrainingDashboard"), source.indexOf("export async function getTrainingCourse"));
  const course = source.slice(source.indexOf("export async function getTrainingCourse"), source.indexOf("export async function getTrainingLesson"));

  assert.match(dashboard, /getCachedPublishedTrainingCatalogue\(\)/);
  assert.match(dashboard, /getTrainingVerifiedAuthUser\(\)/);
  assert.match(dashboard, /\.from\("training_enrollments"\)/);
  assert.match(dashboard, /\.from\("training_lesson_progress"\)/);
  assert.match(dashboard, /\.from\("training_certificates"\)/);
  assert.match(dashboard, /\.from\("training_assessment_submissions"\)/);
  assert.match(dashboard, /\.eq\("user_id", userId\)/);
  assert.match(dashboard, /authUserData\.user\?\.id === userId/);
  assert.doesNotMatch(dashboard, /\.from\("training_lessons"\)/);

  assert.match(course, /getCachedPublishedTrainingCourse\(slug\)/);
  assert.match(course, /const supabase = await createClient\(\)/);
  assert.match(course, /\.from\("training_enrollments"\)/);
  assert.match(course, /\.from\("training_lesson_progress"\)/);
  assert.match(course, /\.from\("training_certificates"\)/);
  assert.match(course, /\.from\("training_assessment_submissions"\)/);
  assert.match(course, /\.eq\("user_id", userId\)/);
});

test("training shell and dashboard share a request-scoped verified user, never a global session cache", async () => {
  const [auth, shell, dashboard] = await Promise.all([
    read("src/lib/training-verified-auth-user.ts"),
    read("src/lib/training-shell-data.ts"),
    read("src/app/workspace/training/page.tsx"),
  ]);
  assert.match(auth, /cache\(async \(\) =>/);
  assert.match(auth, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(auth, /unstable_cache|use cache|persistSession: true/);
  assert.match(shell, /getTrainingVerifiedAuthUser\(\)/);
  assert.match(shell, /\.from\("training_notifications"\)/);
  assert.match(shell, /\.eq\("user_id", userId\)/);
  assert.match(dashboard, /getTrainingVerifiedAuthUser\(\)/);
});

test("curriculum edits invalidate shared caches without invalidating learner progress", async () => {
  const source = await read("src/app/actions/training-admin.ts");
  assert.ok((source.match(/updateTag\("training-curriculum"\)/g) || []).length >= 4);
  assert.match(source, /updateTag\("public-training"\)/);
  assert.match(source, /requireRoleFast\("admin"\)/);
});

test("production Turnstile refuses missing configuration and still validates real tokens", async () => {
  const [gate, actions] = await Promise.all([
    read("src/lib/turnstile.ts"),
    read("src/app/actions/auth.ts"),
  ]);
  assert.match(gate, /if \(!secret && !siteKey\)/);
  assert.match(gate, /if \(process\.env\.VERCEL_ENV === "production"\)/);
  assert.match(gate, /missing production configuration/);
  assert.match(gate, /response\.ok/);
  assert.match(gate, /result\.action !== expectedAction/);
  assert.match(gate, /hostname mismatch/);
  assert.match(actions, /verifyTurnstile\(formData, "login"\)/);
  assert.match(actions, /verifyTurnstile\(formData, "join"\)/);
});

test("middleware already skips public pages and auth calls without session cookies", async () => {
  const middleware = await read("middleware.ts");
  assert.match(middleware, /matcher: \["\/workspace\/:path\*", "\/auth\/:path\*"\]/);
  assert.match(middleware, /if \(!hasSupabaseSession\) return response/);
  assert.match(middleware, /supabase\.auth\.getClaims\(\)/);
});

test("public pricing is static ISR with admin-triggered price refresh", async () => {
  const [pricing, settings, header] = await Promise.all([
    read("src/app/pricing/page.tsx"),
    read("src/app/actions/settings.ts"),
    read("src/components/site-nav.tsx"),
  ]);
  assert.match(pricing, /export const dynamic = "force-static"/);
  assert.match(pricing, /export const revalidate = 120/);
  assert.match(pricing, /getBusinessSettings\(\)/);
  assert.match(settings, /revalidatePath\("\/pricing"\)/);
  assert.match(header, /<PublicNavAccountControls/);
  assert.doesNotMatch(pricing, /getSessionProfile|cookies\(\)|headers\(\)/);
});
