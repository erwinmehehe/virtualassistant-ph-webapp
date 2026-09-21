# Account Center Complete Settings Redesign

Date: 2026-09-21

## Goal

Replace the current card-heavy Account Settings screen with a mature SaaS Account Center that is compact, easier to navigate, and functionally complete for personal account management.

The Account Center must remain separate from role-specific workspace data. Company hiring data, company timezone, VA skills, rates, availability, and other professional/workspace information stay in their existing profile/workspace screens.

## Information architecture

The Account Center will use a persistent settings navigation with five sections:

1. Profile
2. Sign-in & security
3. Notifications
4. Preferences
5. Privacy & account

Desktop uses a slim left settings navigation beside a focused settings content column. Mobile converts the navigation into a compact horizontally scrollable selector or equivalent mobile-safe control.

The current oversized identity hero, detached three-tab pill bar, redundant Account Security promo card, and large At-a-glance sidebar are removed.

A compact identity header remains at the top with avatar, name, email, verification state, and workspace role.

## Profile

Profile focuses only on personal account identity.

### Editable
- Profile photo
- Full name

### Read-only / managed
- Verified email address with a dedicated Change email action
- Workspace role
- Sign-in methods

Read-only values must not look like disabled text inputs.

The existing verified email-change flow remains intact and is presented as a concise email row with status, pending verification state, and Change email action.

Role-specific profile links remain available as a lightweight contextual link, not a large card.

## Sign-in & security

Security becomes a first-class account security center.

### Password
- Current password-change entry point
- Clear supporting copy

### Sign-in methods
- Current connected sign-in providers
- No fake editable fields

### Where you're logged in

Each active session card should show as much reliable information as available:
- Human-readable device category, for example Windows PC, Mac, iPhone, iPad, Android device
- Browser
- Approximate IP-derived location: city, region, country
- Current device badge
- Recognized/new-device state when known
- Last activity
- Original sign-in time
- IP address as secondary information
- Sign-in method when recorded
- Individual Log out action for non-current sessions

Global actions remain:
- Log out other devices
- Log out everywhere

### Location source and privacy

Use Vercel request geolocation headers already available at request time. Do not add a paid or third-party IP geolocation service.

Store only coarse account-security location metadata needed for audit/session display:
- city
- region
- country

Do not store or display precise latitude/longitude.

Location is labeled as approximate because VPNs, mobile carriers, and corporate networks may change IP geolocation accuracy.

### Login event enrichment

Successful login security events will be enriched with:
- browser
- operating system
- device category
- device key
- city
- region
- country
- sign-in method where known
- recognized/baseline state

Existing historical sessions that do not have enriched metadata continue to render gracefully with the information already available.

### New-login alert

The existing new-login alert remains mandatory.

Future alert emails use the same coarse device/location metadata where available:
- browser + OS/device
- city/region/country
- IP
- sign-in time

The current rollout behavior remains: a user's first recorded successful login establishes a baseline and does not generate a false new-device alert.

### Recent security activity

Keep the existing audit trail, but show:
- action
- date/time
- device/browser
- approximate location when available
- IP as secondary information

## Notifications

Keep the existing preference categories and mandatory security-alert behavior.

Group the current controls into clearer sections:
- Hiring: recruiter/hiring updates, candidate activity
- Calendar: booking reminders
- Product: product emails
- Security: mandatory security alerts

Each preference explains the email class it controls.

Security alerts remain always enabled in both UI and database enforcement.

## Preferences

Add personal display preferences that affect the Account Center and application presentation, without duplicating company or VA business settings.

Initial preferences:
- Personal timezone for display of account/security timestamps
- Language: English initially
- Date format
- Time format: 12-hour / 24-hour
- Appearance: System / Light / Dark only if the application shell supports a safe persisted theme without introducing a second incompatible theming system

Timezone here is a personal display preference only. It does not replace company timezone, booking timezone rules, or role-specific availability settings.

### Storage

Create a dedicated per-user account preference record rather than adding unrelated presentation fields to notification preferences.

