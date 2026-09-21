# Complete Account Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current card-heavy Account Settings page with a complete five-section Account Center, richer session/device/location security detail, persisted display preferences, bounded account export, and a non-destructive deletion-request flow.

**Architecture:** Keep the existing Next.js App Router account route and Supabase Auth/session controls, but split new responsibilities into focused helpers: pure device parsing, display-preference storage/formatting, and privacy actions/routes. Enrich existing account security events with coarse Vercel geolocation and device metadata, then join that metadata onto live Supabase auth sessions by `session_id` for display. Persist only owner-scoped preference/deletion records through RLS, and keep destructive account deletion out of scope.

**Tech Stack:** Next.js 15 App Router, React 19 Server Components/Server Actions, TypeScript, Supabase Auth/Postgres/RLS, Vercel request geolocation headers, Resend, Node test runner, GitHub Actions, Playwright authenticated dashboard visual QA.

**Spec:** `docs/superpowers/specs/2026-09-21-account-center-complete-settings-design.md`

## Global Constraints

- Keep company hiring data, company timezone, VA skills, rates, availability, and other role-specific data outside Account Settings.
- Do not add a paid or third-party IP geolocation service.
- Persist only coarse city, region, and country metadata; never latitude/longitude.
- Security alerts remain mandatory.
- Preserve the first-login baseline behavior so rollout does not email every existing user as a new device.
- No service-role key in client code.
- RLS is required on every new public table.
- No `user_metadata` authorization.
- Account export must derive the signed-in user server-side and cannot accept a target user ID from the browser.
- Account deletion remains non-destructive; do not call `admin.auth.admin.deleteUser`.
- TOTP remains out of scope.

## Review Focus

1. Missing Vercel geo headers, malformed percent-encoded city names, VPNs, and local development must render `Location unavailable` or coarse fallback text without blocking login.
2. Legacy security events without device/location metadata must still render session cards without crashes or misleading `New device` state.
3. A malicious authenticated user calling Supabase directly must not read/write another user's display preferences or deletion request.
4. Account export must not include another user's profile/security/notification data even if query parameters or request body values are supplied.
5. Mobile widths must keep all five settings sections reachable and session logout/danger-zone actions usable without horizontal page overflow.

---

### Task 1: Add owner-scoped display preferences and deletion-request storage

**Files:**
- Create: `supabase/migrations/20260921190000_account_display_preferences_and_deletion_requests.sql`
- Create: `src/lib/account-display-preferences.ts`
- Modify: `tests/account-settings-next.test.mjs`

**Interfaces:**
- Consumes: authenticated Supabase user ID from existing account route/actions.
- Produces:
  - `type AccountDisplayPreferences = { timezone: string; date_format: "medium" | "short"; time_format: "12h" | "24h" }`
  - `DEFAULT_ACCOUNT_DISPLAY_PREFERENCES`
  - `getAccountDisplayPreferences(userId: string): Promise<AccountDisplayPreferences>`
  - `getPendingAccountDeletionRequest(userId: string): Promise<{ status: "pending"; requested_at: string } | null>`
  - Tables `public.account_display_preferences` and `public.account_deletion_requests`.

- [ ] **Step 1: Write failing storage regression tests**

Extend `tests/account-settings-next.test.mjs` with tests that read the new migration/helper and assert:

```js
assert.match(migration, /create table if not exists public\.account_display_preferences/);
assert.match(migration, /create table if not exists public\.account_deletion_requests/);
assert.match(migration, /alter table public\.account_display_preferences enable row level security/);
assert.match(migration, /alter table public\.account_deletion_requests enable row level security/);
assert.match(migration, /\(select auth\.uid\(\)\) = user_id/);
assert.match(preferences, /DEFAULT_ACCOUNT_DISPLAY_PREFERENCES/);
assert.match(preferences, /getAccountDisplayPreferences/);
assert.match(preferences, /getPendingAccountDeletionRequest/);
```

- [ ] **Step 2: Run the account settings tests and verify RED**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: FAIL because the migration and helper do not exist yet.

- [ ] **Step 3: Add the migration**

Create `public.account_display_preferences`:

```sql
create table if not exists public.account_display_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  date_format text not null default 'medium' check (date_format in ('medium', 'short')),
  time_format text not null default '12h' check (time_format in ('12h', '24h')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Create `public.account_deletion_requests`:

```sql
create table if not exists public.account_deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status = 'pending'),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

For both tables:
- enable RLS
- revoke all from `anon`
- grant `select, insert, update` to `authenticated`
- add owner-only SELECT policy
- add owner-only INSERT policy with `with check ((select auth.uid()) = user_id)`
- add owner-only UPDATE policy with both `using` and `with check`
- do not grant DELETE to authenticated users.

