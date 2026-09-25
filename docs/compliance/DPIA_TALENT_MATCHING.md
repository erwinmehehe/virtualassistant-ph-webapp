# DPIA: Talent Matching, Search and Recruitment Decision Support

Date: 2026-09-25  
System: virtualassistant.com.ph  
Status: Technical DPIA baseline. DPO approval/sign-off and NPCRS operational filing remain required.

## 1. Processing objective

Help clients and recruiters find relevant Filipino Virtual Assistants without exposing private candidate records or making an autonomous hiring decision.

The system uses two complementary mechanisms:

1. deterministic structured matching in `src/lib/matching.ts`; and
2. hybrid public talent search using PostgreSQL full-text ranking plus semantic embeddings of the **sanitized public professional profile**.

## 2. Data flow

### Structured matching

Client role inputs can include categories, required/must-have skills, tools, industries, minimum experience, hours, timezone overlap, maximum rate, communication requirements, and dealbreakers.

VA professional inputs can include specialties, skills, tools, industries, experience, weekly availability, overlap hours, rate, and availability state.

The matcher checks hard requirements, calculates an internal score/confidence, and produces recruiter decision support. It does not automatically hire, reject, release a candidate to a client, or determine compensation.

### Semantic public search

Only VAs already eligible for the consent-gated `public_va_directory` are eligible for semantic indexing.

Embedding source is limited to professional discovery fields such as headline, bio, specialties, skills, tools, industries, languages, general schedule, and preferred timezone.

Excluded from semantic embeddings:

- email and phone;
- home address;
- resume file or resume text;
- identity documents;
- assessment answers;
- recruiter/admin notes;
- private applications/messages;
- payment data.

Embeddings are held in the private database schema and are not returned to public clients.

## 3. Profiling classification

The platform automatically evaluates professional attributes to estimate candidate relevance. For privacy-compliance purposes this is **profiling**.

The system is not configured as sole-basis automated decision-making:

- recruiter review remains required before candidate presentation;
- client users make the hiring decision;
- vetting approval/rejection remains human-controlled;
- payment release/refund/dispute decisions remain controlled by authenticated human workflows and provider state.

Removing meaningful human review is a material compliance change and requires a new DPIA/legal review before release.

## 4. Necessity and proportionality

Purpose:

- reduce false negatives caused by exact-keyword search;
- support natural-language discovery of consented public profiles;
- help recruiters find relevant approved candidates faster.

Less intrusive alternatives considered:

- keyword-only search: lower data-processing complexity but weaker synonym/context retrieval;
- full-resume embeddings: rejected because private contact/address/history data are not necessary for public talent discovery;
- private notes/assessment embeddings: rejected;
- autonomous candidate selection/rejection: rejected.

Chosen design:

- use only sanitized professional discovery text for embeddings;
- keep vectors private;
- retain structured evidence and human review.

## 5. Privacy risks and controls

### Public-profile expectations

Risk: professional data could be reused outside the VA's reasonable expectation.

Controls:

- separate public-profile consent;
- semantic search is disclosed in the Privacy Notice;
- only the live consent-gated directory can enter public semantic search;
- withdrawn/ineligible profiles stop being returned immediately even if a stale vector temporarily exists.

### Embedding disclosure or inversion

Controls:

- vector table is private;
- no anon/authenticated direct grants;
- public responses do not contain embeddings;
- embedding source excludes private resumes, direct contact data and private workflow records.

### Ranking fairness and accuracy

Controls:

- matching/search inputs are job-relevance factors, not protected-class attributes;
- semantic similarity supplements structured search;
- human recruiter review remains mandatory;
- low scores do not automatically reject candidates;
- material ranking/model changes should be logged and reviewed.

Open monitoring control:

- periodically compare retrieval quality across specialties, experience levels, schedule patterns and profile-writing styles for systematic under-ranking or misleading relevance.

### Stale availability/profile information

Controls:

- availability confirmation is tracked separately;
- public profiles must remain eligible in the live directory;
- recruiters confirm fit, interest, availability, schedule and compensation before client presentation.

### Provider/model outage

Controls:

- query embedding failure falls back to database full-text/structured retrieval;
- semantic index refresh is retryable maintenance work;
- missing embeddings do not make a public profile inaccessible to lexical search.

## 6. Security controls

- Supabase RLS and source-boundary hardening;
- private semantic embedding storage;
- service-role-only embedding mutation/search RPCs;
- sanitized public-directory source;
- private resume authorization through application relationships;
- bounded PDF/DOCX parsing;
- audit/activity records for recruitment actions;
- CI, CodeQL and dependency audit;
- locked payment state transitions and idempotent provider reconciliation.

## 7. Processors and cross-border processing

Current processor categories include:

- Vercel for application hosting/compute;
- Supabase for database, authentication, storage and database extensions;
- Resend for transactional email;
- Google Calendar/Meet for scheduling;
- PayMongo for payment collection/refunds/disputes;
- configured analytics services;
- configured AI/embedding provider for semantic retrieval.

The DPO must maintain the authoritative processor/subprocessor register, contractual basis, processing locations and transfer safeguards. Source code is not the authoritative legal register.

## 8. Retention

Semantic embeddings:

- exist only to support matching/search;
- source changes cause re-indexing;
- profile deletion cascades vector deletion;
- ineligible profiles are excluded by the live public-directory source.

Other recruiting, payment, audit and security records follow the approved retention schedule for the relevant purpose, accounting/tax requirement, dispute period, security need or legal obligation.

## 9. Data-subject rights

Existing product controls include:

- VA profile editing;
- public-profile consent grant/withdrawal;
- privacy/data-request contact channel;
- account deletion request workflow subject to lawful retention.

The DPO process must support applicable rights to information, access, correction, objection, withdrawal of consent, deletion/blocking where appropriate, and complaint escalation.

## 10. Residual risk and release gate

Residual risk is acceptable for decision-support use if:

- the DPO completes/updates the required NPC DPS registration;
- processors/transfers and retention are documented;
- meaningful human review remains;
- semantic inputs remain restricted to sanitized professional fields;
- ranking-quality monitoring is performed;
- the Privacy Notice stays aligned with material processing changes.

DPO decision/sign-off: **Pending operational sign-off.**
