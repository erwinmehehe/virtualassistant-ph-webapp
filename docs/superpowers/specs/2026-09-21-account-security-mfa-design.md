# Account Security and TOTP Design

Date: 2026-09-21
Status: Proposed for user review
Repository: erwinmehehe/virtualassistant-ph-webapp

## Goal

Create one shared Account Settings area for every authenticated user and add stronger account security without increasing friction for clients and VAs unnecessarily.

The approved MFA policy is:

- Admin: TOTP required
- Recruiter: TOTP required
- Client: TOTP optional
- VA: TOTP optional
- Once any user enables TOTP, that user's future sessions must complete MFA before the workspace is considered fully authenticated

Leaked-password protection is explicitly out of scope for this work.

## Current state

The app already uses Supabase Auth with email/password plus optional Google and Microsoft OAuth.

Current production findings:

- No verified MFA factors exist yet.
- No active session is currently AAL2.
- Supabase already stores session ID, user ID, IP address, user agent, timestamps, and AAL in auth.sessions.
- The JWT contains session_id, which can be correlated with auth.sessions to identify the current device.
- Normal logout currently uses the default Supabase signOut behavior and should be changed so ordinary logout only signs out the current device.
- auth.audit_log_entries is currently empty, so v1 must not depend on Supabase database audit logs being available.

## Product structure

Add a shared account area:

- /workspace/account
- /workspace/account?tab=account
- /workspace/account?tab=security

The main workspace navigation for Admin, Recruiter, Client, and VA should expose Account Settings.

### Account tab

Show:

- Full name
- Email address
- Current role as read-only
- Password change entry point
- Sign-in methods currently linked where this can be determined reliably
- Link to Security

Role changes remain an admin operation and must not be editable here.

### Security tab

Show four sections.

#### 1. Two-factor authentication

Display status:

- Required for Admin and Recruiter
- Optional for Client and VA
- Enabled or not enabled
- Current session level: AAL1 or AAL2
- Enrolled authenticator factors with friendly names

Actions:

- Set up authenticator app
- Add backup authenticator
- Rename factor if supported cleanly
- Remove factor
- Re-verify when required

Enrollment flow:

1. User clicks Set up authenticator.
2. Call Supabase auth.mfa.enroll with factorType "totp".
3. Show QR code and manual secret.
4. User enters the six-digit code.
5. Create challenge and verify it.
6. After successful verification, refresh the session.
7. Re-read factors and assurance level.
8. Record an application security event.
9. For staff, allow workspace access now that the session is AAL2.

The QR secret must never be stored in the application database.

Supabase does not provide recovery codes. The UI should therefore encourage adding a second backup TOTP factor after primary enrollment. The second factor is recommended but not mandatory in v1.

If a user loses every TOTP factor, recovery is handled by an authorized admin through a separate support workflow using Supabase Admin MFA factor deletion. Deleting a verified factor invalidates the user's active sessions. This recovery action must be logged.

#### 2. Where you're logged in

Read the authenticated user's rows from auth.sessions on the server only.

Never accept an arbitrary user ID from the browser for this query. Resolve the authenticated user server-side and query sessions using that user ID.

For each active session show:

- Current device badge
- Browser and operating-system summary parsed from user_agent
- Raw IP address
- Signed-in time from created_at
- Last active or refreshed time from refreshed_at / updated_at
- MFA status based on session AAL
- Session expiration if not_after is present

Current session detection uses the session_id JWT claim matched to auth.sessions.id.

Do not add precise GPS collection.

Do not add IP geolocation in v1. A later enhancement can add coarse city/country if a reliable privacy-appropriate provider is chosen.

Actions:

- Log out this device for non-current sessions
- Log out other devices
- Log out everywhere
- Ordinary header/menu Log out signs out current device only

For ordinary logout use local scope.

For "Log out other devices" use Supabase sign-out scope for other sessions when available for the current user.

For "Log out everywhere" use global sign out.

When session-specific revocation is not safely supported by the client Auth API, use a server-only authenticated endpoint that deletes only the target session after verifying it belongs to the current user. Never allow cross-user session revocation.

#### 3. Password and sensitive account actions

Password changes continue to use the existing strong password policy.

Sensitive actions require recent higher assurance for users with MFA enabled:

- Disable/remove the final verified TOTP factor
- Change password
- Change email if email change is added later
- Log out all devices
- Staff-only security recovery actions

