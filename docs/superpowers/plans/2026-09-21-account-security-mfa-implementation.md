# Account Security and Staff TOTP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared Account Settings with session visibility and safe logout controls, then add TOTP MFA that is mandatory for Admin/Recruiter and optional-but-enforced-once-enabled for Client/VA.

**Architecture:** Keep first-factor authentication and role resolution separate from MFA enforcement so staff can always reach the security setup screen without redirect loops. Use Supabase Auth's TOTP/AAL APIs for factor enrollment and challenge, a small server-only account-security module for session and event data, and narrowly scoped Postgres RPCs for session revocation instead of exposing `auth.sessions` to the browser. Roll out in layers: account/session UI first, then MFA setup/challenge, then workspace enforcement and recovery.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.7, Supabase Auth/Postgres, @supabase/ssr 0.6, @supabase/supabase-js 2.49, Node test runner, Playwright production smoke.

**Spec:** `docs/superpowers/specs/2026-09-21-account-security-mfa-design.md`

## Global Constraints

- Admin: TOTP required.
- Recruiter: TOTP required.
- Client: TOTP optional.
- VA: TOTP optional.
- Once any user enables TOTP, future protected workspace access requires AAL2.
- Leaked-password protection is out of scope.
- Do not collect precise GPS location.
- Do not add IP geolocation in v1.
- Do not expose TOTP secrets, refresh tokens, auth cookies, or recovery links to application logs.
- Do not mass-delete, rewrite, or invalidate existing `auth.sessions` during migration.
- Normal logout affects only the current device.
- Keep `/workspace/admin/settings` as agency settings; personal settings live at `/workspace/account`.
- Do not add global AAL2 RLS policies to every existing business table in this release.
- Staff MFA enforcement must have an emergency environment kill switch and default to enabled only after production smoke verification.

## Review Focus

- **Redirect loops during mandatory staff setup:** a staff user with no factor must reach `/workspace/account?tab=security&setup=required` even though normal staff workspace routes require MFA. Task 5 adds an explicit test that Account Settings remains first-factor accessible.
- **Optional MFA users accidentally forced to enroll:** Client/VA with no verified factor must remain AAL1-compatible. Task 6 tests both roles with no factor and with an enrolled factor.
- **Cross-user session revocation:** a user must never be able to revoke a session belonging to another account by guessing a UUID. Task 3 tests the SQL ownership check and rejects current-session misuse.
- **Recovery lockout:** staff who lose their authenticator must have an audited admin-assisted factor-removal path that never lets an AAL1 admin recover their own MFA. Task 7 tests self-recovery rejection and target-user session invalidation.
- **OAuth bypass:** Google/Microsoft login must land in the same factor/setup gate as password login. Task 6 tests callback routing for staff and opted-in users.

---

### Task 1: Add security-event storage and safe own-session RPCs

**Files:**
- Create: `supabase/migrations/20260921_account_security_events_and_session_controls.sql`
- Create: `tests/account-security-schema.test.mjs`

**Interfaces:**
- Consumes: Supabase `auth.sessions`, `auth.jwt()`, `auth.uid()`.
- Produces:
  - table `public.account_security_events`
  - RPC `public.list_own_auth_sessions()`
  - RPC `public.revoke_own_auth_session(uuid)`

- [ ] **Step 1: Write the failing schema regression test**

Create `tests/account-security-schema.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account security migration stores private events and exposes only own sessions", async () => {
  const sql = await read("supabase/migrations/20260921_account_security_events_and_session_controls.sql");

  assert.match(sql, /create table if not exists public\.account_security_events/i);
  assert.match(sql, /user_id uuid not null references auth\.users\(id\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /auth\.uid\(\) = user_id/i);

  assert.match(sql, /create or replace function public\.list_own_auth_sessions\(\)/i);
  assert.match(sql, /from auth\.sessions/i);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/i);

  assert.match(sql, /create or replace function public\.revoke_own_auth_session\(target_session_id uuid\)/i);
  assert.match(sql, /id = target_session_id/i);
  assert.match(sql, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(sql, /auth\.jwt\(\)->>'session_id'/i);
});

test("session RPC does not accept a browser-supplied user id", async () => {
  const sql = await read("supabase/migrations/20260921_account_security_events_and_session_controls.sql");
  assert.doesNotMatch(sql, /list_own_auth_sessions\s*\(\s*user_id/i);
  assert.doesNotMatch(sql, /revoke_own_auth_session\s*\([^)]*user_id/i);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tests/account-security-schema.test.mjs
```

Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Implement the migration**

