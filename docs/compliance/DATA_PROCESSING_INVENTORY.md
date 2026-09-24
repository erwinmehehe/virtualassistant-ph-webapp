# Personal data processing inventory

Baseline date: 2026-09-24  
Purpose: engineering/DPO working register. The DPO should maintain the authoritative signed record.

| Processing activity | Data subjects | Main data | Purpose | Primary systems/processors | Public? | Retention trigger |
| --- | --- | --- | --- | --- | --- | --- |
| Account/authentication | VA, client, staff | name, email, auth/session/security events | account access and security | Supabase Auth, Vercel | No | account/security/legal schedule |
| VA professional profile | VA | professional bio, skills, tools, experience, rate, availability, schedule | vetting, matching, hiring | Supabase, Vercel | Optional/consent-gated subset | account + hiring need |
| Public VA directory | opted-in approved VA | masked name, image, professional profile fields | client discovery | Supabase, Vercel | Yes, only after separate consent | until consent withdrawn/ineligible |
| Talent semantic search | opted-in approved VA | sanitized professional search text + derived embedding | relevance search / recruiter decision support | Supabase database + Supabase Edge inference | Embedding: No | while profile remains relevant; delete/update on queue |
| Candidate matching | VA, client | role requirements + professional fit attributes + match score/confidence | shortlist decision support | Supabase, Vercel | No | recruitment/audit schedule |
| Resume storage and parsing | VA | private resume file/text during parsing | profile completion and recruiter review | Supabase Storage, Vercel request processing | No | current resume + approved retention schedule |
| Vetting/assessments | VA | test results, video URL, scorecards, notes | candidate quality controls | Supabase, Vercel | No; selected verified signals may be public | recruitment/audit schedule |
| Training | VA | enrollment, lesson engagement, assessments, certificates | learner progress and credentials | Supabase, Vercel | certificate/credential only when product permits | training/account schedule |
| Hiring leads | prospective/client users | name, email, company, role need, schedule, budget/message | recruiting/sales follow-up | Supabase, Resend, Google Calendar | No | sales/hiring retention schedule |
| Applications/shortlists | VA, client, recruiters | application, cover note, profile snapshot excluding private resume path, decisions | hiring workflow | Supabase, Vercel, email | No | hiring/dispute schedule |
| Interviews/scheduling | VA, client | names/emails as needed for calendar, time, meeting metadata | interview/discovery scheduling | Google Calendar/Meet, Supabase, Resend | No | hiring/calendar retention schedule |
| Workrooms/time | VA, client | placement, approved time, work state | delivery/invoicing | Supabase, Vercel | No | contract/accounting schedule |
| Payments | VA, client | invoice, amount, FX quote, provider IDs, refund/dispute state | collect/reconcile/pay | PayMongo, Supabase | No | accounting/tax/dispute requirement |
| Product analytics | visitors/users | event, path, session/user ID where available, limited metadata | product performance | Supabase, configured analytics | No | analytics schedule |
| Support/privacy requests | users/visitors | contact details, request content | support and DPA rights | Supabase, Resend | No | request/legal schedule |
| Security/moderation | all account users | access/security/moderation/audit events | abuse prevention, incident response | Supabase, Vercel/GitHub logs | No | security/legal schedule |

## Engineering rules

1. A new personal-data field must be mapped to a processing activity above or add a new activity.
2. Do not add private data to `public_va_directory` without privacy review and a consent-scope decision.
3. Do not add fields to semantic embeddings unless the DPIA is updated first.
4. Do not use match/search scores as an autonomous rejection or hiring decision.
5. Payment provider state must be reconciled through the audited payment state machine.
6. Private resumes must not be copied back into application snapshots.
7. DPO/controller identity, official privacy contact, contracts, processor locations and statutory retention periods belong in the authoritative compliance register and must be kept current outside source code as well.
