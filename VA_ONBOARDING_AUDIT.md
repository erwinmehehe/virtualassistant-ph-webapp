# VA onboarding audit snapshot

Base repository main SHA: `c956999c5e6a0fbe4db1a4a58dd85a0ae99748b0`
Audit date: 2026-09-12 (PH time)

Read-only production checks showed:

- 262 VA accounts total.
- 0 accounts are missing a `va_profiles` row.
- 0 accounts are missing a `va_vetting` row.
- 152 VA profiles are at 0% completion.
- 135 of those 0% accounts were created in the last 30 days.
- 60 of those 0% accounts were created in the last 7 days.
- 112 of the 152 zero-completion accounts have confirmed their Auth email.
- 96 of the 152 zero-completion accounts have signed in at least once.
- 182 VA accounts have no primary category selected.
- Existing categorized talent is concentrated in Administrative Support, Customer Service, and Marketing & Social Media.

Interpretation: account creation is generally succeeding. The larger problem is post-signup onboarding drop-off. Many people confirm and even sign in, but the current first experience sends them into a large profile/dashboard flow without a short guided first step.

Changes in this branch:

- Send new VA signups and VA social signups to a two-minute quick setup.
- Allow Google/Microsoft signup for VAs when social auth is configured.
- Use the canonical site origin for email signup callbacks instead of a localhost fallback.
- Repair role-specific profile rows during bootstrap if an account is incomplete.
- Add a quick setup action for specialty, headline, experience, availability, and preferred rate.
- Add recruiter `VA categories` dashboard navigation with SMM / Social Media, SEO VA, Executive VA, Customer Support, and other friendly labels.
- Add a recruiter onboarding-health page showing new accounts, 0% profiles, verified-but-0% accounts, uncategorized VAs, and recent stalled accounts.
- Add contract tests for the onboarding and category behavior.

No production database rows were changed by this audit. The branch is intended for review before any production deployment.
