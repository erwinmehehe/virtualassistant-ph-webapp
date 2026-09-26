import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("client account access emails are protected from optional email quota",async()=>{
  const [email,matching]=await Promise.all([
    read("src/lib/email.ts"),
    read("src/app/actions/matching.ts"),
  ]);

  assert.match(email,/RESEND_RESERVED_CRITICAL_RECIPIENTS \|\| "40"/);
  const claim=email.match(/export async function sendClaimDraftEmail[\s\S]*?export async function sendRoleDetailsRequestEmail/)?.[0]||"";
  assert.match(claim,/priority: "critical"/);

  const invite=matching.match(/if \(mode === "invite" && inviteLead\)[\s\S]*?const newlyReleasedGoodMatches/)?.[0]||"";
  assert.match(invite,/eventType: "client_shortlist_invite"/);
  assert.match(invite,/priority: "critical"/);
  assert.match(invite,/idempotencyKey:/);
});

test("client account claim failure falls back to a usable manual link instead of throwing",async()=>{
  const [action,page]=await Promise.all([
    read("src/app/actions/agency-role.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);

  const claim=action.match(/export async function sendClientAccountClaimAction[\s\S]*?function readinessLines/)?.[0]||"";
  assert.match(claim,/client_claim_email_unavailable=1/);
  assert.doesNotMatch(claim,/if \(!result\.sent\) throw new Error/);

  assert.match(page,/client_claim_email_unavailable/);
  assert.match(page,/client_invite_email_unavailable/);
  assert.match(page,/\/auth\/join\/client\?lead=/);
  assert.match(page,/Open client account link/);
});

test("shortlist invite failure keeps the saved shortlist and exposes the manual claim fallback",async()=>{
  const matching=await read("src/app/actions/matching.ts");

  assert.match(matching,/client_invite_email_unavailable=1/);
  assert.doesNotMatch(matching,/The shortlist was saved internally, but the client invite email could not be sent\. Check the email configuration and try again\./);
  assert.match(matching,/client_review_invite_email_unavailable/);
});
