# Virtual Assistant Foundations V2 — Review and hands-on pilot pack

**Status:** curriculum proposal with one working fictional case lab; **not a published course, verified competency or credential.**
**Version:** 1.1 · 20 October 2026
**Owner:** VAPH training team
**Audience:** novice pilot learners, VA trainer, instructional designer, assessor, accessibility reviewer and engineer.

## Read / try these materials in order

1. **[Comprehensive curriculum blueprint](./CURRICULUM_BLUEPRINT.md)** — proposed 10 modules, 40 lessons and 35h 15m of instruction + practice, plus a final client-day simulation and V1-to-V2 preservation plan.
2. **[Complete M03-L01 teaching lesson](./LESSON_03_01_INBOX_TRIAGE.md)** — 150-minute *planned* lesson with worked decisions, a live-in-the-browser fictional simulation, cross-record evidence work and five deliverables.
3. **[Client operating guide and source index](./CLIENT_OPERATING_GUIDE.md)** — synthetic client rules, authorities, real deadlines vs checkpoints, and links to **seven** different records/policies.
4. **[Offline interactive inbox lab](./practice-inbox-lab.html)** — select 12 messages, watch four examples, inspect records, complete eight cases, and **export decisions as CSV**. Download the HTML and open it in a modern browser. It is not a deployed app or a live email account.
5. **[Raw 12-message case CSV](./inbox-case-messages.csv)** — contains four teacher demonstrations plus eight independent messages. **No learner-facing answer hints or approved next actions.**
6. **[Blank independent decision tracker](./inbox-triage-blank.csv)** — 8 rows and 13 columns with separate actual deadlines and follow-up checkpoints.
7. **[Public criterion-based assessment rubric and feedback form](./ASSESSMENT_RUBRIC_AND_FEEDBACK.md)** — 100 points, safety-critical failures, feedback and reassessment requirements.
8. **[Accessible full-size process diagram](./assets/inbox-triage-flow.svg)** and **[mobile vertical diagram](./assets/inbox-triage-flow-mobile.svg)** — original workflow illustrations; **not** screenshots of a branded email tool.
9. **[Accessibility and pilot QA checklist](./ACCESSIBILITY_AND_PILOT_QA.md)** — test protocol, offline privacy and product-demo requirements.

## Source records learners must inspect

| File | What it provides |
| --- | --- |
| [Bookings](./records/bookings.csv) | Scheduled visits, status, dispatch/availability and missing booking evidence |
| [Finance records](./records/finance-records.csv) | Invoice PDFs, pending payment, approved vendor source and matched receipt |
| [Customer directory](./records/customer-directory.csv) | Account reference email versus potentially unauthorized recipient |
| [Weekly jobs](./records/weekly-jobs.csv) | Twelve fictional jobs with recorded and verifiable completion differences |
| [Approval register](./records/approval-register.csv) | Pricing, campaign, document approval states and owners |
| [Rates and policies](./records/rates-and-policies.md) | Approved services, identity-release workflow, refund and marketing rules |
| [Meeting MN-22](./records/meeting-MN-22.md) | Confirmed, proposed and unassigned follow-up details |

**Instructor-only answer keys must NOT be committed to this public repository.** The rubric is public by design; any scoring key for M05–M12 must be versioned and shared only via restricted reviewer storage outside this repo. Learners may access all fictional evidence files but must decide what to do with them.

## What was changed in this review

- Replaced the practice-case “scenario note” column, which was giving learners answers, with realistic synthetic message bodies.
- Created supporting evidence records so learners can **check facts**, not just explain what to check.
- Added an offline fictional inbox interface that works with a keyboard, a narrow screen and no external API. It performs a **completeness check, not competency grading**.
- Separated real hard deadlines from follow-up checkpoint fields.
- Added a mobile-friendly vertical flow diagram and transparent human scoring anchors.
- Expanded the sample lesson to **150 nominal minutes**, bringing the full proposed V2 blueprint to **35h 15m**.

## What this pack does NOT do

- Does not change VAPH production curriculum records, assessment logic, issued certificates, learner progress, job matching, authorization or live app routes.
- Does not publish the new pilot or enable V2 enrollment.
- Does not contain current Gmail/Outlook test-account screen recordings or demonstrate branded-software proficiency. **Capture those with permissioned training accounts and captions before claiming product-specific software skills.**
- Does not auto-save practice work. In the offline HTML simulator, practice entries stay in tab memory and disappear after refresh or close. Download the CSV **before leaving**.
- Does not collect genuine client/customer data or send learners' practice entries to an AI provider.
- Does not prove the proposed lesson time or assessment model works with real novice learners. Human observation is still required.

## Preserve the current course

The repository's 14 October audit reports **10 published consolidated Foundations lessons** with three older split lessons intentionally unpublished. Keep current course IDs, existing completion and certification records unchanged. Implement V2 later as a separate, opt-in version with reviewed practical evidence and distinct learner progress. No silent migration.

## Human approval checklist before piloting with external learners

- [ ] Working VA and hiring manager approve realistic task boundaries and case facts.
- [ ] Reviewer-only rubric protocol and answer key secured **outside this public repo**.
- [ ] Novice pilot learners can complete the offline simulation and evidence files without coached answers.
- [ ] Accessibility review: keyboard, 320/390/768px, screen readers, 200–400% zoom and CSV alternatives.
- [ ] Content owner tests the full five-artifact submission workflow and score feedback using fictitious data.
- [ ] A qualified trainer double-marks example submissions for calibration.
- [ ] Product/compliance approves any later storage/upload of learner submissions, permissions, retention and appeals.
- [ ] Current permissioned product-specific demonstrations captured and verified before any product-competence claim.

**Do not merge this documentation PR as an instruction to publish V2.** It is a reviewable curriculum proposal and locally runnable practice demonstration, not a production release.