Create the migration with this structure:

```sql
create table if not exists public.account_security_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  session_id uuid null,
  ip inet null,
  user_agent text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists account_security_events_user_created_idx
  on public.account_security_events (user_id, created_at desc);

alter table public.account_security_events enable row level security;

revoke all on public.account_security_events from anon;
grant select on public.account_security_events to authenticated;

create policy "users read own account security events"
  on public.account_security_events
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.list_own_auth_sessions()
returns table (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  not_after timestamptz,
  refreshed_at timestamp,
  user_agent text,
  ip inet,
  aal text
)
language sql
security definer
set search_path = pg_catalog, auth, public
as $$
  select s.id, s.created_at, s.updated_at, s.not_after, s.refreshed_at,
         s.user_agent, s.ip, s.aal::text
  from auth.sessions s
  where s.user_id = (select auth.uid())
    and (s.not_after is null or s.not_after > now())
  order by coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) desc;
$$;

revoke all on function public.list_own_auth_sessions() from public, anon;
grant execute on function public.list_own_auth_sessions() to authenticated;

create or replace function public.revoke_own_auth_session(target_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, auth, public
as $$
declare
  current_session_id uuid;
  deleted_count integer;
begin
  current_session_id := nullif((select auth.jwt()->>'session_id'), '')::uuid;

  if target_session_id is null or target_session_id = current_session_id then
    return false;
  end if;

  delete from auth.sessions
   where id = target_session_id
     and user_id = (select auth.uid());

  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

revoke all on function public.revoke_own_auth_session(uuid) from public, anon;
grant execute on function public.revoke_own_auth_session(uuid) to authenticated;
```

Do not grant insert/update/delete on `account_security_events` to `authenticated`; writes remain server-controlled.

- [ ] **Step 4: Run schema regression test**

Run:

```bash
node --test tests/account-security-schema.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Apply migration to a Supabase branch or controlled test environment and verify behavior**

Run SQL checks:

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in ('list_own_auth_sessions', 'revoke_own_auth_session');

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'account_security_events';
```

Expected: both functions and the table exist.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260921_account_security_events_and_session_controls.sql tests/account-security-schema.test.mjs
git commit -m "feat: add account security session controls"
```

---

### Task 2: Build the server-side account-security module

**Files:**
- Create: `src/lib/account-security.ts`
- Create: `tests/account-security-lib.test.mjs`

**Interfaces:**
- Consumes: `createClient()`, `createAdminClient()`, `list_own_auth_sessions()`.
- Produces:
  - `type AccountSession`
  - `type SecurityEventType`
  - `getAccountSecurityState(): Promise<AccountSecurityState>`
  - `recordSecurityEvent(args): Promise<void>`
  - `requireSensitiveAal2(): Promise<void>`
  - `safeAccountNext(value, fallback): string`

- [ ] **Step 1: Write failing module regression tests**

Create `tests/account-security-lib.test.mjs` that asserts the module uses server-derived identity and JWT session ID:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("account security state derives identity and current session server-side", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /auth\.getUser\(\)/);
  assert.match(source, /auth\.getClaims\(\)/);
  assert.match(source, /claims.*session_id/s);
  assert.match(source, /rpc\("list_own_auth_sessions"\)/);
  assert.doesNotMatch(source, /userId:\s*string/);
});

test("sensitive AAL2 helper redirects to MFA instead of silently allowing aal1", async () => {
  const source = await read("src/lib/account-security.ts");
  assert.match(source, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(source, /currentLevel !== "aal2"/);
  assert.match(source, /\/auth\/mfa/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/account-security-lib.test.mjs
```

Expected: FAIL because `src/lib/account-security.ts` does not exist.

- [ ] **Step 3: Implement focused helpers**

Use a server-only module. Core shapes:

