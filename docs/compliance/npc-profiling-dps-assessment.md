# NPC DPS Classification: Talent Matching and Search

**System:** VirtualAssistant.com.ph talent matching, recruiter suggestions, and public talent search  
**Decision date:** 2026-09-25  
**Owner:** Data Protection Officer / Privacy Compliance  
**Engineering owner:** Platform Engineering  
**Decision:** **Treat this system as profiling and register the relevant Data Processing System with the National Privacy Commission.**

## Why this is the correct compliance classification

VirtualAssistant.com.ph automatically evaluates professional personal data to rank or retrieve Virtual Assistants against client searches and role requirements. Signals include professional specialty, skills, tools, industries, experience, availability, rate, schedule/timezone overlap, and related profile data.

The implementation also supports semantic retrieval. Semantic embeddings are mathematical representations derived only from the limited professional fields already eligible for the public directory. Embeddings are stored in the private database schema and are not returned to public clients.

The system therefore performs automated processing of personal data for the purpose of evaluating professional qualities and relevance. For compliance purposes, this is **profiling** under NPC Circular No. 2022-04. Section 5 states that a Data Processing System involving automated decision-making or profiling must be registered with the Commission in all instances.

Human review remains mandatory. Automated matching/search does **not** make the final hiring, rejection, vetting approval, placement, dispute, or payout decision. This is an important safeguard, but it does not change the profiling classification.

## Required DPO action

1. Ensure the organization and DPO registration in NPCRS are current.
2. Register or amend the DPS entry covering:
   - VA professional profiles and availability;
   - deterministic job-to-candidate matching;
   - recruiter match suggestions;
   - public talent search;
   - semantic embedding generation and similarity retrieval;
   - human recruiter/client review following automated ranking.
3. Identify the organization as the PIC and list relevant processors/service providers used by this DPS.
4. Describe the categories of data subjects and personal data processed.
5. Describe the purpose: talent discovery, shortlist support, recruiter review, and role-fit retrieval.
6. Record that the processing includes profiling and that no final hiring/rejection decision is made solely by the automated system.
7. Update the registration when material processing purposes, data categories, processors, or automated logic materially change.
8. Retain the NPC registration evidence and current registration number in the internal compliance register.

**Do not put an NPC registration number into source code or public copy until the DPO has completed the filing and verified the number.**

## Privacy-by-design controls implemented in code

- Public talent search can only return rows from the sanitized public directory contract.
- A VA must separately consent to public directory visibility.
- Private resume/contact/application data is excluded from public search.
- Search embeddings are stored under the private schema and are not directly exposed through the Data API.
- Embeddings are based on the same limited professional fields used for talent discovery.
- The deterministic matcher remains the authoritative eligibility/fit assessment for internal matching.
- Semantic similarity is a retrieval/ranking signal, not an automatic rejection mechanism.
- Recruiter/client human review is required before a candidate is presented, hired, rejected, or placed.
- Search and matching logic are documented in the Privacy Notice.
- VAs can correct the underlying profile information used for matching and can withdraw public profile consent.

## DPIA / processing inventory record

The DPO should include at least the following in the DPIA or privacy impact assessment record:

| Item | Current implementation |
| --- | --- |
| Data subjects | Virtual Assistant applicants/candidates |
| Data types | Professional profile, skills, tools, industries, experience, availability, rate, schedule/timezone, vetting status |
| Sensitive data used for ranking | None intentionally required by the matching algorithm |
| Public source | Sanitized public VA directory only, and only after separate public-profile consent |
| Automated processing | Deterministic matching, full-text retrieval, semantic similarity retrieval |
| Decision effect | Supports discovery and ranking; no sole automated hiring/rejection/placement decision |
| Human intervention | Recruiter/client review before candidate progression |
| Embedding model | Supabase Edge AI gte-small, 384 dimensions |
| Embedding storage | private.va_search_embeddings |
| External AI data transfer | None for gte-small embedding inference in Supabase Edge Runtime |
| Retention | Embedding is refreshed when source profile changes and deleted when profile is no longer public/eligible |
| Data subject controls | Profile correction, public-profile consent withdrawal, privacy/data request |
| Security | RLS/private schema, service-role-only embedding writes, sanitized public RPC results |
| Monitoring | Queue/retry maintenance, audit/event logging, code review/CI |

## Change-control triggers

Privacy/DPO review is required before any of the following:

- using sensitive personal information or protected characteristics in ranking;
- allowing AI to make a final rejection/hiring/placement decision;
- ingesting private resume text into public semantic search;
- sending profile data to a new external embedding/AI provider;
- materially changing the ranking purpose;
- using behavioral activity or communications content as candidate ranking signals;
- exposing internal match scores directly to public clients without review;
- retaining embeddings after the underlying public profile is withdrawn.

## Filing evidence checklist

The engineering portion is complete when this document, the Privacy Notice, current architecture, and search/matching data-flow are attached to the internal compliance record.

The **regulatory filing itself remains a DPO-authorized action** because NPCRS registration is an organization attestation that requires the DPO/authorized registrant and the organization's registration information. Engineering must not invent registration details or represent the DPS as registered until the DPO confirms filing.
