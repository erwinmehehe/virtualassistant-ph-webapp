# NPC Data Processing System Classification

Last reviewed: 2026-09-24

## Decision

The VirtualAssistant.com.ph candidate matching and talent-search system is classified internally as a Data Processing System involving **profiling** for purposes of NPC Circular No. 2022-04.

Reason: the system uses personal/professional profile data such as experience, skills, tools, industries, availability, rate, schedule, assessment/vetting state, and related signals to evaluate or rank how well a candidate fits a role or search query.

The system does **not** make the final hiring, rejection, release-to-client, or placement decision automatically. Recruiters review candidates before release and the client makes the final hiring decision. That human review reduces automated-decision risk, but it does not remove the profiling classification.

## Registration consequence

NPC Circular No. 2022-04 states that a Data Processing System processing personal or sensitive personal information involving automated decision-making or profiling must be registered with the National Privacy Commission.

Operational owner: the appointed Data Protection Officer.

Required action:
1. Confirm the legal PIC/PIP name, registered address, DPO identity and contact details.
2. Register or update the relevant DPS through the NPC Registration System (NPCRS).
3. Describe candidate matching/talent search as profiling and document that human recruiters remain in the decision loop.
4. Include processors/service providers used for hosting, database/authentication, email, analytics, payments, calendar operations, and AI/embedding processing.
5. Update the registration when material processing changes are introduced.
6. Keep the Privacy Notice and internal privacy impact assessment aligned with the registered system.

Official references:
- NPC Circular No. 2022-04: https://privacy.gov.ph/wp-content/uploads/2023/05/Circular-2022-04.pdf
- NPC registration reminder: https://privacy.gov.ph/reminder-on-mandatory-data-protection-officer-and-data-processing-system-registration/
- NPC Registration System: https://npcregistration.privacy.gov.ph/

## AI / semantic search scope

The hybrid talent-search implementation only creates embeddings from profiles that are already eligible for the consented public VA directory. Private resumes, email addresses, phone numbers, test answers, recruiter notes, private applications, and non-public candidate records are excluded from embedding generation.

Embeddings are used for retrieval/ranking. They are not used as the sole basis for hiring, rejection, placement, public listing approval, or compensation decisions.

## Required internal records

Maintain the following alongside the NPCRS filing:
- processing inventory / record of processing activities;
- data flow diagram for candidate matching and public talent search;
- privacy impact assessment covering profiling and embedding generation;
- current processor/subprocessor inventory and locations;
- retention criteria for profile, application, hiring, payment, audit, and training records;
- incident/breach response owner and NPC reporting workflow;
- evidence of public-profile consent and withdrawal;
- model/provider/version records for embeddings;
- human-review controls and recruiter override/audit records.

## Production-release rule

Do not describe the platform as NPC-registered unless the DPO has completed the filing and the registration can be evidenced. Code changes can classify the DPS and enforce privacy-by-design controls, but the regulatory filing requires the operator's legal and DPO information and must be completed through NPCRS.
