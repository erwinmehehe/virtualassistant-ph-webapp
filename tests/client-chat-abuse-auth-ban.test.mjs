import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("client-to-recruiter messages have atomic account-wide and repeat limits", async () => {
  const [action, limiter, rpc] = await Promise.all([
    read("src/app/actions/client-recruiter-chat.ts"),
    read("src/lib/rate-limit.ts"),
    read("supabase/migrations/20261004211000_restore_atomic_rate_limit_contract.sql"),
  ]);

  assert.match(action, /requireAnyRole\(\["client", "recruiter"\]\)/);
  assert.match(action, /if \(!body \|\| body\.length > 4000\)/);
  assert.doesNotMatch(action, /\.trim\(\)\.slice\(0,\s*4000\)/);
  assert.match(action, /if \(profile\.role === "client"\) \{\s*const normalizedBody = body\.normalize\("NFKC"\)\.toLowerCase\(\)\.replace\(\/\\s\+\/g, " "\)\.trim\(\)/);
  assert.match(action, /enforceActionRateLimit\("client_recruiter_chat:client:burst", user\.id, 8, 1\)/);
  assert.match(action, /enforceActionRateLimit\("client_recruiter_chat:client:hour", user\.id, 40, 60\)/);
  assert.match(action, /if \(normalizedBody\.length >= 24\)/);
  assert.match(action, /"client_recruiter_chat:client:repeat",\s*\x60\$\{user\.id\}:\$\{normalizedBody\}\x60,\s*2,\s*15/s);

  const ownership = action.indexOf('if (requestedClientId && requestedClientId !== thread.client_id)');
  const limit = action.indexOf('enforceActionRateLimit("client_recruiter_chat:client:burst"');
  const insert = action.indexOf('.from("client_recruiter_messages")');
  assert.ok(ownership > 0 && limit > ownership && insert > limit, "validate conversation ownership before charging limiter and writing");
  assert.match(limiter, /admin\.rpc\("consume_action_rate_limit"/);
  assert.match(limiter, /throw new Error\("We could not verify this request safely/);
  assert.match(rpc, /on conflict \(action_key, subject_hash\)[\s\S]*do update/);
  assert.match(rpc, /revoke all on function public\.consume_action_rate_limit[\s\S]*from public, anon, authenticated/);
});

test("moderation never reports an unverified provider ban or silently unbans", async () => {
  const [action, auth] = await Promise.all([
    read("src/app/actions/moderation.ts"),
    read("src/lib/auth.ts"),
  ]);

  assert.match(action, /auth\.admin\.getUserById\(userId\)/);
  assert.match(action, /auth\.admin\.updateUserById\(userId,/);
  assert.match(action, /ban_duration: banned \? "876000h" : "none"/);
  assert.match(action, /if \(confirmed !== banned\)/);
  assert.match(action, /auth_ban_verified: authBanVerified/);
  assert.match(action, /auth_unban_verified: false/);
  assert.match(action, /if \(!authUnbanVerified\) \{[\s\S]*throw new Error\("Supabase Auth unban was not confirmed/);
  assert.match(action, /if \(data\.role === "admin"\)/);
  assert.match(action, /if \(!targetId \|\| targetId === actorId\)/);
  assert.doesNotMatch(action, /\.catch\(\(\) => \{\}\)/);
  assert.match(auth, /profile\.account_status === "banned"/);
  assert.match(auth, /await supabase\.auth\.signOut\(\)/);
});

test("only administrators can reconcile Auth state on an already-banned account", async () => {
  const [action, ui] = await Promise.all([
    read("src/app/actions/moderation.ts"),
    read("src/app/workspace/admin/moderation/page.tsx"),
  ]);
  const reconcile = action.slice(
    action.indexOf("export async function reconcileBannedUserAuthAction"),
    action.indexOf("export async function unbanUserAction"),
  );
  assert.match(reconcile, /await requireRole\("admin"\)/);
  assert.match(reconcile, /await loadModerationTarget\(admin, user\.id, userId\)/);
  assert.match(reconcile, /profile\.account_status !== "banned"/);
  assert.match(reconcile, /readAuthBanState\(admin, userId\)/);
  assert.match(reconcile, /user_auth_ban_reconciled/);
  assert.match(reconcile, /user_auth_ban_reconciliation_failed/);
  assert.match(ui, /form action=\{reconcileBannedUserAuthAction\}/);
  assert.match(ui, /Verify \/ retry Auth ban/);
  assert.match(ui, /form action=\{unbanUserAction\}/);
});


test("real-action security acceptance uses only disposable loopback accounts and saves redacted evidence", async () => {
  const [browser, workflow] = await Promise.all([
    read("e2e/client-chat-auth-ban-acceptance.spec.ts"),
    read(".github/workflows/browser-db-contracts.yml"),
  ]);
  assert.match(browser, /!loopback\(BASE\) \|\| !loopback\(DB\)/);
  assert.match(browser, /Refusing to test against any hosted app/);
  assert.match(browser, /account_status: kind === "ban" \? "banned" : "active"/);
  for (const caseLabel of [
    "eighth distinct client message succeeds",
    "third long duplicate",
    "fortieth attempt",
    "forged conversation and oversize",
    "recruiter can still reply",
    "Auth ban reconciliation is verified and idempotent",
    "client cannot access the moderation workspace",
  ]) assert.ok(browser.includes(caseLabel), "Missing " + caseLabel);
  assert.match(browser, /blockedClient\.auth\.signInWithPassword/);
  assert.match(browser, /unblockedClient\.auth\.signInWithPassword/);
  assert.match(browser, /acceptance-summary\.json/);
  assert.match(workflow, /Retain isolated chat and Auth-ban acceptance summary/);
  assert.match(workflow, /artifacts\/chat-auth-uat\//);
});
