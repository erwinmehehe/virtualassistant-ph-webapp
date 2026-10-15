# VAPH focused release candidate: training, opt-in jobs, accessible forms

Release candidate date: 2026-10-15. **No production merge is authorized by the existence of this branch.**

## Exact source snapshots
- Production base before release: `e57db9540a381ed3f6e585d71f8800a97518d568`.
- Training improvements PR #889: `d892a7122aec54b1f55606c789dff7a35b2fa9b1`.
- Opt-in job publishing PR #888: `8230b2e88efc5d1e281cc83329146a17fa8e544d`.
- Combined #889+#888 staging base: `9f96ab6d51bdcc7cc850a67d89edf8a989c21050`.
- Accessibility PR #896: `6d469f461d27b190b3d28a0fbe674aef2b3f93e8` (5 disjoint files).

This focused candidate contains **only** those three changes, unlike broad integration PRs #893/#897/#898/#899.
There are no added schema migration files.

## Changes
- Training: course starts, completion/activation reporting, public training discovery.
- Jobs: explicit public listing opt-in, publication eligibility and content validation; incomplete or ineligible requests stay private.
- Accessibility: labeled VA and company form fields and named admin/recruiter select controls.

## Evidence before merge
- [ ] CI verify (Node tests, lint, build, typecheck)
- [ ] CodeQL
- [ ] Fresh local Supabase browser/database contract suite
- [ ] Test consent OFF -> stays private; consent ON with complete acceptable brief -> publishes, otherwise private
- [ ] Training continuation and reporting verified for actual sample learner journeys on non-production data
- [ ] Desktop and mobile labels verified by keyboard and screen reader
- [ ] Vercel **preview** build of this exact candidate, with non-production credentials and protected access
- [ ] Backup workflow produced encrypted artifact and a successful isolated restore (#864)
- [ ] Required checks + reviews enforced on main (#895)
- [ ] Named rollback owner and the production deployment revision recorded

## Merge sequence (source PRs, **not** this integration PR)
1. Rebase/retest #896 and merge its accessibility-only fix.
2. Rebase/retest #889 and merge training improvements.
3. Rebase/retest #888 and merge publication improvements only after consent behavior acceptance.
4. After each merge, verify deployed revision, error rate and core authenticated journeys. Revert source commit if defective; restore data only from a **verified** backup.
5. Close this candidate after the separate source PR releases. Do not merge this candidate itself.

## Hard stop
The live database recovery workflow failed to start due to missing `SUPABASE_DB_URL` (also requires `BACKUP_ENCRYPTION_PASSPHRASE`).
`main` is currently unprotected. Without independent evidence resolving both, **do not merge production changes**.
