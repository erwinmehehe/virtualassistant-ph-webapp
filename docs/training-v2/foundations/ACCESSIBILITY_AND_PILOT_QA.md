# VAPH Foundations V2 — Pilot Delivery QA

This is an **accessible pilot packaging checklist**, not a claim that a finished production learning interface exists.

## What is already present

- Detailed learner narrative with worked examples and an independent practice assignment.
- Original generic workflow diagram plus a **mobile-first alternative** with identical meaning.
- An offline [interactive fictional inbox](./practice-inbox-lab.html): native buttons, labels, keyboard focus, required-field completeness check, working practice input and CSV export.
- The original 12-message CSV, a blank 8-row work tracker, and multiple linked fictional system-of-record files to inspect.
- A transparent, criterion-based [human review rubric](./ASSESSMENT_RUBRIC_AND_FEEDBACK.md).
- Text-only equivalents for diagrams and recorded demonstrations. The simulator is *not* affiliated with Gmail, Outlook or real client systems.

## Learner pathway to test, in order

1. **Before:** read the fictional client SOP and check you know the date, coverage window, approval roles and what must not be sent to a real person.
2. **Show:** follow the four modeled messages M01–M04, including what the instructor refused to assume and the documented handoff.
3. **Investigate:** independently select M05–M12 and inspect at least two distinct source files per risk/approval decision. Keep conflicting data visible.
4. **Perform:** fill the decision form, choose safe actions and priorities, record deadlines separately from next checks, and export the CSV tracker.
5. **Produce:** outside the simulator, draft two client replies, one escalation, one shift handoff and one weekly jobs summary using the provided templates.
6. **Review:** receive criterion-level feedback; correct inaccurate or unsafe work; resubmit the whole evidence pack.
7. **Reflection:** explain one different decision you would make on a new case without copying the answer to the original.

## Accessibility acceptance checks (must be performed by actual users/testers)

- Keyboard users can navigate the 12-message inbox, forms, documents, export and feedback without a pointer.
- Screen readers announce selected message, field labels and status change.
- HTML document is usable at **320, 390, and 768 CSS pixels** without clipping or horizontal document overflow.
- Browser zoom at 200% and 400% remains usable; error explanations do not rely on color only.
- SVG has a title and description; users on small devices get a vertical diagram alternative and text equivalent.
- CSV exports preserve columns, source IDs and multiline draft text without spreadsheet formula injection from untrusted sources.
- All video/screencast demonstrations in a future production version must have captions, transcripts and permissioned dummy-account data.
- Learners who cannot use a spreadsheet may fill an accessible text-table alternative; do not force smartphone users to manipulate 13-column data on a single tiny screen.

## Product-specific training remains a separate signoff

The offline simulation **teaches transferable process logic**, not full skill in Gmail, Outlook or a particular helpdesk. Before a production course is advertised as software training, capture permissioned **test-account** screen demonstrations with current UI, version/date notes, text alternatives and a verified procedure. Do not use synthesized screenshots that masquerade as current product interfaces.

## Offline and privacy QA

- The HTML simulator has no networking or localStorage/sessionStorage calls and stores work in tab memory only.
- It offers an explicit CSV export. On refresh or close, unsaved work will be lost; make this clear to a learner before starting.
- Every name/contact/invoice in the case pack is fictional; never insert real client data or user credentials.
- Course completion and V2 competency review are **separate systems**, not implemented by this documentation PR.
- When implementing persistence later, specify retention, deletion, reviewer access, accessibility, resubmission and security before enabling learner uploads.

## Observation protocol

Recruit 6–10 novice learners, 2 trainers and at least one accessibility tester. Measure: whether they can open the files, understand decision rights, recognize source conflicts, complete the tracker, export work and correct errors after feedback. Record actual completion times. Nominal hours are design estimates until measured. Do not claim measured learning outcomes based on a test plan alone.

