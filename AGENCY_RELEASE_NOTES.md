# Agency lead workflow and shortlist visibility

The owner workspace now prioritizes employer relationships: enquiries, follow-ups, hiring briefs, quotes and active placements. Leads have independent sales stages, a next follow-up date and private notes. Intake conversion status is preserved.

Client overviews and candidate pages now include released recruiter shortlists before applications arrive. Candidates already represented by an application are not counted twice. Private identity and resume access continue to use the existing role-level access gates.

The original public design, homepage H1 (Virtual Assistant Philippines), hire-page heading, navigation, colors and sharing-image design are preserved. New lead workflow layouts use the existing theme. Nonvisual SEO improvements retain sharing metadata and robots URL normalization. Existing service, industry and blog URLs are preserved.

## Deployment order

1. Apply `supabase/migrations/20260908173823_agency_lead_pipeline.sql` to the target database before deploying the application. It adds three columns and an index without deleting or changing existing lead content. Existing leads start at the New enquiry sales stage; conversion status remains unchanged.
2. Deploy this branch using the existing production environment variables. No new environment variables are required. Never copy the local synthetic QA environment into deployment.
3. Verify an admin can save a stage, follow-up date and note; verify client shortlist visibility and existing access gates with staging accounts before production release.

The migration can be applied repeatedly. For an application rollback, revert the application commit and retain the additive database columns so saved sales notes are preserved.

## Validation

- TypeScript check and production build.
- Five regression tests: `node --test scripts/test-agency-pipeline.mjs` (Node 24; TypeScript stripping required).
- Existing content gate: 170 blog posts; zero failures or warnings.
- Existing service SEO gate: 74 pages; passed.
- Local PostgreSQL-compatible migration verification: defaults, repeat application, saved values, constraints and index.
- Browser checks with a synthetic local API: desktop/mobile layout, saved lead stage/notes, shortlist-only client state, navigation to role shortlist and locked identity state.

No live database migration or production deployment is included. Local test data is not evidence that the production database is configured or migrated. Existing build warnings about legacy CSS alignment and workspace-root discovery remain outside this change.
