-- Catalog-wide curriculum remediation.
-- Goals:
-- 1) make module outcomes explicit;
-- 2) add spaced retrieval at module boundaries;
-- 3) turn each specialist-course scenario into a first-class practice task;
-- 4) attach a reusable work artifact template and QA checklist;
-- 5) remove immediate duplicate scenario/exercise pairs in Foundations; and
-- 6) align the Foundations capstone to files, spreadsheet cleanup, and SOP execution.
--
-- Preserve course, module, and lesson IDs so learner progress remains intact.

-- Explicit, measurable module outcomes derived from the published lessons in each module.
with module_outcomes as (
  select
    m.id as module_id,
    jsonb_agg(
      to_jsonb(
        case
          when trim(l.summary) ~* '^learn[[:space:]]+' then
            'Explain ' || regexp_replace(regexp_replace(trim(l.summary), '[.]$', ''), '^learn[[:space:]]+', '', 'i') || '.'
          when trim(l.summary) ~* '^understand[[:space:]]+' then
            'Explain ' || regexp_replace(regexp_replace(trim(l.summary), '[.]$', ''), '^understand[[:space:]]+', '', 'i') || '.'
          else
            upper(left(regexp_replace(trim(l.summary), '[.]$', ''), 1))
            || substring(regexp_replace(trim(l.summary), '[.]$', '') from 2)
            || '.'
        end
      )
      order by l.position
    ) as outcomes
  from public.training_modules m
  join public.training_lessons l
    on l.module_id = m.id
   and l.is_published = true
  where nullif(trim(l.summary), '') is not null
  group by m.id
),
first_lessons as (
  select distinct on (m.id)
    m.id as module_id,
    l.id as lesson_id,
    mo.outcomes
  from public.training_modules m
  join module_outcomes mo on mo.module_id = m.id
  join public.training_lessons l
    on l.module_id = m.id
   and l.is_published = true
  order by m.id, l.position, l.id
)
update public.training_lessons l
set
  content = jsonb_build_array(
    jsonb_build_object(
      'type', 'heading',
      'text', 'What you should be able to do after this module'
    ),
    jsonb_build_object(
      'type', 'list',
      'items', fl.outcomes
    )
  ) || l.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from first_lessons fl
where l.id = fl.lesson_id
  and not exists (
    select 1
    from jsonb_array_elements(l.content) b
    where b->>'type' = 'heading'
      and b->>'text' = 'What you should be able to do after this module'
  );

-- Spaced retrieval: later modules start by asking the learner to recall and transfer
-- the previous module's rules before reading new material.
with ordered_modules as (
  select
    m.id,
    m.course_id,
    m.position,
    m.title,
    lag(m.title) over (partition by m.course_id order by m.position, m.id) as previous_title
  from public.training_modules m
),
first_lessons as (
  select distinct on (om.id)
    om.id as module_id,
    om.position as module_position,
    om.previous_title,
    l.id as lesson_id,
    l.title as lesson_title
  from ordered_modules om
  join public.training_lessons l
    on l.module_id = om.id
   and l.is_published = true
  where om.previous_title is not null
  order by om.id, l.position, l.id
)
update public.training_lessons l
set
  content = jsonb_build_array(
    jsonb_build_object(
      'type', 'callout',
      'title', 'Recall before you continue',
      'text', format(
        'Without looking back, name the two most important operating rules you remember from %s. Then explain how those rules should change the way you approach %s. Check your answer against the lesson only after you commit to a response.',
        fl.previous_title,
        fl.lesson_title
      )
    )
  ) || l.content,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from first_lessons fl
where l.id = fl.lesson_id
  and not exists (
    select 1
    from jsonb_array_elements(l.content) b
    where b->>'type' = 'callout'
      and b->>'title' = 'Recall before you continue'
  );