Expected persisted fields:
- user_id
- timezone
- language
- date_format
- time_format
- appearance if supported
- created_at
- updated_at

RLS must limit read/write access to the authenticated owner only.

## Privacy & account

This section must avoid destructive shortcuts.

### Data export
Provide an account data export/request action only if it can produce a bounded user-owned export without leaking records belonging to other users or agency-wide operational data.

### Account deactivation
A deactivation flow may be implemented as a reversible account-status change only after confirming the existing authorization layer respects that status on login/workspace access.

### Permanent deletion
Do not implement a blind Supabase Auth delete button.

Before permanent deletion is enabled, audit:
- foreign keys and cascades
- hiring requests
- applications
- placements
- interviews
- billing/invoice records
- agency audit records
- legal/operational retention needs
- sole-owner/admin constraints

For this Account Center release, the Privacy section may present a clearly separated Danger zone and a safe request/deactivation action, but permanent destructive deletion must remain gated until the dependency audit proves it safe.

## Visual system

Use a restrained premium SaaS settings layout.

Principles:
- compact identity header
- slim settings navigation
- focused 720–850px settings content
- fewer nested cards
- 1px separators for setting rows
- typography and spacing for hierarchy instead of borders everywhere
- minimal gradients inside settings content
- badges only for meaningful state
- no fake disabled form inputs
- danger actions visually isolated
- mobile-first responsive behavior
- keyboard-visible focus states
- semantic headings, forms, labels, and status text

Reuse existing site tokens/components where practical rather than introducing another independent visual system.

## Data flow

1. Account page loads authenticated profile, notification preferences, display preferences, sessions, and security events in parallel.
2. Login flows record enriched security metadata from request headers.
3. Session rendering joins current auth-session data with the most recent matching successful-login event metadata by session_id when available.
4. Display formatting uses the user's saved timezone/date/time preferences.
5. Notification actions continue to upsert current notification preference storage.
6. New account-display preference actions upsert only the authenticated user's preference record.

## Error handling

- Missing geolocation metadata renders as "Location unavailable" rather than failing the page.
- Missing/legacy user agents render generic browser/device labels.
- Preference reads fall back to safe defaults.
- Preference writes redirect with user-visible success/error state.
- Security event persistence/email failures never block a valid login.
- Session revocation behavior remains unchanged.
- Existing email verification behavior remains unchanged.

## Security requirements

- No service-role key in client code.
- RLS on any new public preference table.
- Owner-only SELECT/INSERT/UPDATE policies with both USING and WITH CHECK where appropriate.
- No precise location persistence.
- No user_metadata-based authorization.
- No direct destructive account deletion without the dependency audit.
- TOTP remains out of scope for this release.

## Testing

Add/extend regression tests for:
- five-section Account Center navigation
- removal of redundant hero/sidebar scaffolding
- read-only values no longer rendered as fake disabled inputs
- verified email flow remains intact
- notification preference grouping and mandatory security alerts
- account display preference defaults and owner-only persistence
- Vercel coarse geolocation capture
- device category parsing
- session/event enrichment with graceful legacy fallback
- new-login baseline behavior unchanged
- new-login email uses location only when available
- responsive navigation/classes
- privacy Danger zone does not expose unsafe hard-delete behavior

Run:
- release safety tests
- account settings regression tests
- type-check
- build
- security audit
- authenticated visual QA at mobile, tablet, and desktop widths

## Acceptance criteria

The release is acceptable when:
- Account Settings no longer looks like a dashboard skeleton.
- All five settings areas have a clear purpose and real content.
- Profile is compact and does not duplicate role-specific workspace data.
- Security clearly identifies sessions using device/browser/location/time information when available.
- Approximate location is coarse and privacy-safe.
- Personal timestamp/display preferences persist.
- Existing verified email, session revocation, notification, and login-alert behavior do not regress.
- Mobile navigation and session controls remain fully usable.
- No unsafe permanent account deletion path is introduced.
- CI, build, security checks, and authenticated visual QA pass.