- [ ] **Step 4: Add display preference/deletion readers**

Create `src/lib/account-display-preferences.ts` with safe defaults:

```ts
export type AccountDisplayPreferences = {
  timezone: string;
  date_format: "medium" | "short";
  time_format: "12h" | "24h";
};

export const DEFAULT_ACCOUNT_DISPLAY_PREFERENCES: AccountDisplayPreferences = {
  timezone: "UTC",
  date_format: "medium",
  time_format: "12h",
};
```

Use `createAdminClient()` for server-only reads by explicit `user_id`. Normalize unknown stored values back to defaults.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add account display and deletion request storage`

---

### Task 2: Enrich login security events with device and coarse location metadata

**Files:**
- Create: `src/lib/account-device.ts`
- Modify: `src/lib/account-security.ts`
- Modify: `src/lib/email.ts`
- Modify: `src/app/actions/auth.ts`
- Modify: `src/app/auth/callback/route.ts`
- Modify: `tests/account-settings-next.test.mjs`

**Interfaces:**
- Consumes: Vercel headers `x-vercel-ip-city`, `x-vercel-ip-country-region`, `x-vercel-ip-country`; existing user agent/IP/session id.
- Produces:
  - `parseAccountDevice(userAgent: string | null): { browser: string; os: string; device: string; deviceKey: string }`
  - `AccountApproximateLocation = { city: string | null; region: string | null; country: string | null }`
  - Enriched `AccountSession` fields: `browser`, `os`, `device`, `location`, `recognized`, `signInMethod`.
  - `recordSuccessfulLoginAndMaybeAlert({ userId, email, fullName, signInMethod? })`.

- [ ] **Step 1: Write failing device/location tests**

Extend `tests/account-settings-next.test.mjs` to assert:
- the pure parser recognizes Windows, macOS, iPhone/iOS, iPad/iOS, Android, Linux
- `account-security.ts` reads all three Vercel coarse location headers
- no latitude/longitude header names appear
- login metadata includes `device`, `city`, `region`, `country`, `sign_in_method`
- password auth calls the recorder with `signInMethod: "Email & password"`
- OAuth callback supplies a provider-derived sign-in label
- the existing `loginHistory.length > 0 && !recognized` baseline check remains
- login alert email supports optional device/location text.

Use source-reading assertions plus a pure parser import test where Node can load the module without server-only dependencies.

- [ ] **Step 2: Run the targeted tests and verify RED**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: FAIL because parser/enriched metadata do not exist.

- [ ] **Step 3: Add the pure parser**

Create `src/lib/account-device.ts` with no Next/Supabase dependency.

Required outputs:
- Edge/Chrome/Firefox/Safari/browser fallback
- Windows PC/macOS Mac/iPhone/iPad/Android device/Linux device/Unknown device
- stable slugged `deviceKey` based on browser + OS + device category.

- [ ] **Step 4: Read coarse Vercel location in the security context**

Extend `requestSecurityContext()` to read and safely decode:
- `x-vercel-ip-city`
- `x-vercel-ip-country-region`
- `x-vercel-ip-country`

Use a helper that catches malformed percent-encoding and returns the raw value rather than throwing.

Never read/store:
- `x-vercel-ip-latitude`
- `x-vercel-ip-longitude`.

- [ ] **Step 5: Enrich successful login events and sessions**

In `recordSuccessfulLoginAndMaybeAlert`, store:

```ts
metadata: {
  device_key: device.deviceKey,
  browser: device.browser,
  os: device.os,
  device: device.device,
  city: requestContext.location.city,
  region: requestContext.location.region,
  country: requestContext.location.country,
  sign_in_method: args.signInMethod ?? null,
  recognized,
  baseline: loginHistory.length === 0,
}
```

In `getAccountSecurityState()`, fetch enough recent events to map the latest `login_succeeded` event by `session_id`, then enrich each active session. Missing legacy metadata must resolve to parser/fallback values and null location/recognition rather than error.

- [ ] **Step 6: Pass sign-in method from password and OAuth flows**

Password flow:

```ts
signInMethod: "Email & password"
```

OAuth flow: derive from `user.app_metadata?.provider` and map common values to `Google`, `Microsoft`, or provider title-case.

- [ ] **Step 7: Enrich new-login security email**

Extend `sendNewLoginSecurityEmail` args with optional `device` and `location`. Render them only when present. Preserve critical priority and current idempotency behavior.

- [ ] **Step 8: Run tests and verify GREEN**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: PASS.

- [ ] **Step 9: Commit**

Commit message: `feat: enrich account login security context`

---

### Task 3: Add personal display preference actions and privacy actions/export

**Files:**
- Modify: `src/app/actions/account-security.ts`
- Create: `src/app/workspace/account/export/route.ts`
- Modify: `tests/account-settings-next.test.mjs`

**Interfaces:**
- Consumes: Task 1 tables/helper types.
- Produces:
  - `updateAccountDisplayPreferencesAction(formData: FormData)`
  - `requestAccountDeletionAction(formData: FormData)`
  - GET `/workspace/account/export` JSON download scoped to current user.

- [ ] **Step 1: Write failing action/export tests**

Add assertions that:
- display preference action validates timezone, date format, and time format
- timezone validity uses `Intl.DateTimeFormat(..., { timeZone })` or equivalent server-side IANA validation
- preference upsert includes `user_id: user.id`
- deletion request requires exact confirmation phrase `DELETE MY ACCOUNT`
- deletion request writes only `user.id`
- no `deleteUser` call exists in the deletion-request action/route
- export route calls `supabase.auth.getUser()`
- export queries are scoped with `.eq("id", user.id)` or `.eq("user_id", user.id)`
- export route ignores user-supplied target IDs and returns an attachment.

- [ ] **Step 2: Run targeted tests and verify RED**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: FAIL because actions/export route do not exist.

- [ ] **Step 3: Add display preference action**

Validate:
- timezone is a valid IANA timezone
- date format is `medium | short`
- time format is `12h | 24h`

Upsert using the authenticated Supabase client so RLS participates.

Redirect success/error to `/workspace/account?tab=preferences`.

- [ ] **Step 4: Add deletion-request action**

Require:
- authenticated account role
- exact confirmation text `DELETE MY ACCOUNT`

Upsert:

```ts
{
  user_id: user.id,
  status: "pending",
  requested_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}
