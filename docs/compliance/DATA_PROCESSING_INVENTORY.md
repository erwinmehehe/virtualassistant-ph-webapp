# Personal Data Processing Inventory

Baseline date: 2026-09-25  
Purpose: Engineering/DPO working register. The DPO should maintain the authoritative signed record.

| Processing activity | Data subjects | Main data | Purpose | Main systems/processors | Public? | Retention trigger |
| --- | --- | --- | --- | --- | --- | --- |
| Account/authentication | VA, client, staff | name, email, auth/session/security events | account access and security | Supabase Auth, Vercel | No | account/security/legal schedule |
| VA professional profile | VA | bio, skills, tools, experience, rate, availability, schedule | vetting, matching, hiring | Supabase, Vercel | Optional consent-gated subset | account + hiring need |
| Public VA directory | opted-in approved VA | masked name, photo, professional fields | client discovery | Supabase, Vercel | Yes after separate consent | until consent withdrawn/ineligible |
| Talent semantic search | opted-in approved VA | sanitized professional search text + derived embedding | relevance search / decision support | Supabase, configured embedding provider | Embedding: No | while profile remains eligible/relevant |
| Candidate matching | VA, client | role requirements + professional fit attributes + score/confidence | shortlist decision support | Supabase, Vercel | No | recruitment/audit schedule |
| Resume storage/parsing | VA | private resume file/text during bounded parsing | profile completion/recruiter review | Supabase Storage, Vercel | No | current resume + approved schedule |
| Vetting/assessments | VA | tests, video link, scorecards, notes | candidate quality control | Supabase, Vercel | No; selected credential signals may be public | recruitment/audit schedule |
| Training | VA | enrollments, engagement, assessments, certificates | learning and credentials | Supabase, Vercel | credential only when product permits | training/account schedule |
| Hiring leads | prospects/clients | name, email, company, brief, schedule, budget/message | recruiting/sales follow-up | Supabase, Resend, Google Calendar | No | sales/hiring schedule |
| Applications/shortlists | VA, client, staff | application, cover note, sanitized snapshot, decisions | hiring workflow | Supabase, Vercel, email | No | hiring/dispute schedule |
| Interviews/scheduling | VA, client | names/emails, time, meeting metadata | interview/discovery scheduling | Google Calendar/Meet, Supabase, Resend | No | hiring/calendar schedule |
| Workrooms/time | VA, client | placement, approved time, delivery state | delivery/invoicing | Supabase, Vercel | No | contract/accounting schedule |
| Payments | VA, client | invoice, USD ledger amount, PHP charge/FX, provider IDs, refund/dispute/chargeback state | collect/reconcile/pay | PayMongo, Supabase | No | accounting/tax/dispute schedule |
| Product analytics | visitors/users | event, path, session/user ID where available, limited metadata | product performance | Supabase, configured analytics | No | analytics schedule |
| Support/privacy requests | users/visitors | contact details, request content | support and rights handling | Supabase, Resend | No | request/legal schedule |
| Security/moderation | account users | access/security/moderation/audit events | abuse prevention and incident response | Supabase, Vercel/GitHub logs | No | security/legal schedule |

## Engineering rules

1. A new personal-data field must map to an existing processing activity above or add a new activity.
2. Do not add private data to `public_va_directory` without privacy review and an explicit consent-scope decision.
3. Do not add fields to semantic embeddings unless the DPIA is updated first.
4. Do not use match/search scores as an autonomous rejection, hiring, compensation or public-listing decision.
5. Payment provider state must reconcile through locked financial workflows and immutable event history.
6. Private resumes must not be copied back into application snapshots.
7. DPO/controller identity, official privacy contact, processor locations/contracts, statutory retention periods, breach records and NPCRS filing evidence belong in the authoritative compliance register.