```ts
import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type SecurityEventType =
  | "login_succeeded"
  | "logout_current"
  | "logout_others"
  | "logout_all"
  | "password_changed"
  | "totp_enrollment_started"
  | "totp_enabled"
  | "totp_factor_removed"
  | "mfa_challenge_succeeded"
  | "mfa_challenge_failed"
  | "admin_mfa_recovery";

export type AccountSession = {
  id: string;
  created_at: string;
  updated_at: string;
  not_after: string | null;
  refreshed_at: string | null;
  user_agent: string | null;
  ip: string | null;
  aal: "aal1" | "aal2" | null;
  current: boolean;
};

export function safeAccountNext(value: string | null | undefined, fallback = "/workspace/account?tab=security") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

export async function getAccountSecurityState() {
  const supabase = await createClient();
  const [{ data: userData }, { data: claimsData }, { data: aalData }, { data: factorsData }, sessions] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getClaims(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
      supabase.rpc("list_own_auth_sessions"),
    ]);

  const user = userData.user;
  if (!user) redirect("/auth/login?next=/workspace/account");

  const currentSessionId = typeof claimsData?.claims?.session_id === "string"
    ? claimsData.claims.session_id
    : null;

  return {
    user,
    currentLevel: aalData?.currentLevel ?? "aal1",
    nextLevel: aalData?.nextLevel ?? "aal1",
    factors: factorsData?.totp ?? [],
    sessions: (sessions.data ?? []).map((row) => ({
      ...row,
      current: row.id === currentSessionId,
    })),
  };
}
```

`recordSecurityEvent()` must derive `user_id` from `auth.getUser()`, derive session ID from `getClaims()`, derive IP/user-agent from `headers()`, and write with the admin client. It must not accept `user_id`, IP, session ID, or user-agent from the browser.

`requireSensitiveAal2()` must call `getAuthenticatorAssuranceLevel()` and redirect to `/auth/mfa?next=...` when the session can/should be upgraded.

- [ ] **Step 4: Run module test and typecheck**

```bash
node --test tests/account-security-lib.test.mjs
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/account-security.ts tests/account-security-lib.test.mjs
git commit -m "feat: add account security server helpers"
```

---

### Task 3: Add Account Settings, session UI, and scoped logout controls

**Files:**
- Create: `src/app/workspace/account/page.tsx`
- Create: `src/app/actions/account-security.ts`
- Create: `src/components/account-security/session-list.tsx`
- Modify: `src/components/app-nav-links.tsx`
- Modify: `src/app/actions/auth.ts`
- Create: `tests/account-settings-security.test.mjs`

**Interfaces:**
- Consumes: `getAccountSecurityState()`, `recordSecurityEvent()`, RPC `revoke_own_auth_session(uuid)`.
- Produces actions:
  - `logoutCurrentDeviceAction()`
  - `logoutOtherDevicesAction()`
  - `logoutEverywhereAction()`
  - `revokeOwnSessionAction(formData)`

- [ ] **Step 1: Write failing Account Settings regression tests**