-- Foundations already has first-class practice blocks. Remove only the immediate
-- "Work output" scenarios that repeat the same task directly before the exercise.
with foundations_dedup as (
  select
    l.id,
    coalesce(
      jsonb_agg(b.block order by b.ord)
        filter (
          where not (
            b.block->>'type' = 'scenario'
            and coalesce(b.block->>'title', '') ilike 'Work output:%'
          )
        ),
      '[]'::jsonb
    ) as rebuilt
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  cross join lateral jsonb_array_elements(l.content) with ordinality b(block, ord)
  where c.slug = 'virtual-assistant-foundations'
    and l.slug in (
      'inbox-management',
      'calendar-and-meeting-coordination',
      'drive-docs-and-file-organization',
      'spreadsheets-for-va-admin-work',
      'research-and-source-verification',
      'responsible-ai-for-va-work',
      'reading-briefs-sops-and-working-independently'
    )
  group by l.id
)
update public.training_lessons l
set
  content = fd.rebuilt,
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from foundations_dedup fd
where l.id = fd.id
  and l.content <> fd.rebuilt;

-- Every published specialist/industry/software course except Executive VA gets
-- structured practice by converting the final existing scenario in each lesson
-- into an exercise. Executive VA already has a dedicated, hand-authored practical
-- migration; Foundations already uses the new block system.
with target_lessons as (
  select
    l.id,
    l.title,
    l.summary,
    l.content,
    c.slug as course_slug,
    case
      when c.slug = 'seo-virtual-assistant' then 'seo'
      when c.slug = 'customer-support-virtual-assistant' then 'support'
      when c.slug in ('operations-virtual-assistant') then 'operations'
      when c.slug = 'project-management-for-virtual-assistants' then 'project'
      when c.slug in ('real-estate-virtual-assistant', 'property-management-administration-australia') then 'property'
      when c.slug in ('medical-healthcare-virtual-assistant', 'australian-allied-health-administration', 'cliniko-for-virtual-assistants', 'ndis-administration-fundamentals') then 'healthcare'
      when c.slug in ('bookkeeping-administration', 'payroll-administration', 'australian-bookkeeping-administration', 'xero-workflows-for-virtual-assistants', 'myob-workflows-for-virtual-assistants', 'mortgage-broking-administration-australia') then 'finance'
      when c.slug in ('marketing-virtual-assistant', 'social-media-virtual-assistant') then 'marketing'
      when c.slug = 'sales-lead-generation-virtual-assistant' then 'sales'
      when c.slug = 'ecommerce-virtual-assistant' then 'ecommerce'
      when c.slug = 'airbnb-short-term-rental-virtual-assistant' then 'short_stay'
      when c.slug in ('australian-trades-administration', 'servicem8-for-virtual-assistants') then 'field_service'
      when c.slug = 'australian-va-fundamentals' then 'australia'
      else 'operations'
    end as practice_mode
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where l.is_published = true
    and c.status = 'published'
    and c.slug not in (
      'virtual-assistant-foundations',
      'executive-virtual-assistant'
    )
    and not exists (
      select 1
      from jsonb_array_elements(l.content) b
      where b->>'type' = 'exercise'
    )
),
scenario_positions as (
  select
    tl.id,
    max(b.ord) filter (where b.block->>'type' = 'scenario') as scenario_ord
  from target_lessons tl
  cross join lateral jsonb_array_elements(tl.content) with ordinality b(block, ord)
  group by tl.id
),
specs as (
  select
    tl.*,
    sp.scenario_ord,
    case tl.practice_mode
      when 'seo' then
        'Submit the finished SEO work artifact with the query, page, or issue being evaluated; dated source evidence; current state; recommended change; implementation owner; validation method; and any uncertainty that must remain visible.'
      when 'support' then
        'Submit the completed support artifact: prioritised case or ticket state, evidence checked, approved troubleshooting or policy source, customer-facing response, internal note, escalation boundary, owner, and next checkpoint.'
      when 'operations' then
        'Submit the completed operations artifact showing the process or queue, trigger, owner, control, exception, evidence, decision boundary, corrective action, and handoff. The result must improve BAU visibility rather than create project-management paperwork.'
      when 'project' then
        'Submit the completed project artifact with deliverable or milestone, owner and approver, dependencies, due date, current status, risk or issue, decision needed, change impact where relevant, and acceptance evidence.'
      when 'property' then
        'Submit the completed property or real-estate admin artifact with record/property, stage, source evidence, required administrative action, missing information, authorised/licensed decision boundary, communication, due date, and final handoff.'
      when 'healthcare' then
        'Submit the completed healthcare administration artifact using only minimum necessary information: administrative task, approved system/source, status, missing data, non-clinical action, clinical or authorised decision to route, audit note, owner, and next checkpoint.'
      when 'finance' then
        'Submit the completed finance-administration artifact with record and period, source document, amount or status where relevant, exception, approval/coding/statutory boundary, QA evidence, reviewer, and final handoff. Do not make accounting, tax, payroll, lending, or suitability judgments outside the VA role.'
      when 'marketing' then
        'Submit the completed marketing work artifact with objective, audience, source brief, asset or campaign state, approval status, evidence, metric or QA check, revision needed, owner, and handoff.'
      when 'sales' then
        'Submit the completed sales/lead-generation artifact with lead or account, source, stage, verified qualification data, next action, follow-up timing, claim/approval boundary, CRM update, owner, and evidence.'
      when 'ecommerce' then
        'Submit the completed e-commerce artifact with product/order/customer reference, source record, current status, stock or fulfilment evidence where relevant, exception, refund/price/commitment boundary, communication, QA, and handoff.'
      when 'short_stay' then
        'Submit the completed short-stay operations artifact with booking/guest/property reference, stay dates, source record, issue, approved response, maintenance or vendor action, authority boundary, owner, next checkpoint, and handoff.'
      when 'field_service' then
        'Submit the completed field-service artifact with client/job, system status, queue or schedule state, approved quote/invoice inputs where relevant, evidence, exception, customer communication, decision owner, and next checkpoint.'
      when 'australia' then
        'Submit the completed Australian VA work artifact with business context, Australian location/time zone where relevant, source evidence, terminology or administrative rule applied, action completed, approval boundary, exception, and Philippines-to-Australia handoff.'
      else
        'Submit the completed work artifact with outcome, source evidence, actions taken, exceptions, approval boundary, QA evidence, owner, and final handoff.'
    end as deliverable,
    case tl.practice_mode
      when 'seo' then format($fmt$SEO work product: %s
Page / query / issue:
Search intent:
Country / device / date range:
Source evidence + checked date:
Current state:
Finding:
Recommended change:
Implementation owner:
Assumption / uncertainty:
Validation check after implementation:
Client handoff:$fmt$, tl.title)
      when 'support' then format($fmt$Support work product: %s
Ticket / customer:
Issue:
Impact / urgency:
Account context:
Policy / knowledge-base source:
Evidence checked:
Approved steps tried:
Draft customer response:
Internal note:
Escalation / approval needed:
Owner:
Status:
Next checkpoint:$fmt$, tl.title)
      when 'operations' then format($fmt$Operations work product: %s
Process / queue:
Trigger:
Desired output:
Owner:
Input / source:
Control / QA check:
Current status:
Exception:
Impact:
Action I can take:
Decision / approval needed:
Evidence:
Next checkpoint:
Handoff:$fmt$, tl.title)
      when 'project' then format($fmt$Project work product: %s
Project / deliverable:
Success / acceptance criteria:
Owner:
Approver:
Dependency:
Milestone / due date:
Current status:
Risk:
Issue:
Decision needed:
Change impact:
Next action:
Acceptance evidence:
Handover note:$fmt$, tl.title)
      when 'property' then format($fmt$Property admin work product: %s
Property / contact:
Jurisdiction if relevant:
Stage / workflow:
Source record:
Required admin action:
Missing information:
Communication:
Deadline:
Licensed / authorised decision needed:
Evidence:
Owner:
Next checkpoint:
Handoff:$fmt$, tl.title)
      when 'healthcare' then format($fmt$Healthcare admin work product: %s
Patient / record reference:
Administrative task:
Approved system / source:
Minimum necessary information:
Current status:
Missing data:
Non-clinical action I can take:
Clinical / authorised decision to route:
Communication:
Audit note:
Owner:
Next checkpoint:$fmt$, tl.title)
      when 'finance' then format($fmt$Finance admin work product: %s
Record / transaction / employee / file:
Period / date:
Source document:
Amount / status:
System:
Exception / mismatch:
Administrative action:
Approval required:
Coding / tax / payroll / lending decision to route:
QA evidence:
Reviewer / owner:
Next checkpoint:
Handoff:$fmt$, tl.title)
      when 'marketing' then format($fmt$Marketing work product: %s
Campaign / asset:
Objective:
Audience:
Source brief:
Channel:
Current state:
Evidence / inputs:
Draft / change:
Approval status:
QA check:
Metric / reporting field:
Revision needed:
Owner:
Handoff:$fmt$, tl.title)
      when 'sales' then format($fmt$Sales / lead-gen work product: %s
Lead / account:
Source:
Stage:
Verified facts:
Missing qualification data:
Next action:
Follow-up date:
Draft outreach / note:
Claim or commitment boundary:
CRM update:
Owner:
Evidence / source:
Next checkpoint:$fmt$, tl.title)
      when 'ecommerce' then format($fmt$E-commerce work product: %s
Order / product / customer:
Source record:
Current status:
Inventory / fulfilment evidence:
Customer request:
Exception:
Price / refund / commitment boundary:
Action:
Customer communication:
QA check:
Owner:
Next checkpoint:
Handoff:$fmt$, tl.title)
      when 'short_stay' then format($fmt$Short-stay work product: %s
Booking:
Guest:
Property:
Stay dates:
Source record:
Issue / request:
Approved response:
Maintenance / vendor action:
Authority boundary:
Customer / guest communication:
Owner:
Next checkpoint:
Handoff:$fmt$, tl.title)
      when 'field_service' then format($fmt$Field-service work product: %s
Client:
Job:
System status:
Queue / schedule:
Source evidence:
Quote / invoice input:
Technician / field evidence:
Exception:
Customer communication:
Approval / decision owner:
Next action:
Next checkpoint:
Handoff:$fmt$, tl.title)
      when 'australia' then format($fmt$Australian VA work product: %s
Business / client:
Australian location / state:
Date / time zone:
Administrative task:
Source:
Australian terminology / rule applied:
Action completed:
Approval boundary:
Exception:
Evidence:
Philippines-to-Australia handoff:
Next owner / checkpoint:$fmt$, tl.title)
      else format($fmt$Work product: %s
Outcome:
Source evidence:
Current status:
Action taken:
Exception:
Approval boundary:
QA evidence:
Owner:
Next checkpoint:
Handoff:$fmt$, tl.title)
    end as template_text,
    case tl.practice_mode
      when 'seo' then jsonb_build_array(
        'The page, query, issue, country, and date context are explicit.',
        'Metrics and findings come from supplied or verified evidence rather than estimates.',
        'Search intent is separated from keyword wording.',
        'Recommendations are separated from confirmed implementation.',
        'No traffic, ranking, volume, crawl, or index result is invented.',
        'Every implemented change has a validation check.'
      )
      when 'support' then jsonb_build_array(
        'Priority reflects customer impact, urgency, account context, and policy.',
        'The response addresses the actual question instead of copying a script blindly.',
        'Approved troubleshooting or policy evidence is documented.',
        'Refunds, credits, security, privacy, or serious complaints are escalated when required.',
        'The internal note lets another agent continue without rereading the full history.',
        'Every unresolved case has an owner and next checkpoint.'
      )
      when 'operations' then jsonb_build_array(
        'The process trigger, output, owner, and control are visible.',
        'Routine variation is separated from a genuine operational exception.',
        'Data mismatches are investigated rather than silently forced to agree.',
        'The action stays inside BAU operations and delegated authority.',
        'Evidence and rollback or recovery steps are present where a change could cause harm.',
        'The handoff makes the next owner and checkpoint explicit.'
      )
      when 'project' then jsonb_build_array(
        'Scope, deliverable, and success or acceptance criteria are explicit.',
        'Dependencies and realistic capacity are visible before dates are committed.',
        'Risks are separated from issues already happening.',
        'Scope changes show impact instead of being silently absorbed.',
        'Decisions and approvals have named owners.',
        'Closeout or handover includes acceptance evidence and remaining actions.'
      )
      when 'property' then jsonb_build_array(
        'The correct property, person, workflow stage, and jurisdiction are clear.',
        'Source records are checked before changing status or communicating externally.',
        'Missing information is visible rather than guessed.',
        'Legal, tenancy, trust-account, licensed, or property-manager decisions stay with the authorised role.',
        'Deadlines and communications are documented.',
        'The next owner can continue from the record without reconstructing the history.'
      )
      when 'healthcare' then jsonb_build_array(
        'Only minimum necessary patient or health information is used.',
        'Work stays inside approved systems and administrative permissions.',
        'Clinical judgment is never made by the VA.',
        'Missing or urgent information is routed to the correct authorised person.',
        'The administrative record is factual and audit-ready.',
        'The next owner and checkpoint are explicit.'
      )
      when 'finance' then jsonb_build_array(
        'The source document, record, period, and status are identified before any change.',
        'Amounts and statuses are checked against supplied evidence.',
        'Exceptions are flagged instead of force-matched or silently corrected.',
        'Accounting, tax, payroll, lending, credit, or suitability decisions stay with authorised staff.',
        'The work leaves a reviewer-ready audit trail.',
        'Approval and next-owner responsibilities are explicit.'
      )
      when 'marketing' then jsonb_build_array(
        'The work traces back to an approved brief, objective, and audience.',
        'Claims, links, dates, offers, and brand details are checked before publishing.',
        'Draft, approved, scheduled, published, and revised states are not confused.',
        'Metrics are reported with the correct date range and definition.',
        'Feedback is converted into a specific revision rather than vague rework.',
        'The final asset and approval trail are easy to find.'
      )
      when 'sales' then jsonb_build_array(
        'Lead data comes from an identifiable source.',
        'Qualification facts are separated from assumptions.',
        'Outreach does not invent relationships, results, urgency, or customer intent.',
        'CRM stages and notes reflect what actually happened.',
        'Follow-up timing is explicit and consent or channel rules are respected.',
        'The next owner can see the exact next action.'
      )
      when 'ecommerce' then jsonb_build_array(
        'The correct order, product, customer, and source record are identified.',
        'Inventory, fulfilment, price, and status are verified before promising an outcome.',
        'Refunds, credits, pricing changes, and exceptions follow approved authority.',
        'Customer communication uses confirmed information.',
        'The system record and customer-facing message agree.',
        'The handoff includes owner and next checkpoint.'
      )
      when 'short_stay' then jsonb_build_array(
        'Booking, guest, property, dates, and source record are verified.',
        'Guest communication uses approved property and booking information.',
        'Safety, access, refund, compensation, and policy exceptions are escalated correctly.',
        'Maintenance or vendor work has a clear owner and status.',
        'No unverified promise is made to the guest.',
        'The next shift can continue from the handoff.'
      )
      when 'field_service' then jsonb_build_array(
        'Client, job, system status, and queue or schedule state are correct.',
        'Quotes, invoices, and customer promises use approved inputs only.',
        'Technician or field evidence is not treated as complete until required proof exists.',
        'Scheduling accounts for capability, geography, buffers, and existing commitments where relevant.',
        'Exceptions are routed to the correct decision owner.',
        'The system record and customer communication remain consistent.'
      )
      when 'australia' then jsonb_build_array(
        'The relevant Australian state, location, date, and time zone are explicit where needed.',
        'Australian terminology is used accurately without pretending to provide specialist advice.',
        'Daylight-saving, privacy, GST, payroll, or other context is verified when it affects the task.',
        'The VA stays inside administrative authority.',
        'Evidence and source records remain visible.',
        'The Philippines-to-Australia handoff has a clear owner and checkpoint.'
      )
      else jsonb_build_array(
        'The required outcome is explicit.',
        'Source evidence is recorded.',
        'Assumptions and exceptions are visible rather than guessed.',
        'Approval boundaries are respected.',
        'QA evidence shows how the work was checked.',
        'The handoff names the next owner and checkpoint.'
      )
    end as checklist_items
  from target_lessons tl
  join scenario_positions sp on sp.id = tl.id
  where sp.scenario_ord is not null
),
rebuilt as (
  select
    s.id,
    s.course_slug,
    s.template_text,
    s.checklist_items,
    jsonb_agg(
      case
        when b.ord = s.scenario_ord then
          b.block
          || jsonb_build_object(
            'type', 'exercise',
            'title', regexp_replace(
              coalesce(nullif(b.block->>'title', ''), 'Practice the workflow'),
              '^Work (output|product drill):[[:space:]]*',
              '',
              'i'
            ),
            'deliverable', s.deliverable
          )
        else b.block
      end
      order by b.ord
    ) as content
  from specs s
  cross join lateral jsonb_array_elements(s.content) with ordinality b(block, ord)
  group by s.id, s.course_slug, s.template_text, s.checklist_items
)
update public.training_lessons l
set
  content = r.content || jsonb_build_array(
    jsonb_build_object(
      'type', 'template',
      'title', 'Reusable work template',
      'text', r.template_text
    ),
    jsonb_build_object(
      'type', 'checklist',
      'title', 'Before you submit',
      'items', r.checklist_items
    )
  ),
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from rebuilt r
where l.id = r.id;