```

Do not revoke sessions or delete auth/profile/operational data.

Redirect to `tab=privacy` with a clear pending-request message.

- [ ] **Step 5: Add bounded account export route**

GET route:
- obtain authenticated user with server client
- return 401 if absent
- query only current user's:
  - core profile fields
  - display preferences
  - notification preferences
  - recent security events, capped at 100
- include auth-level email, created_at, last_sign_in_at, and sign-in providers
- return formatted JSON with `Content-Disposition: attachment; filename="virtualassistant-account-data.json"`
- do not accept or inspect a target user ID.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit**

Commit message: `feat: add account preferences and privacy controls`

---

### Task 4: Rebuild the Account Center information architecture and session UX

**Files:**
- Modify: `src/app/workspace/account/page.tsx`
- Modify: `src/components/account-security/session-list.tsx`
- Replace/refactor: `src/app/workspace/account-center.css`
- Modify: `tests/account-settings-next.test.mjs`

**Interfaces:**
- Consumes:
  - `getAccountDisplayPreferences`
  - `getPendingAccountDeletionRequest`
  - enriched `AccountSecurityState.sessions`
  - actions from Task 3.
- Produces:
  - Five settings views keyed by `tab=profile|security|notifications|preferences|privacy`
  - backward-compatible mapping of legacy `tab=account` to Profile
  - compact identity header + desktop side navigation + mobile horizontal selector.

- [ ] **Step 1: Write failing Account Center structure tests**

Add assertions for:
- five navigation labels: Profile, Sign-in & security, Notifications, Preferences, Privacy & account
- legacy `tab=account` maps to Profile
- page no longer contains `account-identity-hero`, `account-tabs`, `account-overview-card`, or `account-security-promo`
- Profile still contains photo/full-name update and secure email change
- workspace role/sign-in methods render as setting rows, not `account-readonly-field`
- Preferences form uses `updateAccountDisplayPreferencesAction`
- Privacy contains Download account data and Request account deletion
- no `deleteUser` text/call appears
- Security contains Where you're logged in, approximate-location explanatory copy, new-login alerts, and recent security activity.

- [ ] **Step 2: Run targeted tests and verify RED**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: FAIL on the old three-tab/card-heavy structure.

- [ ] **Step 3: Refactor the account page into five settings views**

Load in parallel:
- security state
- notification preferences
- display preferences
- pending email change
- pending deletion request.

Keep existing `AppShell`.

Replace the oversized hero with a compact settings header:
- avatar
- name
- email
- verification badge
- role badge
- short Settings description.

Use a two-column settings shell:
- slim navigation
- one focused content surface.

On mobile, navigation is horizontally scrollable with visible focus states.

- [ ] **Step 4: Rebuild Profile**

Use setting rows and separators rather than fake disabled inputs:
- photo + Change photo
- full name
- email + Verified + Change email
- workspace role
- sign-in methods
- lightweight link to role-specific profile/workspace.

Preserve existing email-change pending state and form.

- [ ] **Step 5: Rebuild Security**

Structure:
- Password
- Sign-in methods
- New-login alerts
- Where you're logged in
- Recent security activity.

Update `SessionList` to display:
- browser + device
- approximate city/region/country if present
- Current device / Recognized / New device state only when metadata supports it
- last activity
- signed-in time
- IP
- sign-in method
- logout action.

Add copy that IP location is approximate and can differ with VPN/mobile networks.

Use saved timezone/date/time preferences for session/security timestamps.

- [ ] **Step 6: Rebuild Notifications**

Group rows under:
- Hiring
- Calendar
- Product
- Security

Keep all current checkbox names/actions and locked security alert behavior.

- [ ] **Step 7: Add Preferences view**

Form fields:
- timezone
- date format
- time format

Do not add language or appearance in this release.

Explain that this affects personal account/security timestamps only and does not change company/booking/VA availability timezone.

- [ ] **Step 8: Add Privacy & account view**

Include:
- Download your data button/link to `/workspace/account/export`
- Danger zone
- non-destructive deletion request form requiring typed `DELETE MY ACCOUNT`
- pending-request state when one exists
- explicit copy that the request is reviewed before linked records are removed.

- [ ] **Step 9: Replace card-heavy CSS with settings-shell CSS**

Required behavior:
- max width around 1120px
- compact header
- 210–230px nav on desktop
- focused 720–850px content
- row separators instead of nested bordered cards
- restrained shadows/gradients
- mobile navigation usable at 390px
- no page-level horizontal overflow
- full-width mobile destructive/session buttons where needed
- `:focus-visible` states.

- [ ] **Step 10: Run targeted tests and verify GREEN**

Run: `node --test tests/account-settings-next.test.mjs`

Expected: PASS.

- [ ] **Step 11: Commit**

Commit message: `feat: rebuild Account Center settings experience`

---

### Task 5: Validate production schema, CI, security, and authenticated visual behavior

**Files:**
- Modify only if verification exposes a bug.
- Migration from Task 1 is applied to Supabase production only after its SQL has passed review and branch tests.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: production-ready PR evidence; no merge in this task without explicit final approval.

- [ ] **Step 1: Run complete branch CI**

Run equivalent CI commands:
- `npm test`
- `npm run content:check`
- `npm run cluster:check`
- `npm run archive:check`
- `npm run content:intent-audit`
- `npm run typecheck`
- `npm audit --omit=dev --audit-level=high`
- `npm run build`

Expected: all exit 0.

When executing through GitHub, create/open the PR and use the `CI` workflow result as the authoritative runner evidence.

- [ ] **Step 2: Verify Supabase schema SQL against current docs**

Confirm current RLS/UPDATE policy requirements and run security advisors after applying the migration.

Expected:
- no new missing-RLS or unsafe-policy finding for either new table
- no new exposed security-definer function
- migration appears in production migration history.

- [ ] **Step 3: Apply the migration to production Supabase**

Apply exactly `20260921190000_account_display_preferences_and_deletion_requests.sql` to project `ywkgcyilxhezrfxuwius`.

This is a schema side effect. Stop for confirmation at execution time if the user has not already explicitly authorized implementation against production.

- [ ] **Step 4: Run authenticated dashboard visual QA**

Use the existing `.github/workflows/dashboard-visual.yml` workflow and authenticated account route.

Verify widths:
- 390px
- 768px
- 1440px

Expected:
- all five navigation items reachable
- no horizontal overflow
- Profile rows readable
- Security session cards usable
- Preferences form aligned
- Privacy Danger zone clearly separated.

- [ ] **Step 5: Review PR diff as a whole**

Review specifically for:
- accidental role-specific data duplication
- location precision leakage
- unsafe hard delete
- service-role usage in client code
- session revocation regression
- notification/email-change regression
- mobile overflow
- Vercel header assumptions in local/dev.

- [ ] **Step 6: Fix any Critical/Important finding with RED→GREEN coverage**

Add a reproducing test, observe failure, implement fix, rerun targeted test and full CI.

- [ ] **Step 7: Report merge readiness without merging**

Provide:
- PR link
- exact CI result
- authenticated visual QA result
- Supabase migration/advisor result
- any rulings/deferred minors
- whether a production Vercel preview/deployment is available.

Do not merge until the user explicitly says to merge.