Create `tests/account-settings-security.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all workspace roles expose shared Account settings", async () => {
  const nav = await read("src/components/app-nav-links.tsx");
  for (const role of ["client", "va", "recruiter", "admin"]) {
    const roleStart = nav.indexOf(`${role}: [`);
    assert.notEqual(roleStart, -1);
  }
  assert.match(nav, /Account settings/);
  assert.match(nav, /\/workspace\/account/);
});

test("ordinary logout is local while explicit controls cover others and global", async () => {
  const [auth, account] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/app/actions/account-security.ts"),
  ]);
  assert.match(auth, /signOut\(\{ scope: "local" \}\)/);
  assert.match(account, /signOut\(\{ scope: "others" \}\)/);
  assert.match(account, /signOut\(\{ scope: "global" \}\)/);
});

test("session revocation calls own-session RPC instead of accepting a user id", async () => {
  const account = await read("src/app/actions/account-security.ts");
  assert.match(account, /rpc\("revoke_own_auth_session"/);
  assert.doesNotMatch(account, /formData\.get\("user_id"\)/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/account-settings-security.test.mjs
```

Expected: FAIL because Account Settings/actions do not exist and logout is not local.

- [ ] **Step 3: Implement session actions**

In `src/app/actions/account-security.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { recordSecurityEvent } from "@/lib/account-security";

const sessionIdSchema = z.string().uuid();

export async function revokeOwnSessionAction(formData: FormData) {
  const parsed = sessionIdSchema.safeParse(String(formData.get("session_id") || ""));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("revoke_own_auth_session", { target_session_id: parsed.data });
  redirect("/workspace/account?tab=security");
}

export async function logoutOtherDevicesAction() {
  const supabase = await createClient();
  await recordSecurityEvent({ eventType: "logout_others" });
  await supabase.auth.signOut({ scope: "others" });
  redirect("/workspace/account?tab=security");
}

export async function logoutEverywhereAction() {
  const supabase = await createClient();
  await recordSecurityEvent({ eventType: "logout_all" });
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login?message=You%20have%20been%20logged%20out%20on%20all%20devices");
}
```

Change existing `logoutAction()` in `src/app/actions/auth.ts` to:

```ts
export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
```

- [ ] **Step 4: Implement Account Settings server page**

`src/app/workspace/account/page.tsx` must use `requireAnyRole(["admin","recruiter","client","va"])`, render Account/Security tabs, and pass server-derived security state to the session list.

Account tab:

```tsx
<section className="card stack">
  <div>
    <h2>Account</h2>
    <p className="muted">Your personal sign-in and identity settings.</p>
  </div>
  <div className="data-row"><span>Name</span><strong>{profile.full_name}</strong></div>
  <div className="data-row"><span>Email</span><strong>{user.email}</strong></div>
  <div className="data-row"><span>Role</span><strong>{profile.role}</strong></div>
  <Link className="btn" href="/auth/update-password?source=account">Change password</Link>
</section>
```

Security tab renders TOTP status placeholder plus `<SessionList />`. Task 4 replaces the placeholder with live TOTP controls.

- [ ] **Step 5: Add Account Settings to every role nav**

Add `["Account settings", "/workspace/account", Settings]` as a secondary item for all four roles. Do not replace Admin's Agency Settings item.

- [ ] **Step 6: Implement device display without adding a new dependency**

Create a small parser in `session-list.tsx` that maps common user-agent fragments to human-readable labels:

```ts
function deviceLabel(userAgent: string | null) {
  const ua = userAgent || "";
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Browser";
  const os = /Windows NT/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "Unknown device";
  return `${browser} on ${os}`;
}
```

Show current badge, IP, created time, last activity, and AAL. Non-current rows get a revoke form. The current row does not expose a "revoke session" button; ordinary logout handles it.

- [ ] **Step 7: Run targeted tests, full tests, and typecheck**

```bash
node --test tests/account-settings-security.test.mjs
npm test
npm run typecheck
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/workspace/account/page.tsx src/app/actions/account-security.ts src/components/account-security/session-list.tsx src/components/app-nav-links.tsx src/app/actions/auth.ts tests/account-settings-security.test.mjs
git commit -m "feat: add shared account security settings"
```

---

### Task 4: Add TOTP enrollment and factor management

**Files:**
- Create: `src/components/account-security/totp-manager.tsx`
- Modify: `src/app/workspace/account/page.tsx`
- Modify: `src/app/actions/account-security.ts`
- Create: `tests/totp-enrollment.test.mjs`

**Interfaces:**
- Consumes browser `createClient()`, Supabase `auth.mfa.enroll/challenge/verify/listFactors/unenroll`.
- Produces:
  - `TotpManager` client component
  - `confirmMfaEnabledAction()`
  - `removeTotpFactorAction(formData)`

- [ ] **Step 1: Write failing TOTP tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("TOTP manager enrolls, challenges, verifies, and never persists the secret", async () => {
  const source = await read("src/components/account-security/totp-manager.tsx");
  assert.match(source, /auth\.mfa\.enroll\(\{\s*factorType: "totp"/s);
  assert.match(source, /auth\.mfa\.challenge\(/);
  assert.match(source, /auth\.mfa\.verify\(/);
  assert.match(source, /totp\.qr_code/);
  assert.match(source, /totp\.secret/);
  assert.doesNotMatch(source, /localStorage\.setItem/);
  assert.doesNotMatch(source, /sessionStorage\.setItem/);
});

test("factor removal is server-mediated and requires higher assurance", async () => {
  const action = await read("src/app/actions/account-security.ts");
  assert.match(action, /removeTotpFactorAction/);
  assert.match(action, /requireSensitiveAal2/);
  assert.match(action, /auth\.mfa\.unenroll/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/totp-enrollment.test.mjs
```

Expected: FAIL because the TOTP manager does not exist.

- [ ] **Step 3: Implement enrollment client component**

The component owns transient QR/secret/code state only in React memory:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TotpManager({ onVerified }: { onVerified?: () => void }) {
  const supabase = createClient();
  const [enrollment, setEnrollment] = useState<null | {
    factorId: string;
    qrCode: string;
    secret: string;
  }>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function beginEnrollment() {
    setError("");
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Authenticator app",
    });
    if (error) return setError(error.message);
    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
  }

  async function verifyEnrollment() {
    if (!enrollment) return;
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
    if (challenge.error) return setError(challenge.error.message);

    const verified = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    if (verified.error) return setError("That authenticator code is invalid or expired.");

    await supabase.auth.refreshSession();
    setEnrollment(null);
    setCode("");
    onVerified?.();
    window.location.reload();
  }

  // render status, QR code, manual secret, six-digit input, cancel, verify
}
```

Cancel must call `mfa.unenroll({ factorId })` for an unverified enrollment before clearing state so abandoned factors do not accumulate.

- [ ] **Step 4: Add server-side factor removal**

```ts
export async function removeTotpFactorAction(formData: FormData) {
  const factorId = z.string().uuid().parse(String(formData.get("factor_id") || ""));
  await requireSensitiveAal2("/workspace/account?tab=security");
  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error("Could not remove authenticator factor.");
  await recordSecurityEvent({ eventType: "totp_factor_removed", metadata: { factor_id: factorId } });
  redirect("/workspace/account?tab=security");
}
```

After successful client verification, call a narrow server action `confirmMfaEnabledAction()` that verifies current AAL is now `aal2` and at least one verified TOTP factor exists before recording `totp_enabled`.

- [ ] **Step 5: Render factor status and backup-factor prompt**

Security tab rules:

- no factors: "Authenticator app is not enabled"
- one verified factor: "Enabled" + "Add backup authenticator"
- 2+ verified factors: list friendly names and removal controls
- staff: show "Required for your role"
- client/VA: show "Optional"

Never render the secret after enrollment state is cleared.

- [ ] **Step 6: Run tests**

```bash
node --test tests/totp-enrollment.test.mjs
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/account-security/totp-manager.tsx src/app/workspace/account/page.tsx src/app/actions/account-security.ts tests/totp-enrollment.test.mjs
git commit -m "feat: add authenticator app enrollment"
```

---

### Task 5: Add the MFA challenge route without creating setup loops

**Files:**
- Create: `src/app/auth/mfa/page.tsx`
- Create: `src/components/auth/mfa-challenge.tsx`
- Modify: `src/lib/account-security.ts`
- Create: `tests/mfa-challenge.test.mjs`

**Interfaces:**
- Consumes `safeAccountNext()`, browser Supabase MFA APIs.
- Produces `/auth/mfa?next=<safe internal path>`.

- [ ] **Step 1: Write failing challenge tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("MFA challenge verifies a selected TOTP factor and uses a safe internal return path", async () => {
  const [page, challenge, security] = await Promise.all([
    read("src/app/auth/mfa/page.tsx"),
    read("src/components/auth/mfa-challenge.tsx"),
    read("src/lib/account-security.ts"),
  ]);

  assert.match(page, /safeAccountNext/);
  assert.match(challenge, /auth\.mfa\.listFactors\(\)/);
  assert.match(challenge, /auth\.mfa\.challenge\(/);
  assert.match(challenge, /auth\.mfa\.verify\(/);
  assert.match(challenge, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(challenge, /currentLevel === "aal2"/);
  assert.match(security, /startsWith\("\/"\)/);
  assert.match(security, /startsWith\("\/\/"\)/);
});

test("MFA page sends users without verified factors to setup instead of looping", async () => {
  const page = await read("src/app/auth/mfa/page.tsx");
  assert.match(page, /verifiedFactors\.length === 0/);
  assert.match(page, /workspace\/account\?tab=security&setup=required/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/mfa-challenge.test.mjs
```

Expected: FAIL because challenge route does not exist.

- [ ] **Step 3: Implement server page**

The server page must require a signed-in user but must not call an MFA-enforced workspace guard.

```tsx
export default async function MfaPage({ searchParams }) {
  const params = await searchParams;
  const next = safeAccountNext(params.next, "/workspace/account?tab=security");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(next)}`);

  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verifiedFactors = (factors?.totp ?? []).filter((factor) => factor.status === "verified");

  if (verifiedFactors.length === 0) {
    redirect("/workspace/account?tab=security&setup=required");
  }

  return <MfaChallenge factors={verifiedFactors} next={next} />;
}
```

- [ ] **Step 4: Implement challenge component**

On submit:

1. challenge selected factor
2. verify six-digit code
3. fetch AAL again
4. only redirect when `currentLevel === "aal2"`
5. show generic error otherwise

Use `window.location.assign(next)` only with the server-sanitized `next` prop.

- [ ] **Step 5: Add rate limiting to challenge attempts**

Add a narrowly scoped server action `checkMfaChallengeRateLimitAction()` using existing `enforceActionRateLimit` keyed by authenticated user ID before client verification. The client calls it before each challenge attempt.

Expected policy: 8 attempts / 15 minutes.

- [ ] **Step 6: Run tests and typecheck**

```bash
node --test tests/mfa-challenge.test.mjs
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/auth/mfa/page.tsx src/components/auth/mfa-challenge.tsx src/lib/account-security.ts src/app/actions/account-security.ts tests/mfa-challenge.test.mjs
git commit -m "feat: add TOTP challenge flow"
```

---

### Task 6: Enforce MFA after every authentication path and on protected workspaces

**Files:**
- Modify: `src/lib/auth.ts`
- Modify: `src/app/actions/auth.ts`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/auth/confirm/route.ts`
- Modify: `src/app/workspace/admin/layout.tsx`
- Modify: `src/app/workspace/recruiter/layout.tsx`
- Modify: `src/app/workspace/client/layout.tsx`
- Modify: `src/app/workspace/va/layout.tsx`
- Create: `tests/mfa-role-enforcement.test.mjs`

**Interfaces:**
- Produces:
  - `mfaDecisionForSession(role, currentLevel, verifiedFactorCount)`
  - `requireRoleWithMfa(role)`
  - `postAuthMfaDestination(args)`

- [ ] **Step 1: Write failing role-policy tests**

Create tests that pin the policy matrix:

```js
test("staff requires enrollment while client and VA do not", async () => {
  const auth = await read("src/lib/auth.ts");
  assert.match(auth, /admin.*setup_required/s);
  assert.match(auth, /recruiter.*setup_required/s);
  assert.match(auth, /client.*allow/s);
  assert.match(auth, /va.*allow/s);
});

test("any role with a verified factor requires aal2", async () => {
  const auth = await read("src/lib/auth.ts");
  assert.match(auth, /verifiedFactorCount > 0/);
  assert.match(auth, /currentLevel !== "aal2"/);
  assert.match(auth, /challenge_required/);
});

test("OAuth callback passes through the same MFA destination logic", async () => {
  const callback = await read("src/app/auth/callback/route.ts");
  assert.match(callback, /postAuthMfaDestination/);
});

test("Account Settings remains reachable before staff enrollment", async () => {
  const account = await read("src/app/workspace/account/page.tsx");
  assert.match(account, /requireAnyRole/);
  assert.doesNotMatch(account, /requireRoleWithMfa/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/mfa-role-enforcement.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement a pure MFA decision function**

In `src/lib/auth.ts`:

```ts
type MfaDecision = "allow" | "setup_required" | "challenge_required";

export function mfaDecisionForSession(
  role: Role,
  currentLevel: "aal1" | "aal2" | null,
  verifiedFactorCount: number,
): MfaDecision {
  const staff = role === "admin" || role === "recruiter";
  if (staff && verifiedFactorCount === 0) return "setup_required";
  if (verifiedFactorCount > 0 && currentLevel !== "aal2") return "challenge_required";
  return "allow";
}
```

This pure function must be directly unit-testable in addition to source regression tests.

- [ ] **Step 4: Implement workspace guard with kill switch**

Add:

```ts
export async function requireRoleWithMfa(role: Role) {
  const session = await requireRoleFast(role);
  if (process.env.STAFF_MFA_ENFORCEMENT === "off") return session;

  const supabase = await createClient();
  const [{ data: aal }, { data: factors }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  const verified = (factors?.totp ?? []).filter((factor) => factor.status === "verified");
  const decision = mfaDecisionForSession(role, aal?.currentLevel ?? "aal1", verified.length);

  if (decision === "setup_required") {
    redirect("/workspace/account?tab=security&setup=required");
  }
  if (decision === "challenge_required") {
    redirect(`/auth/mfa?next=${encodeURIComponent(`/workspace/${role}`)}`);
  }
  return session;
}
```

The kill switch is for emergency rollback only. Do not advertise it in the UI.

- [ ] **Step 5: Switch all four role layouts to `requireRoleWithMfa`**

Admin/Recruiter become mandatory; Client/VA are unaffected until they enroll a factor.

- [ ] **Step 6: Apply the same gate after email/password login**

After profile resolution, compute `postAuthMfaDestination` before the final redirect. Preserve the requested safe destination.

- [ ] **Step 7: Apply the same gate to OAuth callback and email-confirmation callback**

OAuth and confirmation routes must not send staff directly into the workspace at AAL1.

- [ ] **Step 8: Add account-password change action with AAL2, leaving recovery flow intact**

Do not overload the password-recovery action.

Add `changePasswordFromAccountAction(formData)` in `src/app/actions/account-security.ts`:

```ts
export async function changePasswordFromAccountAction(formData: FormData) {
  await requireSensitiveAal2("/workspace/account?tab=account");
  const password = String(formData.get("password") || "");
  // use the same exported password policy helper as signup/recovery
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error("Could not update password.");
  await recordSecurityEvent({ eventType: "password_changed" });
  redirect("/workspace/account?tab=account&password=updated");
}
```

Refactor the existing password validation into an exported server-safe helper so signup, recovery, and Account Settings use one rule.

- [ ] **Step 9: Run targeted and full verification**

```bash
node --test tests/mfa-role-enforcement.test.mjs tests/auth-security-hardening.test.mjs
npm test
npm run typecheck
npm run build
```

Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/lib/auth.ts src/app/actions/auth.ts src/app/actions/account-security.ts src/app/auth/callback/route.ts src/app/auth/confirm/route.ts src/app/workspace/*/layout.tsx tests/mfa-role-enforcement.test.mjs
git commit -m "feat: enforce MFA by account role"
```

---

### Task 7: Add audited admin-assisted MFA recovery

**Files:**
- Create: `src/app/actions/admin-security.ts`
- Modify: `src/app/workspace/admin/users/page.tsx`
- Create: `tests/admin-mfa-recovery.test.mjs`

**Interfaces:**
- Consumes `requireRole("admin")`, `requireSensitiveAal2()`, `createAdminClient().auth.admin.mfa.deleteFactor()`.
- Produces `recoverUserMfaAction(formData)`.

- [ ] **Step 1: Write failing recovery tests**

```js
test("admin MFA recovery requires admin role, AAL2, and blocks self recovery", async () => {
  const source = await read("src/app/actions/admin-security.ts");
  assert.match(source, /requireRole\("admin"\)/);
  assert.match(source, /requireSensitiveAal2/);
  assert.match(source, /targetUserId === user\.id/);
  assert.match(source, /cannot recover your own MFA/i);
});

test("recovery uses Supabase admin factor deletion and records the event", async () => {
  const source = await read("src/app/actions/admin-security.ts");
  assert.match(source, /auth\.admin\.mfa\.deleteFactor/);
  assert.match(source, /admin_mfa_recovery/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/admin-mfa-recovery.test.mjs
```

Expected: FAIL.

- [ ] **Step 3: Implement recovery action**

Core flow:

```ts
export async function recoverUserMfaAction(formData: FormData) {
  const { user } = await requireRole("admin");
  await requireSensitiveAal2("/workspace/admin/users");

  const targetUserId = z.string().uuid().parse(String(formData.get("user_id") || ""));
  const factorId = z.string().uuid().parse(String(formData.get("factor_id") || ""));

  if (targetUserId === user.id) {
    throw new Error("You cannot recover your own MFA from this admin session.");
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.mfa.deleteFactor({
    userId: targetUserId,
    id: factorId,
  });
  if (error) throw new Error("Could not remove the user's authenticator factor.");

  await recordSecurityEventForUser({
    targetUserId,
    eventType: "admin_mfa_recovery",
    metadata: { recovered_by: user.id, factor_id: factorId },
  });

  revalidatePath("/workspace/admin/users");
}
```

`recordSecurityEventForUser` must remain server-only and must not be exported to client components.

- [ ] **Step 4: Add recovery UI only on Admin Users**

Show verified factor count and a recovery action only for another user. Require an explicit confirmation text such as `REMOVE MFA` before submitting. Do not show TOTP secrets.

- [ ] **Step 5: Verify that deleting a verified factor invalidates sessions in Supabase integration testing**

Use a disposable test user with TOTP:

1. create/enroll factor
2. create at least one session
3. admin delete factor
4. assert the previous session can no longer refresh/use the protected workspace

Do not run this against a real staff account.

- [ ] **Step 6: Run tests**

```bash
node --test tests/admin-mfa-recovery.test.mjs
npm test
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/actions/admin-security.ts src/app/workspace/admin/users/page.tsx tests/admin-mfa-recovery.test.mjs
git commit -m "feat: add audited MFA recovery"
```

---

### Task 8: Add production security activity and authenticated smoke coverage

**Files:**
- Modify: `src/app/actions/auth.ts`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `src/app/actions/account-security.ts`
- Modify: `scripts/authenticated-production-smoke.mjs`
- Create: `tests/account-security-events.test.mjs`

**Interfaces:**
- Consumes `recordSecurityEvent()`.
- Produces trustworthy recent-security-activity rows and smoke assertions.

- [ ] **Step 1: Write failing event tests**

```js
test("security events are written from trusted auth actions without browser-supplied IP or user id", async () => {
  const [auth, account] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/app/actions/account-security.ts"),
  ]);
  assert.match(auth, /login_succeeded/);
  assert.match(account, /logout_current|logout_others|logout_all/);
  assert.doesNotMatch(account, /formData\.get\("ip"\)/);
  assert.doesNotMatch(account, /formData\.get\("user_id"\)/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/account-security-events.test.mjs
```

Expected: FAIL until event writes are wired.

- [ ] **Step 3: Record successful authentication events**

After successful password login and OAuth callback, record `login_succeeded` only after a valid user/profile exists. Do not attempt to record anonymous failed-login events in this release because `account_security_events.user_id` intentionally requires an authenticated account.

- [ ] **Step 4: Record current-device logout before local signout**

In `logoutAction()`, call:

```ts
try {
  await recordSecurityEvent({ eventType: "logout_current" });
} catch {
  // Logging failure must not prevent logout.
}
await supabase.auth.signOut({ scope: "local" });
```

Security-event logging failures must never block the actual security action.

- [ ] **Step 5: Extend authenticated production smoke**

Add smoke checks that do not mutate real account security:

- Account Settings returns 200 for all four role fixtures.
- Security page contains "Where you're logged in".
- Admin/Recruiter fixture behavior is controlled by a dedicated MFA-ready smoke account or by running with enforcement kill switch off until staff test factors are enrolled.
- Client/VA fixtures with no factor remain able to access their workspaces.
- Cross-role guards still work.

Do not enroll or delete factors on persistent production staff fixtures in routine CI.

- [ ] **Step 6: Run full verification**

```bash
node --test tests/account-security-events.test.mjs
npm test
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/app/actions/auth.ts src/app/auth/callback/route.ts src/app/actions/account-security.ts scripts/authenticated-production-smoke.mjs tests/account-security-events.test.mjs
git commit -m "test: cover account security production flows"
```

---

### Task 9: Controlled rollout and staff enrollment

**Files:**
- Modify: `README.md` or existing deployment/runbook documentation if one exists.
- No application behavior changes unless smoke finds a defect.

**Interfaces:**
- Consumes all previous tasks.
- Produces a verified production rollout with staff AAL2.

- [ ] **Step 1: Deploy migration before enabling staff enforcement**

Apply `20260921_account_security_events_and_session_controls.sql`.

Verify:

```sql
select count(*) from public.account_security_events;
select routine_name
from information_schema.routines
where routine_schema='public'
  and routine_name in ('list_own_auth_sessions','revoke_own_auth_session');
```

Expected: table and both RPCs exist.

- [ ] **Step 2: Deploy application with staff enforcement temporarily disabled**

Set:

```text
STAFF_MFA_ENFORCEMENT=off
```

Deploy and smoke Account Settings, session listing, local logout behavior, and client/VA login.

- [ ] **Step 3: Enroll TOTP for both Admin and Recruiter accounts**

For each internal staff account:

1. Log in normally.
2. Open `/workspace/account?tab=security`.
3. Enroll primary authenticator.
4. Verify AAL2.
5. Add a backup authenticator where practical.
6. Confirm session row shows AAL2.

Do not enable mandatory enforcement until every active Admin and Recruiter has at least one verified factor.

- [ ] **Step 4: Enable staff enforcement**

Set:

```text
STAFF_MFA_ENFORCEMENT=on
```

Redeploy.

- [ ] **Step 5: Run role-by-role production smoke**

Verify:

```text
Admin:
- AAL1 cannot enter /workspace/admin
- verified TOTP challenge upgrades to AAL2
- /workspace/account remains reachable for setup/recovery

Recruiter:
- same as Admin

Client without TOTP:
- workspace still opens at AAL1

VA without TOTP:
- workspace still opens at AAL1

Opted-in client/VA test account:
- AAL1 is redirected to /auth/mfa
- successful TOTP returns to intended workspace
```

- [ ] **Step 6: Verify session management using non-critical test accounts**

Check:

- current session is marked correctly from JWT `session_id`
- another session can be revoked
- current-device logout leaves another session active
- "logout other devices" preserves current session
- "logout everywhere" ends all sessions

- [ ] **Step 7: Verify no secret leakage**

Search runtime logs for:

```text
otpauth://
totp.secret
refresh_token
sb-*-auth-token
```

Expected: no TOTP secret, refresh token, or auth cookie values.

- [ ] **Step 8: Final branch verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Then run authenticated production smoke with the dedicated role fixtures.

Expected: all green.

- [ ] **Step 9: Commit rollout documentation**

```bash
git add README.md
git commit -m "docs: add account security rollout runbook"
```