-- Raise course review metadata for every course touched by the catalog remediation.
update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where status = 'published';

-- Align the Foundations capstone to every major course outcome instead of testing
-- inbox/calendar/research heavily while leaving files, spreadsheet execution, and
-- SOP interpretation mostly implicit.
update public.training_assessments a
set
  instructions = $txt$Complete this fictional client simulation as one structured submission. Do not use real client data.

Scenario:
You support a small Australian services company from the Philippines. At the start of your shift you find an unrequested password-reset email, a customer asking to move tomorrow's appointment, an overdue supplier notice, a supplier meeting that the client described only as "10 AM Thursday", a small CRM sample that needs safe cleanup, conflicting versions of a client-list file, a request to find three replacement suppliers that can deliver to Sydney, and an operations brief that does not explain what to do when a same-day request arrives after the schedule is full. The client also asks whether you can use AI to draft the customer reply.

Submit these nine deliverables:
1. Inbox triage: rank the urgent messages and explain the consequence behind your order.
2. Calendar coordination: write the clarification needed before booking the supplier meeting and list the final event fields.
3. Task plan: prioritise the work for the shift with deadlines, owners, and completion evidence.
4. CRM cleanup and exception log: clean the supplied sample only where the evidence supports the change. Show before/after row counts, rules applied, and records left for review.
5. File-governance decision: identify how you would determine the source of truth among the supplied file versions, what you would archive or leave unchanged, and which permission or ownership checks come before any move or deletion.
6. Supplier research: complete a comparison structure with source, checked date, verified facts, unresolved information, and a recommendation that does not invent missing evidence.
7. Client update: write one concise status message covering what is complete, what is blocked, what decision you need, and the next checkpoint.
8. Brief/SOP interpretation: separate the routine work you can continue from the missing same-day-service decision rule, write the exact client question, and propose the SOP update you would document after the client decides.
9. Boundaries and AI: explain what you would not paste into an AI tool, what facts you would verify, and which decisions require client approval.

