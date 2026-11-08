import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
function action(source, name, next) {
  const start = source.indexOf("export async function " + name);
  const end = next ? source.indexOf("export async function " + next, start) : source.length;
  assert.ok(start >= 0 && end > start, "Action boundary must exist: " + name);
  return source.slice(start, end);
}

test("accepted tasks cannot be reopened by stale VA submissions", async () => {
  const source = await read("src/app/actions/workroom.ts");
  const body = action(source, "updateTaskStatusAction", "toggleChecklistAction");
  assert.match(body, /if \(task\.status === "done"\) throw/);
  assert.match(body, /\.eq\("id", taskId\)\.eq\("status", task\.status\)/);
  assert.match(body, /\.select\("id"\)\.maybeSingle\(\)/);
  assert.match(body, /if \(!updated\) throw/);
  assert.match(body, /Clients can only accept tasks that are ready for review/);
  assert.match(body, /Submit the task for client review instead of marking it done/);
});

test("time logging does not silently report successful save on database errors", async () => {
  const source = await read("src/app/actions/workroom.ts");
  const body = action(source, "logTimeAction", "updateTimeEntryAction");
  assert.match(body, /const \{ error: insertError \} = await supabase\.from\("time_entries"\)\.insert/);
  assert.match(body, /if \(insertError\) throw/);
});

test("VA time corrections and deletion cannot race against approval or invoicing", async () => {
  const source = await read("src/app/actions/workroom.ts");
  const edit = action(source, "updateTimeEntryAction", "deleteTimeEntryAction");
  const del = action(source, "deleteTimeEntryAction", "reviewTimeEntryAction");
  for (const body of [edit, del]) {
    assert.match(body, /entry\.status === "approved" \|\| entry\.payment_id/);
    assert.match(body, /\.eq\("status", entry\.status\)\s*\.is\("payment_id", null\)/);
    assert.match(body, /\.select\("id"\)\.maybeSingle\(\)/);
  }
  assert.match(edit, /if \(updateError\) throw/);
  assert.match(edit, /if \(!updated\) throw/);
  assert.match(del, /if \(error\) throw/);
  assert.match(del, /if \(!deleted\) throw/);
});

test("client time reviews accept pending uninvoiced entries once", async () => {
  const source = await read("src/app/actions/workroom.ts");
  const body = action(source, "reviewTimeEntryAction", "submitPlacementReviewAction");
  assert.match(body, /entry\.status !== "pending" \|\| entry\.payment_id/);
  assert.match(body, /\.eq\("status", "pending"\)\.is\("payment_id", null\)/);
  assert.match(body, /if \(reviewError\) throw/);
  assert.match(body, /if \(!reviewed\) throw/);
  assert.ok(body.indexOf("if (!reviewed)") < body.indexOf('if (decision === "changes") {'));
});

test("already-vetted VA cannot bypass profile-review rules using quick setup", async () => {
  const source = await read("src/app/actions/va-onboarding.ts");
  const body = action(source, "saveVaOnboardingBasicsAction", "saveVaOnboardingWorkAction");
  assert.match(body, /\.from\("va_vetting"\)\.select\("stage"\)/);
  assert.match(body, /\["approved", "bench"\]\.includes/);
  assert.match(body, /Use Edit profile to request specialty or headline changes/);
  assert.match(body, /\.eq\("primary_category", currentProfile\.primary_category\)/);
  assert.ok(body.indexOf("if ([\"approved\", \"bench\"].includes") < body.indexOf(".update({ primary_category: category, headline })"));
});

test("approved VAs cannot update rates or availability through quick setup", async () => {
  const source = await read("src/app/actions/va-onboarding.ts");
  const body = action(source, "saveVaOnboardingWorkAction", "completeVaQuickSetupAction");
  assert.match(body, /\.from\("va_vetting"\)\s*\.select\("stage"\)/);
  assert.match(body, /\["approved", "bench"\]\.includes/);
  assert.match(body, /Use Edit profile to change your work preferences/);
  assert.ok(body.indexOf('if (["approved", "bench"].includes') < body.indexOf("years_experience: yearsExperience,"));
});

test("password change reports other-session revocation results accurately", async () => {
  const source = await read("src/app/actions/account-security.ts");
  const body = action(source, "changeAccountPasswordAction", "updateAccountProfileAction");
  assert.match(body, /const \{ error: signOutError \} = await supabase\.auth\.signOut\(\{ scope: "others" \}\)/);
  assert.match(body, /if \(signOutError\)/);
  assert.match(body, /otherSessionsRevoked = true/);
  assert.match(body, /other_sessions_revoked: otherSessionsRevoked/);
  assert.match(body, /existing access tokens may remain valid until/);
  assert.match(body, /could not confirm other device sessions were revoked/);
});

test("VA profile stages uploads before writing rows and protects referenced files", async () => {
  const source = await read("src/app/actions/profile.ts");
  const body = action(source, "updateVaProfileAction", "removeVaResumeAction");
  const firstWrite = body.indexOf('const { data: savedAccount, error: nameError } = await admin.from("profiles")');
  const stagedResume = body.indexOf("stagedResumePath = path");
  const stagedAvatar = body.indexOf("stagedAvatarPath = path");
  assert.ok(firstWrite > stagedResume && stagedResume >= 0);
  assert.ok(firstWrite > stagedAvatar && stagedAvatar >= 0);
  assert.match(body, /if \(stagedResumePath\) \{\s*await supabase\.storage\.from\("resumes"\)\.remove/);
  assert.match(body, /if \(stagedAvatarPath\) \{\s*await supabase\.storage\.from\("avatars"\)\.remove/);
  assert.match(body, /resumePointer\.data\?\.resume_path !== stagedResumePath/);
  assert.match(body, /avatarPointer\.data\?\.avatar_url !== stagedAvatarUrl/);
  assert.ok(body.indexOf("current.resume_path !== stagedResumePath") > firstWrite);
});