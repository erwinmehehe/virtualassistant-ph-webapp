import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

const clientControls = ["client-company-full-name","client-company-company-name","client-company-website","client-company-logo-url","client-company-industry","client-company-team-size","client-company-location","client-company-company-description","client-company-hiring-needs","client-company-hiring-notes"];
const vaControls = ["va-profile-full-name","va-profile-headline","va-profile-bio","va-profile-avatar","va-profile-primary-category","va-profile-years-experience","va-profile-categories","va-profile-skills","va-profile-tools","va-profile-industries","va-profile-languages","va-profile-weekly-hours","va-profile-hourly-rate","va-profile-schedule","va-profile-overlap-hours","va-profile-availability-status","va-profile-linkedin-url","va-profile-portfolio-url"];

test("Company fields have explicit visible label associations, not just adjacent text", async () => {
  const source = await read("src/app/workspace/client/company/page.tsx");
  for (const id of clientControls) {
    assert.ok(source.includes('htmlFor="' + id + '"'), "Missing label for " + id);
    assert.ok(source.includes('id="' + id + '"'), "Missing matching control for " + id);
  }
});

test("VA profile fields, including selects and photo upload, have linked labels", async () => {
  const source = await read("src/app/workspace/va/profile/page.tsx");
  for (const id of vaControls) {
    assert.ok(source.includes('htmlFor="' + id + '"'), "Missing label for " + id);
    assert.ok(source.includes('id="' + id + '"'), "Missing matching control for " + id);
  }
});

test("Admin role management and recruiter bulk selects are named for assistive tech", async () => {
  const [admin, recruiter] = await Promise.all([
    read("src/app/workspace/admin/users/page.tsx"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
  ]);
  assert.match(admin, /<select name="role" aria-label=\{/);
  assert.match(recruiter, /<select name="bulk_action" aria-label="Bulk action for selected VAs"/);
  assert.match(recruiter, /<select name="job_id" aria-label="Hiring role for selected VAs"/);
});
