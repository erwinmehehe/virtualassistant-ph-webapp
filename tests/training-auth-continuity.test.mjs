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

test("training login preserves course intent and avoids social signup", async () => {
  const login = await read("src/app/auth/login/page.tsx");

  assert.match(login, /trainingCourseSlug = safeTrainingCourseSlug/);
  assert.match(login, /trainingJoinHref\(trainingCourseSlug\)/);
  assert.match(login, /socialEnabled = \(googleEnabled \|\| microsoftEnabled\) && !trainingLogin/);
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
