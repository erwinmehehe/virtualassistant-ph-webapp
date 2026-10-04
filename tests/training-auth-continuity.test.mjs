import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("training-directed login stays inside the training navigation experience", async () => {
  const [login, header, nav] = await Promise.all([
    read("src/app/auth/login/page.tsx"),
    read("src/components/training-site-header.tsx"),
    read("src/components/site-nav.tsx"),
  ]);

  assert.match(login, /trainingLogin \? \([\s\S]*TrainingSiteHeader/);
  assert.match(login, /current="login"/);
  assert.match(login, /Welcome back to training/);
  assert.match(login, /Log in to training/);
  assert.match(login, /New to training\?/);
  assert.match(header, /"landing" \| "join" \| "login"/);
  assert.match(nav, /const isLogin = current === "login"/);
  assert.match(nav, /isLogin \? \([\s\S]*Training home/);
});

test("training login preserves course intent and supports Google auth", async () => {
  const login = await read("src/app/auth/login/page.tsx");

  assert.match(login, /trainingCourseSlug = safeTrainingCourseSlug/);
  assert.match(login, /trainingJoinHref\(trainingCourseSlug\)/);
  assert.match(login, /socialEnabled = trainingLogin \? googleEnabled : \(googleEnabled \|\| microsoftEnabled\)/);
  assert.match(login, /Continue with Google/);
  assert.match(login, /!trainingLogin && microsoftEnabled/);
  assert.match(login, /data-course-slug=\{trainingCourseSlug \|\| undefined\}/);
});

test("training signup owns its metadata and uses learner-facing separation copy", async () => {
  const [page, form] = await Promise.all([
    read("src/app/auth/join/training/page.tsx"),
    read("src/components/training-join-form.tsx"),
  ]);

  assert.match(page, /Save your free VA training progress/);
  assert.match(page, /card: "summary"/);
  assert.match(form, /Training is separate from job applications/);
  assert.match(form, /No job application is required to learn/);
  assert.doesNotMatch(form, /enter you into recruiter vetting/);
});


test("login route owns neutral account metadata instead of inheriting hiring copy", async () => {
  const login = await read("src/app/auth/login/page.tsx");

  assert.match(login, /export const metadata: Metadata/);
  assert.match(login, /title: "Log In"/);
  assert.match(login, /continue free VA training/);
  assert.match(login, /robots: \{ index: false, follow: false \}/);
  assert.doesNotMatch(login, /Hire vetted virtual assistants from the Philippines/);
});


test("any authenticated account can enter the free learner workspace", async () => {
  const auth = await read("src/lib/auth.ts");

  assert.match(
    auth,
    /export async function requireTrainingAccessFast\(\) \{[\s\S]*return requireAuthenticatedUserFast\("\/workspace\/training"\);[\s\S]*\}/,
  );
  assert.doesNotMatch(auth, /does%20not%20have%20access%20to%20the%20learner%20workspace/);
});


test("training-only Google accounts cannot leak into the VA recruiter directory", async () => {
  const [bootstrap, migration] = await Promise.all([
    read("src/lib/profile-bootstrap.ts"),
    read("supabase/migrations/20260929081000_keep_training_accounts_out_of_va_directory.sql"),
  ]);

  assert.match(bootstrap, /isTrainingOnlyUser/);
  assert.match(bootstrap, /account_type === "training"/);
  assert.match(bootstrap, /if \(isTrainingOnlyUser\(user\)\) return null/);
  assert.match(migration, /not in \('client', 'va'\)/);
  assert.match(migration, /join auth\.users au on au\.id = p\.id/);
  assert.match(migration, /raw_app_meta_data->>'account_type' = 'training'/);
  assert.match(migration, /revoke all on public\.recruiter_va_directory from public, anon, authenticated/);
});


test("training session continuity falls back to the verified auth user when claims need refresh", async () => {
  const auth = await read("src/lib/auth.ts");

  assert.match(auth, /let userId = typeof data\?\.claims\?\.sub === "string"/);
  assert.match(auth, /if \(error \|\| !userId\) \{[\s\S]*supabase\.auth\.getUser\(\)/);
  assert.match(auth, /userId = userData\.user\.id/);
});

test("signed-in learners are not sent back through training login or signup CTAs", async () => {
  const [page, nav] = await Promise.all([
    read("src/app/training/page.tsx"),
    read("src/components/site-nav.tsx"),
  ]);

  assert.match(page, /getSessionProfile/);
  assert.match(page, /const signedIn = Boolean\(user\)/);
  assert.match(page, /signedIn \? `\/workspace\/training\/courses\/\$\{course\.slug\}` : trainingJoinHref\(course\.slug\)/);
  assert.match(page, /signedIn \? "\/workspace\/training" : JOIN_HREF/);
  assert.match(page, /Go to learner dashboard/);
  assert.match(page, /<TrainingMobileCta href=\{trainingHomeHref\} label=\{signedIn \? "Continue training" : "Start free training"\}\/>/);
  assert.match(nav, /href=\{user \? "\/workspace\/training" : trainingContextLoginHref\}/);
  assert.match(nav, /user \? "Continue training" : "Start free training"/);
  assert.match(nav, /user \? "My learning" : "Training login"/);
});