For Admin and Recruiter, these actions require AAL2.

For Client and VA with TOTP enabled, these actions also require AAL2.

If the current session is only AAL1 but can reach AAL2, redirect to the MFA challenge page and return to the requested action afterward.

#### 4. Recent security activity

Do not rely on auth.audit_log_entries for v1 because it currently contains no rows.

Create public.account_security_events for application-owned security events.

Suggested columns:

- id uuid primary key
- user_id uuid not null
- event_type text not null
- session_id uuid null
- ip inet null
- user_agent text null
- metadata jsonb not null default '{}'
- created_at timestamptz not null default now()

Initial event types:

- login_succeeded
- login_failed
- logout_current
- logout_others
- logout_all
- password_changed
- totp_enrollment_started
- totp_enabled
- totp_factor_removed
- mfa_challenge_succeeded
- mfa_challenge_failed
- admin_mfa_recovery

RLS:

- Users may read only their own security events.
- Browser clients cannot insert arbitrary security events.
- Server-side trusted actions write events.
- Admin support recovery events remain visible to the affected user and authorized staff.

Display the most recent 20 events in Account Security.

Do not show sensitive tokens, TOTP secrets, cookies, reset links, or raw refresh tokens.

## MFA enforcement

### Admin and Recruiter

Staff MFA is mandatory.

Workspace access rules:

1. User completes first-factor login.
2. Resolve role.
3. If role is Admin or Recruiter:
   - no verified TOTP factor: redirect to /workspace/account/security?setup=required
   - verified factor and current AAL is aal1: redirect to /auth/mfa
   - current AAL is aal2: allow workspace access
4. Preserve a safe internal return path.

The check must run server-side in role guards, not only in UI middleware.

Add a dedicated staff security guard that can be reused by requireRole and requireAnyRole without duplicating MFA logic.

Do not immediately add restrictive AAL2 RLS policies to every existing application table in the first release. That would be high blast radius and could break existing server/admin flows. First enforce staff MFA in server-side workspace authorization and sensitive server actions. Database-level AAL2 restrictions can be added later to a small set of high-risk tables once production behavior is proven.

### Client and VA

MFA is optional until enrolled.

If no verified factor exists:

- AAL1 is accepted.
- Security page offers TOTP setup.

If a verified factor exists:

- An AAL1 session must complete MFA before protected workspace access continues.
- This honors the user's choice to enable 2FA.

## Login flow changes

### Email/password login

After signInWithPassword succeeds:

1. Load user and role.
2. Determine current/next AAL with getAuthenticatorAssuranceLevel.
3. Staff without verified TOTP goes to required setup.
4. Any user whose next level is aal2 and current level is aal1 goes to /auth/mfa.
5. Otherwise continue to the requested safe destination.

### OAuth login

Apply the same post-auth MFA decision after exchanging the OAuth code.

OAuth must not bypass staff TOTP.

### Email confirmation and recovery links

Account confirmation should follow the same role/MFA gate after a valid session is established.

Password recovery may enter a limited recovery state. After password update:

- revoke other sessions where appropriate
- record password_changed
- staff must complete TOTP before re-entering the workspace if a verified factor remains

## MFA challenge page

Add /auth/mfa.

Responsibilities:

- Load verified TOTP factors for the authenticated user
- Allow selection if multiple factors exist
- Challenge chosen factor
- Verify six-digit code
- Rate-limit repeated attempts
- On success, refresh session and verify currentLevel is aal2
- Redirect only to a validated internal next path
- Never expose factor secrets after enrollment

If there is no verified factor but the user is staff, redirect to required setup.

## Account navigation

Add Account Settings to each authenticated workspace navigation.

Do not mix this with /workspace/admin/settings.

- Admin settings remains agency/business configuration.
- Account settings is personal identity and security.

The label should be "Account settings".

## Session safety

Current production has many session records, so launch must not mass-revoke users accidentally.

Migration and release must not delete or alter existing auth.sessions.

Changing ordinary logout to local scope should be covered by regression tests.

Session listing must exclude already expired rows where possible, but Supabase may retain expired session rows temporarily. The UI should label only sessions that are still valid based on not_after plus current Auth state.

No session-management endpoint may accept a user_id supplied by the browser.

## Security-event privacy

IP addresses and user agents are personal security data.

Rules:

