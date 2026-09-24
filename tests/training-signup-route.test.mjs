import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public training signup route renders the dedicated training account flow", async () => {
  const [page, form] = await Promise.all([
    read("src/app/auth/join/training/page.tsx"),
    read("src/components/training-join-form.tsx"),
  ]);

  assert.match(page, /TrainingJoinForm/);
  assert.match(page, /robots: \{ index: false, follow: false \}/);
  assert.match(page, /current="join"/);
  assert.match(form, /useActionState\(joinTrainingAction/);
  assert.match(form, /training_signup_submit_click/);
  assert.match(form, /This account does not create a candidate profile or enter you into recruiter vetting/);
});

test("training signup creates a training-only auth user and sends confirmation", async () => {
  const action = await read("src/app/actions/training-auth.ts");

  assert.match(action, /account_type: "training"/);
  assert.match(action, /admin\.auth\.admin\.generateLink/);
  assert.match(action, /trainingCourseDestination\(courseSlug\)/);
  assert.match(action, /sendAccountConfirmationEmail/);
  assert.match(action, /auth\.resend/);
  assert.match(action, /training_account_created/);
  assert.match(action, /training_confirmation_sent/);
});

test("training confirmation allows users without candidate profiles into training", async () => {
  const confirm = await read("src/app/auth/confirm/route.ts");

  assert.match(confirm, /const trainingDestination = isTrainingPath\(requestedNext\)/);
  assert.match(confirm, /!profile && !trainingDestination/);
  assert.match(confirm, /const fallback = profile \? `\/workspace\/\$\{profile\.role\}` : "\/workspace\/training"/);
  assert.match(confirm, /training_email_confirmed/);
});

test("training signup navigation does not repeat the signup CTA on the signup page", async () => {
  const [page, header] = await Promise.all([
    read("src/app/auth/join/training/page.tsx"),
    read("src/components/training-site-header.tsx"),
  ]);

  assert.match(page, /current="join"/);
  assert.match(header, /const isJoin = current === "join"/);
  assert.match(header, /isJoin \? \([\s\S]*Training login[\s\S]*\) : \([\s\S]*Start free training/);
  assert.match(header, /isJoin \? "Training home" : "Courses"/);
});


test("training signup primary CTA is simply Create account", async () => {
  const form = await read("src/components/training-join-form.tsx");
  assert.match(form, /pending \? "Creating account…" : "Create account"/);
  assert.doesNotMatch(form, /Create account and continue/);
  assert.doesNotMatch(form, /Create free training account/);
});
