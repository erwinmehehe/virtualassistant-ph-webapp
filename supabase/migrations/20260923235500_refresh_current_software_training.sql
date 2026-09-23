-- Refresh current software and regulatory product notes verified in September 2026.

with updates(course_slug,lesson_title,block_title,block_text) as (
  values
    ('xero-workflows-for-virtual-assistants','Bank Feeds, Matching, and Reconciliation Preparation','Current Xero AU automation context','Xero AU now describes JAX automatic bank reconciliation. JAX can automatically reconcile high-confidence transactions and leave lower-confidence items as suggestions for manual review. Its reconciliation methods include Rule, Match, Memory, and Prediction. Treat this as workflow automation, not authority to accept an accounting or GST treatment without the client''s approved review rules.'),
    ('servicem8-for-virtual-assistants','Scheduling Jobs and Using the Dispatch View','Current ServiceM8 scheduling context','ServiceM8 Booking Suggestions can propose staff and times using schedule availability, staff leave, travel time, job duration, date, and time filters. A VA should still validate trade capability, job scope, access requirements, urgency rules, and business authority before confirming a slot.'),
    ('servicem8-for-virtual-assistants','Invoices, Payments, Statements, and Accounting Handoff','Current ServiceM8 invoice states','In the current ServiceM8 Online Dashboard, completed jobs can move through Awaiting Approval before invoicing and Awaiting Payment until full payment is recorded. Use these stages as workflow status, not permission to approve invoice content, accounting treatment, write-offs, or payment exceptions outside the client''s authority matrix.'),
    ('servicem8-for-virtual-assistants','Automation, Reminders, and ServiceM8 Workflow QA','Current ServiceM8 automation controls','ServiceM8 Automation can schedule communications such as quote follow-ups and payment reminders. Scheduled and processed automations expose status and warning information, and scheduled communications can be stopped. When automation behaves incorrectly, preserve evidence, stop unsafe sends where authorised, and escalate the rule change rather than silently rewriting business logic.'),
    ('cliniko-for-virtual-assistants','Cliniko Practice Workflow and VA Permissions','Current Cliniko role model','Cliniko currently documents six user security roles: Scheduler, Receptionist, Power receptionist, Practitioner, Bookkeeper, and Administrator. Select the minimum role the VA actually needs. Do not grant broader access simply to avoid asking an authorised user for help.'),
    ('cliniko-for-virtual-assistants','Confirmations, SMS and Email Reminders, and Follow-Up Messages','Current Cliniko reminder controls','Cliniko supports configurable email and SMS appointment reminders, including controls over which appointments send reminders. QA the appointment, patient contact details, clinic setup, and reminder history before assuming a missing reminder is a patient error.'),
    ('cliniko-for-virtual-assistants','Creating and Sending Cliniko Invoices','Current Cliniko invoice workflow','Cliniko supports invoice creation, editing, emailing, payment allocation, outstanding-invoice workflows, and logs of invoice/payment changes. Preserve the audit trail and route write-offs, unusual adjustments, funding interpretation, or disputed financial decisions to authorised practice staff.'),
    ('myob-workflows-for-virtual-assistants','GST Reports, BAS Preparation, and Review Boundaries in MYOB','Current MYOB Business GST/BAS context','Current MYOB Business documentation includes GST reports and GST return/BAS workflows. Reports can expose GST liability information and transaction detail, while the activity-statement workflow can include prior-period adjustments. The VA may prepare reports and exception evidence, but GST coding changes, prior-period treatment, declaration, and lodgement remain with authorised qualified owners.'),
    ('myob-workflows-for-virtual-assistants','MYOB Payroll, STP, Super, and Employee Admin Handoff','Current MYOB Business STP context','MYOB Business supports Single Touch Payroll reporting to the ATO and distinguishes setup/declarer responsibilities. A VA should not assume software access makes them the authorised declarer or gives authority to decide payroll, tax, super, award, or employment treatment.'),
    ('ndis-administration-fundamentals','2026 Provider Registration Changes and SIL Administration Awareness','Source freshness rule','This lesson is date-sensitive. The SIL registration change and SIL Practice Standards took effect from 1 July 2026, but provider transition pathways depend on current status. Before using this workflow, check the current NDIS Commission registration guidance and record the source date in the admin file.')
), targets as (
  select l.id,u.block_title,u.block_text
  from updates u
  join public.training_courses c on c.slug=u.course_slug
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.title=u.lesson_title
)
update public.training_lessons l
set content = l.content || jsonb_build_array(jsonb_build_object('type','callout','title',t.block_title,'text',t.block_text)),
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from targets t
where l.id=t.id
  and not exists (
    select 1 from jsonb_array_elements(l.content) b
    where b->>'type'='callout' and b->>'title'=t.block_title
  );

update public.training_courses
set content_version=content_version+1, reviewed_by='Curriculum QA', last_reviewed_at=now(), updated_at=now()
where slug in ('xero-workflows-for-virtual-assistants','servicem8-for-virtual-assistants','cliniko-for-virtual-assistants','myob-workflows-for-virtual-assistants','ndis-administration-fundamentals');