- visible only to the account owner and authorized internal staff when needed for support
- not exposed in public APIs or analytics
- no GPS or browser geolocation collection
- retention can initially match normal operational retention, with a later cleanup policy if needed

## Error handling and lockout prevention

TOTP enrollment failure:

- keep the account signed in at AAL1
- do not mark factor enabled until Supabase reports verified
- let the user restart enrollment

MFA challenge failure:

- show a generic invalid-code message
- rate-limit retries
- do not reveal factor internals

Staff closes browser during setup:

- next staff workspace request redirects back to required setup

Staff loses authenticator:

- try backup TOTP factor first
- if none is available, use audited admin-assisted factor removal
- factor removal logs the user out of all active sessions
- user signs in again and staff policy requires fresh TOTP enrollment before workspace access

Admin recovery must never allow an admin to reset their own MFA from an AAL1 session.

## Data and code boundaries

Expected additions:

- src/app/workspace/account/page.tsx
- src/app/auth/mfa/page.tsx
- client components for TOTP enrollment/challenge where browser Supabase Auth APIs are required
- src/app/actions/account-security.ts
- src/lib/account-security.ts
- shared MFA enforcement helper in src/lib/auth.ts or a focused sibling module
- migration for account_security_events
- navigation link updates
- tests for all role/MFA/session combinations

Use existing Supabase browser/server client factories instead of creating another auth client abstraction.

Use the service-role/admin client only for operations that genuinely require auth schema or admin MFA access. Never expose it to the browser.

## Testing

### Unit/regression tests

Cover:

- Admin without factor is sent to required setup.
- Recruiter without factor is sent to required setup.
- Staff with factor but AAL1 is sent to challenge.
- Staff AAL2 reaches workspace.
- Client without factor can use AAL1.
- VA without factor can use AAL1.
- Client/VA with verified factor and AAL1 are challenged.
- OAuth cannot bypass MFA.
- Safe next-path validation prevents open redirects.
- Ordinary logout uses local scope.
- Logout-other and logout-all use intended scope.
- Session queries derive user ID server-side.
- Cross-user session revocation is rejected.
- TOTP removal requires AAL2 when appropriate.
- Password change requires AAL2 for staff.
- Security events never expose secrets.
- Account Settings appears in all authenticated role navigation.
- Admin Agency Settings remains separate.

### Integration tests

Use Supabase test users to verify:

- TOTP enroll -> challenge -> verify -> AAL2
- multiple TOTP factors
- factor removal
- current session identification through JWT session_id
- session list contains user agent and IP
- current-device logout does not revoke unrelated sessions
- global logout revokes all sessions

### Production smoke

After deploy:

- Admin login cannot enter workspace at AAL1.
- Recruiter login cannot enter workspace at AAL1.
- Client and VA login remain friction-free when MFA is not enrolled.
- Account Settings loads for every role.
- Security page shows current session correctly.
- No existing user is mass logged out by deployment.
- TOTP secret never appears in logs.

## Rollout

Phase 1:
- Account Settings shell
- Security tab
- session/device view
- local/other/global logout behavior
- security-event table

Phase 2:
- TOTP enrollment and challenge
- optional flow for Client/VA
- mandatory Staff gate
- sensitive-action AAL2 requirements

Phase 3:
- support/admin MFA recovery workflow
- backup-factor UX
- additional security notifications if useful

The staff enforcement flag should be easy to disable quickly if a production auth regression is discovered, but default to enabled after smoke tests pass.

## Explicit non-goals

Not included in this work:

- leaked-password protection
- SMS MFA
- passkeys/WebAuthn
- precise device geolocation
- GPS collection
- global AAL2 RLS on every database table
- organization-wide Supabase dashboard MFA enforcement
- custom recovery codes

## Success criteria

The work is complete when:

1. Every user has a shared Account Settings area.
2. Admin and Recruiter cannot use protected workspaces without verified TOTP and AAL2.
3. Client and VA can optionally enable TOTP, and enabled accounts cannot bypass it.
4. Users can see where their account is logged in with browser/device, IP, and activity timestamps.
5. Users can safely revoke sessions with clear current/other/all controls.
6. Normal logout affects only the current device.
7. Sensitive staff account actions require AAL2.
8. Security events are visible without exposing secrets.
9. Existing client/VA conversion and login flows do not gain mandatory MFA friction.
10. CI and authenticated production smoke tests cover the new security rules.
