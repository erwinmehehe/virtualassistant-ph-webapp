# DPIA: Talent Matching, Search and Recruitment Decision Support

Date: 2026-09-24  
System: virtualassistant.com.ph  
Status: technical DPIA baseline; DPO approval/sign-off required.

## 1. Processing objective

Help clients and recruiters find relevant Filipino Virtual Assistants without exposing private candidate records or making an autonomous hiring decision.

The current design uses two complementary mechanisms:
1. deterministic structured matching in `src/lib/matching.ts`; and
2. hybrid public talent search using PostgreSQL full-text ranking plus an optional semantic embedding of the **sanitized public professional profile**.

## 2. Data flow

### Structured matching

Client role requirements:
- categories;
- required/must-have skills;
- tools;
- industries;
- minimum experience;
- hours;
- timezone overlap;
- maximum rate;
- communication requirements/dealbreakers.

VA professional data:
- specialties;
- skills/tools/industries;
- experience;
- weekly availability;
- overlap hours;
- rate;
- availability state.

Processing:
- hard requirements are checked;
- a deterministic weighted score/confidence is calculated;
- eligible results become recruiter-only suggestions;
- recruiters decide whether anyone is released to the client.

### Semantic public search

Only rows already eligible for `public_va_directory` are eligible for the semantic index.

Embedding source:
- headline;
- bio;
- primary/additional specialties;
- skills;
- tools;
- industries;
- languages;
- general schedule;
- preferred timezone.

The embedding is stored in `private.va_search_embeddings` and is never exposed through the public API. The public search RPC can return only the sanitized directory fields.

## 3. Necessity and proportionality

Purpose:
- reduce false negatives from exact keyword/tag matching;
- let clients express role needs in natural language;
- improve recruiter discovery of approved, consented VAs.

Less intrusive alternatives considered:
- keyword search only: lower privacy impact but materially weaker for synonyms/context;
- embedding full resumes: rejected because it would process private contact/address/history data unnecessarily;
- embedding private recruiter notes or assessments: rejected;
- autonomous candidate selection: rejected.

Chosen approach:
- embed only sanitized professional search text;
- keep embeddings private;
- retain human decision-makers.

## 4. Privacy risks and controls

### Risk: public-profile data is used beyond the VA's reasonable expectation

Controls:
- separate public-profile consent;
- semantic search is disclosed in the Privacy Notice;
- embedding input is limited to the public-professional field set;
- withdrawal removes the VA from the searchable public source immediately;
- stale private embeddings cannot make a withdrawn profile searchable because the search RPC always starts from the live consent-gated public directory.

### Risk: embedding inversion or unintended disclosure

Controls:
- embeddings are in the private schema;
- no direct anon/authenticated grants;
- public search returns no embedding vector;
- only service-role-only RPCs can upsert/delete embeddings;
- no email, phone, resume, identity, payment or private notes are embedded.

### Risk: discriminatory or unfair ranking

Controls:
- score inputs are job-relevance factors, not protected-class attributes;
- human recruiter review remains mandatory before client presentation;
- semantic similarity supplements rather than replaces deterministic evidence;
- match confidence/evidence gaps remain visible to staff;
- no automatic rejection is caused by a low semantic score.

Open control:
- periodically test result quality across specialties and schedule patterns for systematic under-ranking;
- record material ranking-model changes.

### Risk: stale availability or profile information

Controls:
- availability confirmation exists separately;
- profile/vetting changes enqueue semantic re-indexing;
- deterministic matching records evidence gaps for stale/unknown availability;
- recruiters confirm current fit before presentation.

### Risk: function/provider outage changes outcomes

Controls:
- query embedding failure falls back to database full-text search;
- indexing is queued and retryable;
- profiles without an embedding remain searchable lexically.

### Risk: profiling becomes autonomous decision-making

Control:
- architecture explicitly prohibits automatic client release/hiring/rejection;
- any future sole-basis automated decision requires a new DPIA and legal review before release.

## 5. Security controls

- Supabase RLS/source-boundary hardening;
- private embedding storage;
- service-role-only mutation RPCs;
- sanitized public search RPC;
- no raw auth UUID is required in the new public search result;
- CI, CodeQL, dependency audit and tests;
- audit/activity events for recruiter matching workflow.

## 6. Processors / systems

Current categories include:
- Vercel: application hosting/compute;
- Supabase: database/auth/storage/Edge processing;
- Resend: transactional email;
- Google Calendar/Meet: scheduling/meetings;
- PayMongo: payment collection/refunds/disputes;
- analytics providers configured by the platform;
- configured AI/embedding processing for specific features.

DPO must maintain the authoritative processor register, contracts, processing locations and transfer safeguards outside this code file.

## 7. Data retention

Semantic embeddings:
- live only for profiles that may need matching/search;
- source changes queue replacement;
- non-public/ineligible profiles are deleted from the embedding table when their queued job is processed;
- source profile deletion cascades embedding deletion.

Matching/audit records:
- retain according to the approved recruitment, dispute, security and legal retention schedule.

## 8. Data subject rights

Supported mechanisms:
- VA can edit professional profile;
- VA can withdraw public-profile consent;
- contact form includes **Privacy or data request**;
- account deletion/privacy workflows can be assessed against lawful retention requirements.

## 9. Residual risk

Residual risk is acceptable for decision-support use if:
- the DPO completes the required DPS registration;
- processors/transfers are documented;
- meaningful human review is preserved;
- semantic inputs remain limited to sanitized professional fields;
- monitoring confirms no material discriminatory or misleading ranking behavior.

DPO decision/sign-off: **Pending external operational sign-off.**
