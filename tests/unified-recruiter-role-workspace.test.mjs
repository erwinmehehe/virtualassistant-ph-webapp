import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("recruiter role page is the canonical matching and client handoff workspace", async () => {
  const page = await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  assert.match(page, /StaffJobMatching/);
  assert.match(page, /id="matching"/);
  assert.match(page, /id="client-handoff"/);
  assert.match(page, /Client handoff/);
  assert.match(page, /sendClientShortlistFollowupAction/);
  assert.match(page, /client_shortlist_viewed/);
  assert.match(page, /Client has not viewed the shortlist yet/);
  assert.match(page, /job\.recruiter_id && job\.recruiter_id !== userId/);
  assert.match(page, /This role is assigned to another recruiter/);
});

test("legacy recruiter detail routes point at the canonical workflow", async () => {
  const [matchingDetail, clientReview] = await Promise.all([
    read("src/app/workspace/recruiter/matching/[id]/page.tsx"),
    read("src/app/workspace/recruiter/client-review/page.tsx")
  ]);
  assert.ok(matchingDetail.includes("/workspace/recruiter/roles/"));
  assert.ok(clientReview.includes("/workspace/recruiter/roles?view=waiting_client&sort=urgent"));
});

test("legacy role board redirects into canonical Roles views", async () => {
  const page = await read("src/app/workspace/recruiter/matching/page.tsx");
  assert.match(page,/LEGACY_VIEW_MAP/);
  assert.match(page,/waiting_client: "waiting_client"/);
  assert.match(page,/redirect\(\`\/workspace\/recruiter\/roles\?view=\$\{view\}&sort=\$\{sort\}\`\)/);
  assert.doesNotMatch(page,/createAdminClient|job_shortlist_candidates|\.from\("applications"\)/);
});

test("client shortlist is capped, ordered, and persisted", async () => {
  const [table, actions, clientPage, migration, hiringRoomMigration] = await Promise.all([
    read("src/components/matching-candidate-table.tsx"),
    read("src/app/actions/matching.ts"),
    read("src/app/workspace/client/candidates/page.tsx"),
    read("supabase/migrations/20260922035431_add_shortlist_order.sql"),
    read("supabase/migrations/20260924172000_client_hiring_room_summary.sql")
  ]);
  assert.match(table, /Aim for 3–5 client-ready candidates/);
  assert.match(table, /moveSelected/);
  assert.match(table, /shortlist_order/);
  assert.match(actions, /selected\.length > 5/);
  assert.match(actions, /shortlist_order:/);
  assert.match(clientPage, /selectedReleased/);
  assert.match(hiringRoomMigration, /shortlist_order/);
  assert.match(hiringRoomMigration, /order by r\.shortlist_order asc nulls last/);
  assert.match(migration, /add column if not exists shortlist_order integer/);
  assert.match(migration, /job_shortlist_candidates_job_order_idx/);
});

test("unified role workspace has responsive local navigation and preview ordering UI", async () => {
  const css = await read("src/app/workspace/recruiter-role-workspace.css");
  assert.match(css, /\.role-workflow-nav/);
  assert.match(css, /\.role-handoff-stats/);
  assert.match(css, /\.shortlist-preview-order/);
  assert.match(css, /@media \(max-width: 800px\)/);
  assert.match(css, /@media \(max-width: 520px\)/);
});
