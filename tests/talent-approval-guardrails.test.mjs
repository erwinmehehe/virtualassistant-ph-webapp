import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

async function actionFiles(dir = "src/app/actions") {
  const absolute = new URL("../" + dir + "/", import.meta.url);
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await actionFiles(relative));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(relative);
  }
  return files;
}

test("approval-ready filters include null-stage VAs instead of losing them to neq semantics", async () => {
  const filters = await read("src/lib/recruiter-talent-filters.ts");

  assert.match(filters, /stage\.is\.null,and\(stage\.neq\.approved,stage\.neq\.bench,stage\.neq\.rejected\)/);
  assert.match(filters, /readiness === "approval_ready"/);
  assert.match(filters, /readiness === "approval_cleanup"/);
  assert.match(filters, /RECRUITER_BULK_LIMIT = 500/);
});

test("recruiter bulk actions hard-block selections above 500 and reuse the shared filter helper", async () => {
  const [recruiter, talentAction, talentPage] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/actions/recruiter-talent.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx")
  ]);

  assert.match(recruiter, /applyRecruiterTalentFilters/);
  assert.match(recruiter, /selected\.length > RECRUITER_BULK_LIMIT/);
  assert.doesNotMatch(recruiter, /\.slice\(0, 500\)/);
  assert.match(recruiter, /Bulk actions are limited to \$\{RECRUITER_BULK_LIMIT\} selected VAs/);
  assert.match(talentAction, /Number\(filteredCount \|\| 0\) > RECRUITER_BULK_LIMIT/);
  assert.match(talentPage, /Filtered bulk unavailable/);
  assert.match(talentPage, /Approval cleanup/);
});

test("every direct approved-stage write in server actions has the centralized 80 percent guard", async () => {
  const files = await actionFiles();
  const violations = [];
  let writes = 0;

  for (const file of files) {
    const source = await read(file);
    const matcher = /stage\s*:\s*["']approved["']/g;
    for (const match of source.matchAll(matcher)) {
      writes += 1;
      const index = match.index ?? 0;
      const start = source.lastIndexOf("export async function", index);
      const next = source.indexOf("export async function", index + match[0].length);
      const block = source.slice(Math.max(0, start), next === -1 ? source.length : next);
      if (!/isRowApprovable|assertApprovalCompletion/.test(block)) {
        violations.push(file + " at " + index);
      }
    }
  }

  assert.ok(writes >= 3, "Expected the known recruiter/admin/final-review approval writes.");
  assert.deepEqual(violations, [], "Every approval write must use the centralized approval guard.");
});

test("admin and finalist approval paths use the centralized eligibility policy", async () => {
  const [admin, vetting, visibility] = await Promise.all([
    read("src/app/actions/admin.ts"),
    read("src/app/actions/vetting.ts"),
    read("src/lib/public-visibility.ts")
  ]);

  assert.match(visibility, /isApprovalCompletionEligible/);
  assert.match(visibility, /approvalEligibility/);
  assert.match(visibility, /assertApprovalCompletion/);
  assert.match(admin, /filter\(isRowApprovable\)/);
  assert.match(vetting, /assertApprovalCompletion\(completion\)/);
});

test("completion is enforced when approving, not re-applied as a hidden matching gate", async () => {
  const [recruiter, matching, clientShortlist, visibility] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/actions/matching.ts"),
    read("src/app/actions/client-shortlist.ts"),
    read("src/lib/public-visibility.ts")
  ]);

  assert.match(visibility, /APPROVAL_MIN_COMPLETION = 80/);
  assert.match(recruiter, /rows\.filter\(isRowApprovable\)/);
  assert.doesNotMatch(recruiter, /approved and still have at least 60% profile completion/);
  assert.doesNotMatch(matching, /filter\(isRowApprovable\)/);
  assert.doesNotMatch(clientShortlist, /isRowApprovable/);
  assert.match(clientShortlist, /\["approved", "bench"\]\.includes/);
});
