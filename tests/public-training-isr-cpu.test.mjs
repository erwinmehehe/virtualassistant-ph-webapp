import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("public training page is revalidated static content without per-visit session access", async () => {
  const page = await source("src/app/training/page.tsx");
  const catalogue = await source("src/lib/public-training.ts");
  assert.match(page, /export const dynamic = "force-static"/);
  assert.match(page, /export const revalidate = 300/);
  assert.match(page, /const \{ courses \} = await getPublicTrainingOverview\(\)/);
  assert.doesNotMatch(page, /getSessionProfile\(/);
  assert.match(page, /const signedIn = false/);
  assert.match(page, /publishedCourses = courses\.filter\(\(course\) => course\.status === "published"\)/);
  assert.match(page, /const JOIN_HREF = trainingJoinHref\(\)/);
  assert.match(page, /const LOGIN_HREF = "/);
  assert.match(catalogue, /unstable_cache/);
  assert.match(catalogue, /revalidate: 300, tags: \["public-training"\]/);
});

test("training navigation stays visually connected without shared-response personalization", async () => {
  const [header, nav] = await Promise.all([
    source("src/components/training-site-header.tsx"),
    source("src/components/site-nav.tsx"),
  ]);
  assert.match(header, /<SiteNav actionContext="training" \/>/);
  assert.match(nav, /<PublicNavAccountControls isTrainingContext=\{isTrainingContext\} \/>/);
  assert.doesNotMatch(nav, /getSessionProfile\(|cookies\(/);
  assert.match(nav, /href="\/training"/);
  assert.match(nav, /Start free training/);
});

test("existing signed-in learners retain course intent on the training signup route", async () => {
  const join = await source("src/app/auth/join/training/page.tsx");
  assert.match(join, /safeTrainingCourseSlug\(params\.course\)/);
  assert.match(join, /item\.status === "published"/);
  assert.match(join, /hasSessionCookie/);
  assert.match(join, /if \(hasSessionCookie\)/);
  assert.match(join, /getFastRoleProfile\(\)/);
  assert.match(join, /if \(userId\) redirect\(trainingCourseDestination\(course\?\.slug\)\)/);
  assert.match(join, /<TrainingJoinForm course=\{course\}/);
});

test("public training and OG bypass cookie refresh but keep canonical redirects", async () => {
  const middleware = await source("middleware.ts");
  assert.match(middleware, /const hasLegacyHost =/);
  assert.match(middleware, /NextResponse\.redirect\(canonicalUrl, 308\)/);
  assert.match(middleware, /request\.nextUrl\.pathname === "\/training"/);
  assert.match(middleware, /request\.nextUrl\.pathname === "\/api\/og"/);
  const publicFastPath = middleware.indexOf('request.nextUrl.pathname === "/training"');
  const sessionRefresh = middleware.indexOf('const supabase = createServerClient(');
  assert.ok(publicFastPath > middleware.indexOf("NextResponse.redirect(canonicalUrl, 308)"));
  assert.ok(publicFastPath < sessionRefresh);
  assert.match(middleware, /await supabase\.auth\.getClaims\(\)/);
});

test("contextual social image cache is shared only for deterministic public input", async () => {
  const route = await source("src/app/api/og/route.tsx");
  assert.match(route, /export async function GET\(request: NextRequest\)/);
  assert.match(route, /new ImageResponse/);
  assert.match(route, /width: 1200/);
  assert.match(route, /height: 630/);
  assert.match(route, /"Cache-Control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400"/);
  assert.doesNotMatch(route, /cookies\(\)|getSessionProfile\(\)|getClaims\(\)/);
});
