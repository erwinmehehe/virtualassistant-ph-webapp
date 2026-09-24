# NPC DPS registration: Talent Matching, Search and Recruitment Decision Support

Status: **Registration required / operational action pending**  
Reviewed against the application implementation on 2026-09-24.

## Compliance position

VirtualAssistant.com.ph should register the **Talent Matching, Search and Recruitment Decision Support** Data Processing System (DPS) in the National Privacy Commission Registration System (NPCRS).

NPC Circular No. 2022-04 states that a Data Processing System processing personal or sensitive personal information involving automated decision-making or **profiling shall, in all instances, be registered**. The platform's matching and search features use VA personal/professional information to evaluate and rank suitability for roles, which is profiling even though a human recruiter remains in the decision loop.

Official source:
https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf

NPCRS:
https://npcregistration.privacy.gov.ph/

## DPS scope for registration

Suggested DPS name:
**Talent Matching, Search and Recruitment Decision Support**

Primary purposes:
- search approved VA professional profiles;
- identify potentially relevant candidates for a client role;
- rank recruiter-only suggestions;
- help recruiters review skills, tools, experience, schedule, availability, rate and industry fit;
- provide natural-language talent search using semantic relevance;
- explain matching evidence to authorized staff.

Data subjects:
- Virtual Assistants and candidates;
- client users to the limited extent job/role requirements are used as matching inputs;
- recruiters/admins where audit records identify the reviewing actor.

Personal data involved:
- professional name/display name;
- headline and professional summary;
- skills, tools, industries and languages;
- years of experience;
- availability, schedule, preferred timezone and overlap;
- hourly rate;
- public-profile consent state and eligibility;
- applications and recruiter shortlist state;
- matching scores, confidence and evidence gaps;
- semantic embedding derived from the sanitized professional search document.

Excluded from semantic embeddings:
- email;
- phone number;
- home address;
- resume file contents;
- identity documents;
- payment data;
- private recruiter/admin notes;
- assessment answers;
- private messages.

## Automated processing classification

The system performs **profiling** because it automatically evaluates professional attributes to estimate role relevance.

It is **not configured as sole-basis automated decision-making**:
- automatic matching creates recruiter-only proposals;
- the system does not automatically release a candidate to a client;
- recruiters decide whether a candidate is presented;
- clients make the final hiring decision;
- vetting approval/rejection remains human-controlled;
- payout release and disputes remain human-controlled.

This human-in-the-loop design should be preserved. Any future feature that automatically rejects, hires, suspends, ranks out, or releases a VA without meaningful human review requires a new privacy/legal review before launch.

## Registration packet owner

The designated DPO must complete the NPCRS filing. The repository must not invent a DPO identity.

Before filing, confirm and record outside source code:
- registered PIC/legal entity name;
- business address;
- DPO full name and official privacy contact details;
- number/location of employees relevant to the filing;
- data subject volumes;
- processor/subprocessor details and contracts;
- actual hosting/processing locations;
- retention schedule approved by management;
- incident-response owner and contact;
- current Certificate/Seal of Registration details if already registered.

## Technical controls already implemented

- separate public-profile consent;
- sanitized public VA directory;
- recruiter-only automatic suggestions;
- human release to client;
- RLS/server-only source-table boundaries;
- private semantic embedding table;
- database search RPC returns only sanitized public-profile fields;
- private resumes accessed only through relationship/role authorization;
- sensitive financial transitions are server controlled;
- audit/activity records for matching and hiring actions.

## Required operational actions

1. DPO creates/updates the organization record in NPCRS.
2. Register this DPS as involving profiling.
3. Attach/retain the DPIA in `docs/compliance/DPIA_TALENT_MATCHING.md` as the technical assessment baseline.
4. Confirm processor agreements and cross-border safeguards for Vercel, Supabase, Resend, Google, PayMongo and any configured AI/embedding provider.
5. Publish the real DPO/privacy contact once designated and verified.
6. Record the registration number/certificate internally; do not place private filing credentials in this repository.
7. Review this DPS registration whenever the matching inputs, model, decision role, processors or retention materially change.
8. Assign the DPO/compliance owner for breach assessment and the NPC annual security incident reporting process.

## Release gate

Semantic search may provide **decision support**, but must not become an autonomous hiring/rejection engine. A change that removes meaningful recruiter/client review is a compliance-significant architecture change and must block release until the DPIA and NPC registration details are updated.