Pass score: 80%. Review should assess operational judgment, usable work output, evidence handling, QA, confidentiality, authority boundaries, communication, and whether another person could continue from the learner's records. A reviewer may request one revision when the work is useful but misses an important risk, decision boundary, or requested deliverable.$txt$,
  resource_pack = a.resource_pack || jsonb_build_array(
    jsonb_build_object(
      'id', 'files',
      'kind', 'brief',
      'title', 'Conflicting client-list files',
      'content', 'Client List.xlsx\nClient List NEW.xlsx\nClient List FINAL.xlsx\nClient List use this one.xlsx\n\nYou do not yet know which file is authoritative. One file is shared externally and ownership may sit in a former staff account. Do not rename, move, delete, transfer, or broaden access until the source of truth and permissions are verified.'
    ),
    jsonb_build_object(
      'id', 'sop-gap',
      'kind', 'policy',
      'title', 'Service-booking SOP gap',
      'content', 'Normal process: log the enquiry, create the job, schedule inside approved availability, and send the confirmation. Missing rule: the SOP does not say what to do when a customer requests same-day service after the schedule is full. The VA may continue routine intake but must not invent an overbooking, overtime, pricing, or priority rule.'
    )
  ),
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'virtual-assistant-foundations'
  and a.is_published = true
  and a.assessment_type = 'practical'
  and a.instructions not like '%Submit these nine deliverables:%';
