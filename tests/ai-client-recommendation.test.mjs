import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter matching no longer depends on AI recommendation controls",async()=>{
  const table=await read("src/components/matching-candidate-table.tsx");
  assert.doesNotMatch(table,/generateClientRecommendationAction/);
  assert.doesNotMatch(table,/Regenerate with AI/);
  assert.doesNotMatch(table,/Generating recommendation/);
  assert.doesNotMatch(table,/AI-generated, recruiter editable/);
  assert.match(table,/Save client note/);
  assert.match(table,/Saved separately, or automatically when you Save\/Send selected candidates/);
});

test("automatic match suggestions are not preselected for client send",async()=>{
  const table=await read("src/components/matching-candidate-table.tsx");
  const matching=await read("src/components/staff-job-matching.tsx");
  assert.match(matching,/created_by/);
  assert.match(table,/shortlist_status === "proposed" && Boolean\(row\.shortlist\?\.created_by\)/);
  assert.match(table,/Only checked candidates are included in Save or Send/);
  assert.match(table,/Send \{selectedCount \|\| 0\} to client/);
});

test("bulk save and release persist each selected candidate client note",async()=>{
  const action=await read("src/app/actions/matching.ts");
  assert.match(action,/cleanClientRecommendation/);
  assert.match(action,/formData\.get\(\`recommendation_\$\{vaId\}\`\)/);
  assert.match(action,/client_recommendation:/);
  assert.match(action,/job\.status !== "published"/);
  assert.match(action,/commercial\?\.commercial_status !== "accepted"/);
});
