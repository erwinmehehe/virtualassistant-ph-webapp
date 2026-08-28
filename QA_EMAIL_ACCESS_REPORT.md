# QA Report - VA Email Access and Candidate Privacy

## Scope
Reviewed recruiter candidate review, client candidate access, client candidate lists, comparison, messaging, public VA profiles, resume access, and server actions related to candidate contact/privacy.

## Required behavior
- Recruiters can see a VA's account email while reviewing a candidate.
- Clients cannot see a VA's email or private candidate identity/details before candidate access is paid or comped.
- Once candidate access is active, the client can see the VA email on the candidate review page.

## Changes made
1. Recruiter candidate review now shows the VA account email in a dedicated contact card with a `mailto:` link.
2. Client candidate review fetches the VA auth email only after `candidateAccessUnlocked(...)` succeeds. Locked requests return before any VA email lookup.
3. Client Messages now filters conversations by paid/comped candidate access before fetching private application snapshots, names, unread messages, or message content.
4. `sendMessageAction` now enforces paid/comped candidate access server-side for clients, preventing a crafted request from bypassing the UI.
5. Added small responsive-safe styling for long email addresses using `overflow-wrap: anywhere`.

## Privacy/access QA
- Public `/va/[slug]` profile: no email exposed; page explicitly states contact details are private.
- Client candidate list/dashboard: private snapshot data is loaded/rendered only for unlocked roles.
- Client candidate detail: locked branch exposes only fit/status summaries; email lookup occurs only after unlock.
- Client compare: excludes locked applications before loading full application records.
- Private resume API: clients require paid/comped candidate access; recruiters/admin are allowed.
- Recruiter private resume API: limited to recruiter/admin roles.
- Client messaging: privacy bypass found and fixed. Locked clients no longer receive candidate names/message content in the Messages UI and cannot send via the server action.
- Workroom identity: shown only after a confirmed hire; hire action itself requires active candidate access.

## View/design QA
- Contact email is placed in the sticky profile sidebar, near working-fit/actions where users expect contact information.
- Long addresses wrap instead of overflowing narrow/mobile layouts.
- Existing card, spacing, typography, icon, and muted-helper-text patterns are reused for visual consistency.
- Locked client views retain the existing access-gate hierarchy and do not tease/show partial contact information.

## Validation
- `npm run typecheck`: PASS.
- `npm run build`: could not complete in the sandbox because Next.js attempted to download `@next/swc-linux-x64-gnu` from npm and outbound registry access is unavailable (`EAI_AGAIN`). The failure occurred before application compilation and is environment/network related.

## Recommended live smoke tests after deployment
1. Recruiter -> open a VA in Recruiter Queue -> verify email appears and `mailto:` opens correctly.
2. Unpaid client -> direct-open candidate URL -> verify no name/email/private profile is present.
3. Unpaid client -> Messages -> verify locked candidate threads do not appear.
4. Unpaid client -> attempt direct message action -> verify request is rejected with candidate-access-required error.
5. Mark role candidate access as `paid` -> client candidate review -> verify full profile + email + messaging are available.
6. Mark role candidate access as `comped` -> repeat step 5.
7. Public VA profile in logged-out browser -> inspect page and page source -> verify no email/contact details.
