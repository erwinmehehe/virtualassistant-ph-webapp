# Combined isolated VAPH integration: jobs, training, employer workflow and file security

This is **test-only** staging. It overlays PR #843 secure uploads on PR #898 integration
of #888, #889 and #867. Original source PRs, production `main`, production Supabase,
and production Vercel deployments remain untouched.

## Conflict reconciliation
- `src/app/actions/leads.ts`: preserve consent-based public listing from #888
  while replacing direct untrusted attachment upload with content validation,
  private quarantine, malware scan and release from #843. Scanning occurs before
  job draft creation for a role brief. Scanner failure deletes the pending lead
  and prevents publication.
- `scripts/verify-e2e-db-contracts.sql`: preserve employer RLS/grant assertions
  from #867 and add private quarantine constraints from #843.

The new `tests/upload-job-publishing-integration.test.mjs` checks that both
feature protections remain in the combined source. Existing #843 tests
exercise the upload verifier, rejection cases and download controls.

## Release conditions (not established by this test branch)
1. A real, authenticated HTTPS `MALWARE_SCAN_ENDPOINT` that returns the expected
   clean or infected decision, fails closed on errors, and can be audited.
2. Working VAPH non-production preview with isolated Supabase credentials.
3. Successful database encrypted production backup and isolated restore (#864).
4. Required GitHub main branch protection (#895).
5. End-to-end role, consent, upload, malware reject, and rollback acceptance.

**Do not merge this staging PR into main.** Close it after collecting evidence.
Merge original source PRs in safe order only after release conditions pass.
