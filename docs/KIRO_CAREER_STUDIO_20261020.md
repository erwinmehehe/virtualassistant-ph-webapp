# Kiro Career Studio — October 20, 2026

## Purpose and route
New authenticated learner page: `/workspace/training/coach`, linked from the Training dashboard and from desktop/mobile Training navigation.

Kiro Career Studio is an **optional, structured career practice area** that gives VAPH learners a practical way to plan their next course and prepare examples for resumes, practice portfolios and interviews. This is not the restricted AI lesson coach and does not impersonate it.

## Grounded learner context
- Server calls `requireTrainingAccessFast()` and `getTrainingDashboard(userId)` under the logged-in learner's identity.
- Existing `chooseTrainingResumeCourse` prioritizes an unfinished lesson or final assessment.
- Existing `recommendNextTrainingCourses` supplies up to three *published, not-yet-completed* courses, honoring the learner's existing VA category and chosen Australian specialization.
- Numeric summaries represent confirmed course enrollments and completed lessons only, not hiring readiness, test scores or certification eligibility.
- If course data retrieval fails, the personalized interface fails closed with a simple return link. It does not invent progress or course facts.
- Users without a VA profile see general career practice and their authenticated training data. VA-only edit/portfolio links are visible only to actual VA-role accounts.

## Practice activities
1. **Resume lab:** choose actual work versus a simulated project, then draft a transparent statement using only the entered task, tools and supported outcome. Training exercises are explicitly labeled as simulated. No metrics or achievements are added.
2. **Portfolio builder:** form a labeled fictional-project outline that includes brief, process, tools, sample deliverable, quality check and reflection. Learners must fill placeholders with their own practice work.
3. **Interview practice:** choose from fixed beginner scenarios across VA specializations, write a response and receive transparent, rule-based revision prompts plus scenario-specific checklists. No score, grader, assessment answers or hiring decisions.

## Privacy, security and user expectations
- All form state is React memory within the current browser page. On reload/navigation, drafts disappear. **No form submit handlers, database writes, network requests, localStorage or sessionStorage** are used.
- Clipboard copying is an explicit learner action; the browser may disallow it, in which case the learner can select the displayed text.
- Do not paste real client identity, privileged information, health information, account passwords, private files or financial records.
- No AI inference takes place in Career Studio. It is described as **guided, rule-based practice**, not as a live AI response.
- Existing restricted **lesson-level** VAPH AI Coach stays behind `AI_TRAINING_COACH_ENABLED`, pilot allowlist, enrolled Foundations course and the real-model acceptance gate in #905. Career Studio makes no changes to those gates.
- The original Kiro name and VAPH visual system are used; no copied third-party brand assets or product text.

## Deployment and rollback
- Feature is separate from the unmerged lesson-coaching changes in PR #952 and requires no schema migrations, new secrets, paid model, Stripe, Vercel flags or external service.
- Ship only after the new PR's **exact head** passes npm test, typecheck, production build, CodeQL, isolated browser/database E2E and all-role checks, including narrow-width responsive visual review.
- Browser tests use disposable local Supabase and fictional E2E identities; do not seed or change real learner data.
- To roll back safely, revert the reviewed Career Studio merge commit through a PR. No data migration is required. Do not force-reset protected main.

## Future gated enhancements
Real conversational feedback, persisted practice histories, personalized CV parsing or job matching need an independently approved scope, data retention policy, consent, abuse prevention, provider budget controls and real-model acceptance. Do not send career drafts to the existing free-model pilot until the provider terms have been explicitly approved.
