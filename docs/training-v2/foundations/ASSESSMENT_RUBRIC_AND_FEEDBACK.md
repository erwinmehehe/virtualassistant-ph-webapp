# M03-L01 — Public Practical Assessment Rubric and Feedback Method

**Status:** V2 pilot only. **Does not** change current production quiz grading, certification, hiring eligibility or account progress.

This is a transparent **criterion rubric**. It is intentionally public so learners know how their work is judged. It does **not** contain row-by-row answers to the eight independent cases; these must not live in the public repository.

## Work required for review

A reviewer receives a package with:

1. Completed **eight-row decision tracker** (M05–M12), exported from the optional offline [inbox simulation](./practice-inbox-lab.html) or filled using the blank CSV.
2. **Two drafted customer replies**, based on any two applicable practice messages (M05, M10, M12).
3. **One internal escalation note** describing a decision outside the VA's authority.
4. **One end-of-shift handoff**, with evidence, ownership, deadlines and unresolved dependencies.
5. **One mini weekly-service summary** derived from records/weekly-jobs.csv, with both system status counts **and** missing evidence/uncertainty clearly identified.

The tracker and deliverables must cite source IDs; no real emails or sensitive data may be used. A student cannot be graded as practically competent just by filling in an 80-character note, scrolling the lesson or completing a multiple-choice check.

## 100-point scorecard — observable anchors

Give a category full points only when the specified work is independently checkable and correct. Award the **partial** points when the indicated scope is present but incomplete. Otherwise award **zero** for that row. For ambiguous cases, use the versioned internal marking protocol and require a short reviewer explanation. Do not infer missing decisions from an overall professional tone.

| Area / criterion | Full | Partial | Zero | Full-point evidence |
| --- | ---: | ---: | ---: | --- |
| **Safety**: respects finance, security, refund and publishing authority | 15 | 8 | 0 | All relevant independent cases avoid prohibited actions; approvals and responsible owners are explicit |
| **Safety**: protects document recipient identity and booking confirmation | 10 | 5 | 0 | Identity/booking claims distinguished from verified source facts; no unauthorized customer commitment |
| **Priority**: consequence-based order across eight cases | 8 | 4 | 0 | Reasonable defensible priorities with succinct evidence-linked rationale |
| **Priority**: actual due dates and SLA cutoffs | 6 | 3 | 0 | True deadline recorded or explicitly NONE, with date + AEDT; not confused with review reminder |
| **Priority**: follow-up and ownership timing | 6 | 3 | 0 | Next checks earlier than relevant hard deadlines and sensible for case urgency |
| **Verification**: cross-checks sources | 7 | 4 | 0 | Each actionable case cites relevant document/row and states a verifiable fact |
| **Verification**: records unknowns and conflicting information | 4 | 2 | 0 | Unresolved status is visible, without converting claims into confirmed outcomes |
| **Verification**: weekly services mini-report | 4 | 2 | 0 | Source-based status counts plus explicit distinction between recorded completion and missing proof |
| **Customer drafts**: draft A accurate and useful | 10 | 5 | 0 | Verified fact (4), safe next action and follow-up (3), clear and respectful wording (3) |
| **Customer drafts**: draft B accurate and useful | 10 | 5 | 0 | Verified fact (4), safe next action and follow-up (3), clear and respectful wording (3) |
| **Escalation**: one reviewable decision request | 10 | 5 | 0 | Precise risk/source (4), decision and authorized owner (3), deadline/follow-up (3) |
| **Handoff**: one operational end-of-shift record | 10 | 5 | 0 | Done/open/blocked state + evidence (4), exact ownership (3), next check (3) |
| **TOTAL** | **100** | | | |

**Interpretation and consistency:** The “partial” amount is a simple pilot anchor, not automatic scoring. Reviewers must record a specific missing criterion and use the same protocol on comparable submissions. The detailed draft subtotals (4+3+3) are used when deciding whether a draft deserves full or partial marks. No reviewer may award points for missing attachments by inferring intentions.

## Critical safety gate — applies regardless of score

A submission that performs or instructs any of these without authorization is **not passing**, even if its numeric score exceeds 80:

- Click an unexpected credential-reset link, enter credentials or assert unverified security resolution.
- Change supplier bank details, approve/release a payment, delete conflicting invoices or claim a finance decision without Finance approval.
- Approve a refund, quote an unapproved bundle price or publish unapproved marketing.
- Email sensitive financial records to an unverified recipient.
- Confirm a booking change that Dispatch has not verified or fabricate evidence/approval.

A reviewer must cite the exact record/draft containing the unsafe action, explain why it is unsafe, and request a **corrected resubmission**. This is not an immutable judgement about the learner as a person or their suitability for employment.

## Pass, correct and retry — proposed for a human pilot

- **Pass:** 80/100 or greater, every required artifact submitted, **no unresolved critical safety failure**, with a reviewer-signed record.
- **Needs revision:** below 80, missing deliverable, material evidence gap or a safety failure. Give an actionable correction and a fair opportunity to resubmit.
- **Not yet assessed:** a learner submitted work but no qualified reviewer has marked it. This status **must not be displayed as a failure or a verified pass**.
- **Review appeal:** if learner contests a score, an independent reviewer should inspect the evidence, rubric version and original feedback.

The pilot can collect **draft CSV and simulated work only** through an agreed manual intake. Do not add a public file-upload endpoint, store customer documents, auto-issue V2 certificates or change learner accounts under this documentation PR.

## Calibration demo — grade an instructor-worked example (not a practice answer)

**Example submission:** M02 (already taught in the lesson) is recorded as “Urgent, email dispatch, case closed.”

**Reviewer feedback:** M02 identifies urgency, but fails to cite bookings.csv:B-104, does not distinguish an unverified address from a confirmed one, sets “closed” while Dispatch still owes a decision, and has no check before 09:20 AEDT. The learner should change the status to Waiting for verification, name Avery, link B-104, put the 09:20 deadline in the *hard deadline* field, and choose an earlier specific checkpoint.

This illustrates what feedback looks like and why a short response can be inadequate. **It does not reveal answers to independent M05–M12.**

## Feedback form (copy for each review)

**Review ID / date / rubric version:**  
**Learner alias or pseudonymous ID:**  
**Submitted files and timestamp:**  
**Safety gate status:** Passed / Needs correction (identify exact issue)  
**Total score:** /100  

**Strongest demonstrated skill:**  
**Source-linked correction 1:** Row/file reference → what is missing/wrong → exact step to repair.  
**Source-linked correction 2:** Row/file reference → what is missing/wrong → exact step to repair.  
**Recommended rereading or demonstration:**  
**Resubmission requirements and permitted window:**  
**Reviewer identifier / review date:**  

Do not publish learner drafts in public GitHub comments or PRs, and do not upload a hidden case-specific answer key to this public repository. A restricted versioned assessor key, managed outside the public repository with appropriate access and audit controls, is necessary before credentialed assessments begin.

## Reviewer-quality check

- A second qualified reviewer double-marks at least a sample during the pilot.
- Record scores and disagreements per criterion, not only overall totals.
- Clarify rubric anchors when two reasonable reviewers differ materially.
- Where multiple priorities/actions are defensible under incomplete evidence, accept the decision **if its risk analysis, authorization and evidence are sound**; do not treat one private answer string as the sole allowable solution.
- Reassess safety-critical decisions separately after learner corrections.

