-- Deepen Sales & Lead Generation training with first-class practical work.
-- Replaces the generic catalog practice layer and legacy "Work product drill"
-- endings with one role-specific exercise, reusable template, and QA checklist
-- per published lesson. Lesson IDs, learner progress, assessments, and
-- publication state are preserved.

with practice (
  lesson_id,
  exercise_title,
  exercise_text,
  deliverable,
  template_title,
  template_text,
  checklist_title,
  checklist_items
) as (
  values
  (
    '22000007-0000-4000-8000-000000000011'::uuid,
    'Build an evidence-based ICP and stage map',
    'Harborline Growth Partners wants to target Australian service businesses with 10–80 staff. The founder has supplied preferred industries, excluded industries, service geography, minimum operating maturity, and three common buying triggers. Build the ICP and funnel-stage rules without turning assumptions into facts or treating fit as intent.',
    'An ICP and lead-stage matrix showing inclusion criteria, exclusions, verified evidence required for each stage, disqualifiers, and examples of records that must not advance.',
    'ICP and funnel-stage matrix',
    $tpl$ICP NAME:
Business objective:
Target geography:
Target industries:
Company-size range:
Required fit signals:
Optional fit signals:
Buying triggers the client has approved:
Explicit exclusions:
Data source for each criterion:
Unknown / unverified fields:

STAGE:
Definition:
Evidence required to enter:
Evidence that is NOT enough:
Owner:
Next action:
Exit / disqualification rule:
Example record that stays here:$tpl$,
    'ICP and funnel QA',
    array[
      'Fit criteria come from the client brief rather than invented buyer assumptions.',
      'Firmographic fit is separated from engagement and purchase intent.',
      'Every funnel stage has observable entry criteria.',
      'A meeting or complete record does not automatically mean qualified.',
      'Disqualifiers and exclusions are explicit.',
      'The next owner and action are clear at each stage.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000012'::uuid,
    'Audit a prospect list for trust and data quality',
    'You receive a 10-row prospect sample containing one duplicate, two stale job titles, one personal email with no approved business-use reason, one previously opted-out contact, one unsupported job title, and several records with missing source dates. Decide what can be used, what needs verification, what must be suppressed, and what should be removed or held.',
    'A prospect data-quality audit with one decision per row, source evidence, verification date, suppression status, privacy or relevance concern, and required next action.',
    'Prospect data-quality audit',
    $tpl$RECORD:
Company:
Contact:
Business relevance:
Source:
Source URL / record:
Checked date:
Role verified:
Company verified:
Duplicate check:
Suppression / do-not-contact check:
Unnecessary personal data present:
Conflict / uncertainty:
Decision: Keep / Verify / Merge / Suppress / Remove / Hold
Reason:
Owner:
Next checkpoint:$tpl$,
    'Prospect-data QA',
    array[
      'Every usable record has an identifiable source or verification path.',
      'Opt-outs and suppression states are preserved.',
      'Unnecessary personal data is not collected just because it is available.',
      'Stale or conflicting employment data is flagged instead of guessed.',
      'Duplicates are resolved without losing useful CRM history.',
      'Row count is never prioritised over accuracy and trust.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000021'::uuid,
    'Build a reviewer-ready prospect research sheet',
    'Research six fictional target accounts from the supplied business-source pack. Use the approved ICP, record only verifiable business facts, and show why each account is included. Where a required field cannot be verified, leave it explicitly unresolved rather than estimating it.',
    'A six-account prospect sheet with company fit, relevant contact or role, source URL, checked date, verification status, inclusion rationale, missing fields, and recommended next action.',
    'Prospect research sheet',
    $tpl$ACCOUNT:
Website:
Location:
Industry:
Company-size evidence:
Relevant role / contact:
Business contact route:
ICP criteria met:
Potential trigger or context:
What is verified:
What is inferred:
Source URL:
Checked date:
Existing CRM record:
Missing / uncertain:
Include in list?: Yes / No / Review
Reason:
Next action:$tpl$,
    'Prospect-research QA',
    array[
      'Every inclusion maps to an explicit ICP criterion.',
      'Business facts are traceable to supplied or approved sources.',
      'Missing size, role, or contact data is not fabricated.',
      'Existing CRM history is checked before a new record is created.',
      'Context is not rewritten as an invented pain point or buying signal.',
      'Another operator can reproduce why each account was included.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000022'::uuid,
    'Resolve duplicates without corrupting CRM history',
    'The CRM contains eight conflicting person/account records. Some differ by email, employer, title, source date, lifecycle stage, and suppression status. Build the merge plan and identify which fields may be updated, which history must be preserved, and which records need human review.',
    'A CRM dedupe and enrichment plan covering survivor record, conflicting fields, source strength, preserved history, suppression state, merge action, reviewer, and post-merge QA.',
    'CRM dedupe and enrichment plan',
    $tpl$DUPLICATE GROUP:
Candidate record IDs:
Likely same person / account?: Yes / No / Review
Survivor record:
Why:
Field:
Current value:
Candidate value:
Source:
Checked date:
Keep / update / hold:
History to preserve:
Suppression state:
Stage / owner impact:
Merge action:
Reviewer needed:
Post-merge QA:
Final status:$tpl$,
    'CRM hygiene QA',
    array[
      'Identity is verified before records are merged.',
      'The most recent value is not assumed to be the most authoritative.',
      'Suppression and opt-out history survives the merge.',
      'Lifecycle and opportunity stages are not changed just to clean data.',
      'Useful interaction history remains accessible.',
      'Post-merge QA checks the surviving record, ownership, tasks, and history.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000031'::uuid,
    'Prepare outreach that is relevant without pretending familiarity',
    'Create three outreach briefs from supplied company research. One company announced a new location, one is hiring operations staff, and one has no strong trigger beyond basic ICP fit. Decide what context is safe to use, what is too weak to mention, and what the sender still needs approved before outreach.',
    'Three outreach briefs with verified context, relevance rationale, approved proof points, message angle, claim boundaries, CTA, personalisation field, weak facts held back, and approval status.',
    'Outreach personalisation brief',
    $tpl$ACCOUNT:
Target role:
ICP fit:
Verified context:
Source:
Checked date:
Why this context may be relevant:
What it DOES NOT prove:
Approved offer:
Approved proof point:
Personalisation line:
Message angle:
CTA:
Claim / wording to avoid:
Sender authority:
Approval needed:
Final status: Draft / Ready / Hold
Notes:$tpl$,
    'Outreach-brief QA',
    array[
      'Every personalisation detail is true and source-backed.',
      'The draft does not imply a relationship, article read, pain point, or intent that was not verified.',
      'The client offer and proof points stay within approved claims.',
      'Weak or stale facts are held back rather than forced into the message.',
      'The CTA matches the approved sales motion.',
      'Sending authority and approval state are explicit.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000032'::uuid,
    'Run a reply queue and sequence-control board',
    'A live outreach sequence produces eight replies: interested, referral, pricing request, not now, not interested, wrong contact, opt-out, and a complaint. Triage each reply, stop or continue automation correctly, update the CRM, route sensitive items, and set the next checkpoint.',
    'A reply-control board with category, automation action, CRM update, customer/prospect response, owner, follow-up date, suppression action, escalation reason, and status.',
    'Reply triage and sequence-control board',
    $tpl$PROSPECT / ACCOUNT:
Reply:
Category:
Sequence action: Stop / Pause / Continue / Remove
Suppression required:
CRM stage / status:
CRM note:
Response I can send:
Question / decision needing owner:
Next owner:
Follow-up date:
Escalation reason:
Evidence / source:
Final status:$tpl$,
    'Reply-triage QA',
    array[
      'A clear opt-out immediately stops outreach through the approved suppression process.',
      'Interested, referral, objection, complaint, and unclear replies are not lumped together.',
      'Automation stops when human judgment or a sensitive response is required.',
      'CRM status and notes match what actually happened.',
      'Commercial, privacy, or high-risk questions go to the authorised owner.',
      'Every open reply has one owner and next checkpoint.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000041'::uuid,
    'Prepare a qualification note without making the sales decision',
    'A prospect confirms the relevant business problem, target timing, and service geography. They are not the budget owner, have not confirmed budget, and want the salesperson to explain implementation. Apply only the approved qualification criteria and prepare the handoff.',
    'A qualification record separating confirmed facts, unanswered questions, criteria met, criteria not yet met, authority boundary, recommended next sales step, and salesperson handoff.',
    'Qualification and discovery handoff',
    $tpl$ACCOUNT:
CONTACT:
Source / inbound context:
Approved qualification criteria:
Problem / use case confirmed:
Company / service fit confirmed:
Timing:
Decision role:
Budget / commercial threshold:
Current process / tool:
Criteria met:
Criteria not yet verified:
Questions still open:
Facts vs assumptions:
What the VA may answer:
What requires salesperson / specialist:
Recommended next step:
Sales owner:
Handoff note:
Next checkpoint:$tpl$,
    'Qualification QA',
    array[
      'Qualification uses the client’s explicit criteria.',
      'Confirmed facts are separated from missing information and assumptions.',
      'Meeting interest alone is not treated as qualification.',
      'The VA does not negotiate, promise implementation, or invent budget authority.',
      'The salesperson can see exactly what remains to discover.',
      'The CRM stage is supported by evidence.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000042'::uuid,
    'Build a booking and no-show recovery workflow',
    'A qualified prospect agrees to a discovery call with a salesperson in another time zone. Build the booking record, confirmation, reminder plan, salesperson context, reschedule path, and a no-show recovery sequence that follows the client’s approved cadence.',
    'A complete appointment-setting pack with time-zone confirmation, meeting details, qualification context, reminders, CRM task, reschedule path, no-show action, owner, and stop rule.',
    'Appointment-setting and no-show record',
    $tpl$ACCOUNT / PROSPECT:
Meeting purpose:
Sales owner:
Date:
Time:
Time zone confirmed:
Duration:
Meeting link:
Attendees:
Qualification summary:
Open questions:
Confirmation sent:
Reminder schedule:
CRM stage:
CRM task:
Reschedule route:
NO-SHOW
No-show timestamp:
First follow-up:
Rebooking option:
Second follow-up if approved:
Stop rule:
Owner:
Next checkpoint:$tpl$,
    'Appointment-setting QA',
    array[
      'Date, time, duration, and time zone are explicit.',
      'The meeting owner receives the qualification context before the call.',
      'The meeting link and attendee list are checked.',
      'Reminders and rescheduling follow the approved workflow.',
      'A no-show does not create endless chasing or duplicate bookings.',
      'CRM stage, task, and next owner stay synchronized.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000051'::uuid,
    'Repair a misleading pipeline without inventing activity',
    'Five CRM records are wrong: one is in Proposal with no proposal sent, one qualified lead has no next task, one closed-lost record was reopened to make pipeline volume look healthier, one record has no owner, and one handoff note is missing the prospect’s key objection. Correct the operational state.',
    'A five-record CRM correction log with current state, evidence, corrected stage/status, owner, task, due date, preserved history, handoff note, and reason for each change.',
    'CRM stage and handoff correction log',
    $tpl$RECORD:
Current stage / status:
Evidence in record:
Mismatch:
Correct stage / status:
Why:
Owner:
Next task:
Due date:
History to preserve:
Qualification / objection context:
Handoff needed:
Handoff note:
Reviewer needed:
Final QA:$tpl$,
    'Pipeline-integrity QA',
    array[
      'Every stage correction is supported by observable evidence.',
      'No sales activity is invented to justify a preferred pipeline state.',
      'Closed outcomes and disqualification reasons remain accurate.',
      'Every active record has an owner and next task.',
      'Handoffs preserve the prospect context the next owner needs.',
      'Reporting integrity is prioritised over cosmetic pipeline volume.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000052'::uuid,
    'Diagnose a funnel before recommending more outreach',
    'This week outreach volume rose 40%, reply rate fell from 12% to 6%, booked meetings stayed flat, invalid contacts doubled, and the CRM cleanup identified duplicate and stale records. Calculate the funnel rates from the supplied counts, identify which metrics can be trusted, and write the operations summary.',
    'A funnel report with metric definitions, numerator/denominator, current and comparison values, data-quality caveats, observed facts, hypotheses, investigation steps, owner, and next decision.',
    'Sales funnel and data-quality report',
    $tpl$REPORTING PERIOD:
Comparison period:
Source:
Metric:
Definition:
Numerator:
Denominator:
Current:
Previous:
Change:
Can this metric be trusted?: Yes / Partly / No
Data-quality issue:
Observed fact:
Possible explanation NOT yet proven:
Investigation needed:
Recommended next test / action:
Owner:
Next review:$tpl$,
    'Sales-reporting QA',
    array[
      'Every rate has a named numerator and denominator.',
      'Activity volume is separated from outcome and quality metrics.',
      'Duplicate, stale, and invalid records are reflected in confidence limits.',
      'Observed changes are separated from causal explanations.',
      'The report does not recommend scaling a broken list or process blindly.',
      'The next investigation or decision is specific and owned.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000061'::uuid,
    'Handle sensitive replies without exceeding authority',
    'Three prospects reply: one asks to be removed immediately and asks where their details came from, one asks for a pricing exception outside the approved range, and one challenges a technical capability the VA cannot verify. Prepare the CRM actions, prospect responses, suppression step, and escalations.',
    'A sensitive-reply log with original issue, verified evidence, immediate safe action, response, CRM/sequence change, escalation owner, decision needed, deadline, and follow-up.',
    'Sensitive sales reply and escalation log',
    $tpl$PROSPECT / ACCOUNT:
Original reply:
Category:
Risk / sensitivity:
Verified evidence:
Immediate action:
Sequence action:
Suppression action:
CRM update:
Response I can send now:
Question / decision I cannot answer:
Escalation owner:
Evidence included in handoff:
Deadline:
Next checkpoint:
Final status:$tpl$,
    'Sensitive-reply QA',
    array[
      'Clear opt-outs are actioned rather than debated.',
      'The original message and source evidence remain available.',
      'Pricing exceptions, technical claims, privacy concerns, and negotiations stay with authorised owners.',
      'The VA answers only what is verified and approved.',
      'CRM and sequence state match the response that was sent.',
      'The escalation asks for a specific decision or answer.'
    ]::text[]
  ),
  (
    '22000007-0000-4000-8000-000000000062'::uuid,
    'Final simulation: run the Harborline sales-support desk',
    'Harborline Growth Partners has 120 target accounts, duplicate and stale records, prior do-not-contact entries, an unsourced imported list, a mixed reply queue, qualification gaps, booking requests, a data-source complaint, and a weekly funnel report that is distorted by bad CRM data. Run the desk from cleanup through handoff.',
    'A complete sales-support control pack: ICP/stage check, data-quality audit, dedupe plan, priority prospect list, reply queue, suppression actions, qualification note, booking handoff, CRM corrections, sensitive-reply escalation, and funnel summary with data-quality caveats.',
    'Harborline sales-support control pack',
    $tpl$HARBORLINE SALES-SUPPORT DESK

1. DATA CONTROL
Records reviewed:
Duplicates:
Stale contacts:
Suppressed / do-not-contact:
Unsourced records:
Manual-review queue:

2. PRIORITY PIPELINE
Account:
Fit evidence:
Engagement:
Current stage:
Next action:
Owner:

3. REPLY CONTROL
Interested:
Referral:
Not interested:
Opt-out:
Objection:
Complaint / sensitive:
Sequence actions:

4. QUALIFICATION + BOOKING
Confirmed facts:
Open questions:
Sales owner:
Meeting / next step:
Time zone:
Handoff:

5. CRM CORRECTIONS
Stage fixes:
Owners:
Tasks:
Preserved history:

6. REPORT
Trusted metrics:
Untrusted metrics:
Observed changes:
Data-quality caveats:
Next investigation:

7. END-OF-SHIFT
Completed:
Still open:
Decisions needed:
Tomorrow first:
Evidence / source links:$tpl$,
    'Final Sales & Lead Gen simulation QA',
    array[
      'Suppression and do-not-contact records are protected before any outreach continues.',
      'Duplicate, stale, and unsourced records are resolved or isolated before they distort the pipeline.',
      'Reply handling stops automation at the correct points.',
      'Qualification, booking, and CRM stages are evidence-based.',
      'Pricing, privacy, technical, and negotiation decisions remain with authorised owners.',
      'The funnel summary distinguishes performance from data-quality problems.',
      'The final handoff lets the next operator continue without reconstructing the whole scenario.'
    ]::text[]
  )
),
targets as (
  select l.id, p.*
  from practice p
  join public.training_lessons l on l.id = p.lesson_id
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where c.slug = 'sales-lead-generation-virtual-assistant'
    and l.is_published = true
),
expanded as (
  select
    t.id,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.template_title,
    t.template_text,
    t.checklist_title,
    t.checklist_items,
    b.block,
    b.ord,
    lag(b.block) over (partition by t.id order by b.ord) as previous_block
  from targets t
  cross join lateral jsonb_array_elements(
    (select l2.content from public.training_lessons l2 where l2.id = t.id)
  ) with ordinality b(block, ord)
),
rebuilt as (
  select
    id,
    coalesce(
      jsonb_agg(block order by ord) filter (
        where block->>'type' not in ('exercise','template','checklist')
          and not (
            block->>'type' = 'heading'
            and block->>'text' = 'Work product drill'
          )
          and not (
            previous_block->>'type' = 'heading'
            and previous_block->>'text' = 'Work product drill'
            and block->>'type' = 'scenario'
          )
      ),
      '[]'::jsonb
    )
    || jsonb_build_array(
      jsonb_build_object(
        'type', 'exercise',
        'title', exercise_title,
        'text', exercise_text,
        'deliverable', deliverable
      ),
      jsonb_build_object(
        'type', 'template',
        'title', template_title,
        'text', template_text
      ),
      jsonb_build_object(
        'type', 'checklist',
        'title', checklist_title,
        'items', to_jsonb(checklist_items)
      )
    ) as content
  from expanded
  group by
    id,
    exercise_title,
    exercise_text,
    deliverable,
    template_title,
    template_text,
    checklist_title,
    checklist_items
)
update public.training_lessons l
set
  content = r.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from rebuilt r
where l.id = r.id
  and l.content is distinct from r.content;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'sales-lead-generation-virtual-assistant';
