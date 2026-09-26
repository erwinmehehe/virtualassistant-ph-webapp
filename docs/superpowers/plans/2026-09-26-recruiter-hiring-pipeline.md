# Recruiter Hiring Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Connect recruiter leads directly to recruiting roles so every genuine hiring enquiry can move from inbox triage into internal matching in one clear workflow.

**Architecture:** Keep \`lead_intake\` as the intake/contact record and \`jobs\` as the recruiting source of truth. Extract the existing idempotent lead-to-job conversion into one shared server-side helper, add a recruiter-only action for legacy/unlinked leads, and redesign the recruiter lead card so the linked role and next hiring action are primary while CRM maintenance becomes secondary.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Supabase/Postgres, Node 22 test runner, CSS Modules, existing VAPH recruiter workspace components.

**Spec:** \`docs/superpowers/specs/2026-09-26-recruiter-hiring-pipeline-design.md\`

## Global Constraints

- Reuse \`lead_intake.job_id\` and \`jobs.lead_id\`; do not introduce a replacement relation.
- Do not create a second CRM subsystem.
- Do not replace the existing Role Control Center or \`StaffJobMatching\`.
- Internal matching may start immediately, but no automatic match may be represented as a client shortlist.
- Existing client-release, commercial, proposal, payment, and placement gates remain unchanged.
- Missing-role conversion must be idempotent and must never overwrite an existing recruiter or lead owner.
- Incomplete leads may create incomplete pending roles; existing role-readiness gates remain authoritative.
- Avoid N+1 role queries on the lead list; linked role context must be loaded in batch for the visible page only.
- Keep one dominant hiring CTA per lead card.
- Mobile order must remain Client -> Hiring need -> Role/action -> secondary CRM controls.
- No new paid dependency or infrastructure is introduced.

## Review Focus

1. **Concurrent clicks on "Create role & start matching"** -> exactly one role survives, the reverse link is repaired, and repeated clicks open the same role. Covered in Task 1 and Task 2 tests.
2. **Existing \`jobs.lead_id\` with missing \`lead_intake.job_id\`** -> reuse the existing role instead of creating a duplicate. Covered in Task 1.
3. **Existing recruiter/lead owner differs from acting recruiter** -> preserve current ownership. Covered in Task 2.
4. **Lead has incomplete category/budget/hours/timezone data** -> create a pending role with safe inferred/fallback fields and let readiness gates show what is missing. Covered in Task 1.
5. **Large lead page with mixed linked/unlinked records** -> one batched role lookup, no per-card job query, and unlinked leads still render a clear conversion CTA. Covered in Task 3.

---

### Task 1: Extract One Shared Lead-to-Role Conversion Path

**Files:**
- Create: \`src/lib/lead-role.ts\`
- Modify: \`src/app/actions/leads.ts\`
- Modify: \`tests/lead-job-idempotency.test.mjs\`
- Test: \`tests/lead-job-idempotency.test.mjs\`

**Interfaces:**
- Produces:
  - \`ensurePendingRoleForLead(args: EnsurePendingRoleForLeadArgs): Promise<string>\`
  - \`EnsurePendingRoleForLeadArgs\` contains \`admin\`, \`leadId\`, role/intake fields, optional \`clientId\`, optional \`requestedVaId\`, optional \`recruiterId\`, optional \`ownerId\`.
- Consumes existing helpers for category, hours, budget range, job title, clean summary/description, and existing Postgres uniqueness on one job per lead.

- [ ] **Step 1: Extend the idempotency test so it expects the shared helper**

Update \`tests/lead-job-idempotency.test.mjs\` to assert the shared helper owns the \`lead_intake.job_id\` check, \`jobs.lead_id\` recovery, reverse-link repair, recruiter assignment field, and that the old private \`createPendingJobForLead\` implementation no longer exists in \`leads.ts\`.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

\`\`\`bash
node --test tests/lead-job-idempotency.test.mjs
\`\`\`

Expected: FAIL because \`src/lib/lead-role.ts\` and \`ensurePendingRoleForLead\` do not exist yet.

- [ ] **Step 3: Implement \`src/lib/lead-role.ts\`**

Create:

\`\`\`ts
export type EnsurePendingRoleForLeadArgs = {
  admin: ReturnType<typeof createAdminClient>;
  leadId: string;
  title: string;
  service?: string | null;
  company?: string | null;
  hours?: string | null;
  timezone?: string | null;
  startTime?: string | null;
  message?: string | null;
  budget?: string | null;
  requestedVaId?: string | null;
  clientId?: string | null;
  recruiterId?: string | null;
  ownerId?: string | null;
};

export async function ensurePendingRoleForLead(
  args: EnsurePendingRoleForLeadArgs
): Promise<string>
\`\`\`

Behavior:

- Re-read \`lead_intake.job_id\`; return it if present.
- Query \`jobs.lead_id\`; if present, repair \`lead_intake.job_id\` and return the existing job ID.
- Otherwise create one \`pending\` role from the supplied lead fields using the same mappings currently in \`createPendingJobForLead\`.
- Set \`jobs.recruiter_id = recruiterId\` only at insert time when supplied.
- Update \`lead_intake.job_id\`, optional \`client_id\`, and \`owner_id\` only when \`owner_id\` is currently null.
- If insert loses a uniqueness race, re-read \`jobs.lead_id\`, repair the reverse link, and return the winner rather than surfacing a duplicate-role error.
- Never overwrite an existing role recruiter or lead owner.

- [ ] **Step 4: Replace the private helper in \`leads.ts\`**

Import \`ensurePendingRoleForLead\` and replace all current \`createPendingJobForLead(...)\` calls with the shared helper.

Public service, industry, and full role-brief submissions must retain their current behavior and redirects.

- [ ] **Step 5: Run focused regression tests**

Run:

\`\`\`bash
node --test tests/lead-job-idempotency.test.mjs tests/ai-lead-job-draft.test.mjs tests/role-brief-form-ux.test.mjs
\`\`\`

Expected: PASS.

- [ ] **Step 6: Run typecheck for the extraction**

Run:

\`\`\`bash
npm run typecheck
\`\`\`

Expected: PASS.

- [ ] **Step 7: Commit**

\`\`\`bash
git add src/lib/lead-role.ts src/app/actions/leads.ts tests/lead-job-idempotency.test.mjs
git commit -m "refactor: share idempotent lead role creation"
\`\`\`

---

### Task 2: Add Recruiter "Create Role & Start Matching" Action

**Files:**
- Create: \`src/app/actions/recruiter-hiring.ts\`
- Create: \`tests/recruiter-lead-role-bridge.test.mjs\`
- Test: \`tests/recruiter-lead-role-bridge.test.mjs\`

**Interfaces:**
- Consumes: \`ensurePendingRoleForLead(args)\` from Task 1.
- Produces:
  - \`createRoleFromLeadAndMatchAction(formData: FormData): Promise<never>\`
- Redirect target on success:
  - \`/workspace/recruiter/roles/{jobId}#matching\`

- [ ] **Step 1: Write the failing recruiter bridge test**

Create \`tests/recruiter-lead-role-bridge.test.mjs\` to assert the new action:

- requires recruiter role
- accepts only \`client_hiring\` leads
- calls \`ensurePendingRoleForLead\`
- passes acting recruiter as proposed recruiter and lead owner without overriding existing ownership
- writes recruiter activity
- redirects to the linked Role Control Center \`#matching\` anchor
- does not contain its own direct \`jobs.insert\` mapping implementation

- [ ] **Step 2: Run the new test and verify RED**

Run:

\`\`\`bash
node --test tests/recruiter-lead-role-bridge.test.mjs
\`\`\`

Expected: FAIL because the recruiter action does not exist.

- [ ] **Step 3: Implement \`createRoleFromLeadAndMatchAction\`**

The action must:

1. Require recruiter role.
2. Validate \`lead_id\`.
3. Load the \`client_hiring\` lead with the fields needed to construct a role.
4. Reject non-hiring leads.
5. Derive a safe role title from existing category/title helpers.
6. Call \`ensurePendingRoleForLead\` with \`recruiterId: user.id\` and \`ownerId: user.id\`.
7. Write \`role_created_from_lead\` or equivalent recruiter activity containing \`lead_id\`, \`job_id\`, and source \`hiring_inbox\`.
8. Revalidate recruiter lead, roles, and today pages.
9. Redirect to \`/workspace/recruiter/roles/\${jobId}#matching\`.

The shared helper owns idempotency and ownership preservation; the action must not duplicate those rules.

- [ ] **Step 4: Run bridge + idempotency tests**

Run:

\`\`\`bash
node --test tests/recruiter-lead-role-bridge.test.mjs tests/lead-job-idempotency.test.mjs
\`\`\`

Expected: PASS.

- [ ] **Step 5: Run typecheck**

Run:

\`\`\`bash
npm run typecheck
\`\`\`

Expected: PASS.

- [ ] **Step 6: Commit**

\`\`\`bash
git add src/app/actions/recruiter-hiring.ts tests/recruiter-lead-role-bridge.test.mjs
git commit -m "feat: create recruiter role from hiring lead"
\`\`\`

---

### Task 3: Make Linked Role State Primary in the Hiring Inbox

**Files:**
- Modify: \`src/app/workspace/recruiter/leads/page.tsx\`
- Modify: \`src/app/workspace/recruiter/leads/leads.module.css\`
- Modify: \`tests/recruiter-crm-design.test.mjs\`
- Modify: \`tests/recruiter-mobile-today-leads-roles.test.mjs\`
- Test: \`tests/recruiter-crm-design.test.mjs\`
- Test: \`tests/recruiter-mobile-today-leads-roles.test.mjs\`

**Interfaces:**
- Consumes: \`createRoleFromLeadAndMatchAction(formData)\` from Task 2.
- Produces: one clear role bridge per visible lead and batched linked-role context for the page.

- [ ] **Step 1: Write failing UI hierarchy assertions**

Update the CRM design and mobile tests to require:

- **Hiring Pipeline**
- **Hiring inbox**
- **Open role & match**
- **Create role & start matching**
- \`crm-role-bridge\`
- \`createRoleFromLeadAndMatchAction\`
- \`crm-secondary-controls\`
- mobile styling that stacks the role bridge before secondary controls

- [ ] **Step 2: Run UI tests and verify RED**

Run:

\`\`\`bash
node --test tests/recruiter-crm-design.test.mjs tests/recruiter-mobile-today-leads-roles.test.mjs
\`\`\`

Expected: FAIL on the new hierarchy/action assertions.

- [ ] **Step 3: Batch-load linked role context**

In \`RecruiterLeadsPage\`:

1. Collect unique visible \`lead.job_id\` values.
2. Run one \`jobs\` query using \`.in("id", jobIds)\`.
3. Select only inbox fields:
   - \`id\`
   - \`title\`
   - \`status\`
   - \`hiring_stage\`
   - \`recruiter_id\`
   - \`summary\`
   - \`responsibilities\`
   - \`required_skills\`
   - \`hours_per_week\`
   - \`min_hourly_rate\`
   - \`max_hourly_rate\`
   - \`timezone\`
   - \`start_timing\`
4. Build a \`Map<jobId, LinkedRoleSummary>\`.

Do not invoke \`matchAssessment\` or query candidate rows for every lead card.

- [ ] **Step 4: Replace the buried role badge/link with a primary role bridge**

Linked role state:

- role title
- human-readable hiring stage
- readiness summary based on existing required role fields
- CTA: **Open role & match**
- link: \`/workspace/recruiter/roles/\${lead.job_id}#matching\`

Unlinked \`client_hiring\` state:

- **No role yet**
- copy: "Create the recruiting role from this enquiry."
- form posting \`lead_id\` to \`createRoleFromLeadAndMatchAction\`
- CTA: **Create role & start matching**

Remove the old low-emphasis \`Role linked\` badge and buried \`View linked role\` button once the new bridge is present.

- [ ] **Step 5: Reorder the card around hiring work**

Primary visible order:

1. Client identity / SLA.
2. Hiring need.
3. Role bridge / primary action.
4. Immediate reply if due.
5. Discovery/proposal summaries when relevant.
6. Secondary CRM controls.

Wrap manual stage/owner/follow-up/value/lost-reason controls in \`crm-secondary-controls\` with lower visual emphasis. Preserve all existing form fields and server actions.

- [ ] **Step 6: Apply focused CSS changes**

In \`leads.module.css\`:

- Style \`crm-role-bridge\` as the dominant workflow panel.
- Indigo primary action for role/matching.
- Emerald only for ready/linked success state.
- Amber for missing role or readiness attention.
- Reduce visual prominence of \`crm-update-card\` under \`crm-secondary-controls\`.
- Preserve mobile order and 16px mobile form inputs.
- Avoid adding decorative panels unrelated to the workflow.

- [ ] **Step 7: Run targeted UI/regression tests**

Run:

\`\`\`bash
node --test tests/recruiter-crm-design.test.mjs tests/recruiter-mobile-today-leads-roles.test.mjs tests/recruiter-direct-lead-reply.test.mjs tests/recruiter-dashboard-call-rebooking.test.mjs tests/recruiter-leads-closed-state.test.mjs
\`\`\`

Expected: PASS.

- [ ] **Step 8: Run typecheck**

Run:

\`\`\`bash
npm run typecheck
\`\`\`

Expected: PASS.

- [ ] **Step 9: Commit**

\`\`\`bash
git add src/app/workspace/recruiter/leads/page.tsx src/app/workspace/recruiter/leads/leads.module.css tests/recruiter-crm-design.test.mjs tests/recruiter-mobile-today-leads-roles.test.mjs
git commit -m "feat: make recruiter inbox role-first"
\`\`\`

---

### Task 4: Rename Recruiter Navigation Around Hiring Work

**Files:**
- Modify: \`src/components/app-nav-links.tsx\`
- Modify: \`tests/recruiter-ops-clarity.test.mjs\`
- Test: \`tests/recruiter-ops-clarity.test.mjs\`

**Interfaces:**
- Consumes existing recruiter routes.
- Produces clearer labels without changing route URLs.

- [ ] **Step 1: Write failing navigation assertions**

Update \`tests/recruiter-ops-clarity.test.mjs\` to assert recruiter navigation includes:

- **Hiring inbox** -> \`/workspace/recruiter/leads\`
- **Active roles** -> \`/workspace/recruiter/roles\`
- **Talent** -> unchanged
- **Client Success** -> unchanged

Also assert the old recruiter labels **Leads** and **Roles** are no longer the primary sidebar labels.

- [ ] **Step 2: Run focused test and verify RED**

Run:

\`\`\`bash
node --test tests/recruiter-ops-clarity.test.mjs
\`\`\`

Expected: FAIL on new label expectations.

- [ ] **Step 3: Update \`AppNavLinks\` labels only**

Keep route hrefs and mobile primary destinations unchanged:

\`\`\`ts
["Hiring inbox", "/workspace/recruiter/leads", BriefcaseBusiness]
["Active roles", "/workspace/recruiter/roles", BriefcaseBusiness]
\`\`\`

Do not add a new navigation route merely to represent "Client review"; client-review work continues to live inside the Role Control Center for this release.

- [ ] **Step 4: Run navigation + mobile tests**

Run:

\`\`\`bash
node --test tests/recruiter-ops-clarity.test.mjs tests/recruiter-mobile-today-leads-roles.test.mjs
\`\`\`

Expected: PASS.

- [ ] **Step 5: Commit**

\`\`\`bash
git add src/components/app-nav-links.tsx tests/recruiter-ops-clarity.test.mjs
git commit -m "ux: rename recruiter navigation around hiring"
\`\`\`

---

### Task 5: Whole-Flow Verification and Pull Request

**Files:**
- No product file is added solely for this task.
- Verify all files changed by Tasks 1-4.

**Interfaces:**
- Consumes the completed branch.
- Produces a reviewable PR with evidence that the lead-to-role workflow remains safe.

- [ ] **Step 1: Run the complete targeted recruiter suite**

Run the lead-role, recruiter bridge, CRM design, mobile, direct reply, discovery/no-show, closed-lead, recruiter clarity, and unified role workspace tests together.

Expected: all PASS.

- [ ] **Step 2: Run static quality checks**

Run:

\`\`\`bash
npm run typecheck
npm run lint
\`\`\`

Expected: both PASS.

- [ ] **Step 3: Run the full repository suite**

Run:

\`\`\`bash
npm test
\`\`\`

Expected: PASS. If any pre-existing failure appears, record the exact test and prove whether the branch caused it before proceeding.

- [ ] **Step 4: Build production bundle**

Run:

\`\`\`bash
npm run build
\`\`\`

Expected: successful Next.js production build.

- [ ] **Step 5: Browser-verify the complete recruiter story**

Using the Vercel/browser verification workflow on a preview deployment, verify:

1. Recruiter navigation shows **Hiring inbox** and **Active roles**.
2. Hiring inbox loads without console/runtime errors.
3. Linked lead shows **Open role & match**.
4. Unlinked hiring lead shows **Create role & start matching**.
5. Triggering the conversion lands at the exact Role Control Center \`#matching\` anchor.
6. Repeating the conversion does not produce a second role.
7. Direct client reply still works.
8. Discovery/no-show recovery controls still work.
9. Mobile lead card order is Client -> Hiring need -> Role/action -> secondary controls.
10. Candidates remain internal unless the existing release gate says the role can be sent to the client.

Use a controlled test lead or safe test fixture; do not alter a real client's hiring state merely to exercise the flow.

- [ ] **Step 6: Create the pull request**

PR title:

\`\`\`
Connect recruiter hiring inbox to roles and matching
\`\`\`

PR body must summarize:

- shared idempotent lead-to-role helper
- recruiter one-click role recovery/creation
- role-first Hiring inbox hierarchy
- navigation rename
- no changes to client-release/payment/placement gates
- targeted test, full test, typecheck, lint, build, and browser verification results

- [ ] **Step 7: Review the PR before merge**

Check:

- no duplicate lead-to-job mapping logic remains
- no N+1 linked-role query
- no automatic client release
- no ownership overwrite
- no regression to direct reply/discovery/proposal controls
- UI has one dominant hiring CTA per lead

- [ ] **Step 8: Merge only after green CI and review**

After merge, verify the production deployment commit matches the merge commit and repeat the smoke checks for:

- \`/workspace/recruiter/leads\`
- \`/workspace/recruiter/roles\`
- one linked role path

Do not claim the redesign live until production deployment is READY and the recruiter flow has been checked.
