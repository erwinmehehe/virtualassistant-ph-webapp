import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(path, "utf8");
}

test("VA hub leads with profile registration while keeping training and jobs available", async () => {
  const page = await source("src/app/for-virtual-assistants/page.tsx");
  assert.match(page, /Build a VA profile recruiters can understand in minutes\./);
  assert.match(page, /Create free VA profile/);
  assert.match(page, /Free to join/);
  assert.match(page, /No worker placement fee/);
  assert.match(page, /href="\/training"/);
  assert.match(page, /href="\/jobs"/);
  assert.match(page, /href="\/auth\/join\/va"/);
  assert.match(page, /getPublicTrainingOverview/);
  assert.match(page, /Available now/);
  assert.match(page, /In production/);
});

test("desktop nav does not repeat the VA hub inside the login menu", async () => {
  const nav = await source("src/components/site-nav.tsx");
  const desktopLoginBlock = nav.match(/<div className="va-nav-panel va-nav-panel-login">([\s\S]*?)<\/div>/)?.[1] || "";
  assert.doesNotMatch(desktopLoginBlock, /href="\/for-virtual-assistants"/);
  assert.match(nav, /<Link href="\/for-virtual-assistants">For VAs<\/Link>/);
});

test("learner course UI hides internal content versions", async () => {
  const course = await source("src/app/workspace/training/courses/[slug]/page.tsx");
  assert.doesNotMatch(course, /Version \{course\.content_version\}/);
  assert.doesNotMatch(course, /v\{lesson\.content_version\}/);
});

test("training sidebar has one clear active learning destination", async () => {
  const shell = await source("src/components/training-shell.tsx");
  assert.match(shell, /href="\/workspace\/training" aria-current="page"/);
  assert.match(shell, /<div className="sidebar-label">Training<\/div>/);
  assert.match(shell, /VA learner/);
  assert.match(shell, /Training account/);
});

test("VA hub metadata stays within search-result length targets", async () => {
  const page = await source("src/app/for-virtual-assistants/page.tsx");
  const title = page.match(/const META_TITLE = "([^"]+)"/)?.[1] || "";
  const description = page.match(/const META_DESCRIPTION =\s*\n\s*"([^"]+)"/)?.[1] || "";
  assert.ok(title.length >= 50 && title.length <= 60, `title length: ${title.length}`);
  assert.ok(description.length >= 150 && description.length <= 160, `description length: ${description.length}`);
});


test("VA registration stays short before the detailed profile", async () => {
  const [join, shell, submit] = await Promise.all([
    source("src/components/join-account-form.tsx"),
    source("src/components/auth-experience-shell.tsx"),
    source("src/components/join-submit-button.tsx"),
  ]);

  assert.match(join, /Create your free VA profile/);
  assert.match(join, /Free to join/);
  assert.match(join, /Private until you opt in/);
  assert.match(shell, /Quick setup/);
  assert.match(shell, /No fee to create a profile or apply for roles/);
  assert.match(submit, /Create free VA profile/);
});
