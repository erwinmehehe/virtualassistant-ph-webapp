-- Refresh NDIS Administration Fundamentals against current 2026 official
-- NDIA / NDIS Commission guidance and prepare the draft course for specialist
-- review. The course remains unpublished until the specialist gate is satisfied.

update public.training_lessons
set
  title = '2026 NDIS Registration Changes, SIL, and Digital Platform Awareness',
  summary = 'From 1 July 2026, supported independent living and NDIS digital platform services moved into mandatory registration settings with distinct registration groups and transition pathways. A VA can track evidence, dates, and status but cannot decide whether a provider is compliant or which registration pathway applies.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Recognize the current 2026 mandatory-registration changes affecting SIL and NDIS digital platforms",
        "Understand the difference between registration status tracking and compliance judgment",
        "Know which registration questions must go to the provider's responsible compliance owner"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"From 1 July 2026, supported independent living and NDIS digital platform services are subject to mandatory-registration reforms. Supported independent living uses registration group 0138 Assistance with supported independent living, while NDIS digital platform services use registration group 0137 Providing a NDIS digital platform service. Transition pathways differ depending on the provider's existing registration status and whether the provider was already operating before the change."
    },
    {
      "type":"heading",
      "text":"Current 2026 context"
    },
    {
      "type":"list",
      "items":[
        "Supported independent living providers must follow the new SIL registration and Practice Standards framework from 1 July 2026.",
        "Registration group 0138 is the current class for Assistance with supported independent living.",
        "Registration group 0137 is the current class for Providing a NDIS digital platform service.",
        "Existing providers can have transition pathways that differ from new providers, so a VA should never infer status from an old certificate, an application receipt, or a website claim.",
        "Mandatory registration reform for support coordination was identified separately but is currently paused.",
        "A submitted application is not the same as an approved registration decision."
      ]
    },
    {
      "type":"heading",
      "text":"A practical admin workflow"
    },
    {
      "type":"steps",
      "items":[
        "Record the provider's confirmed service scope and current registration status exactly as supplied by the authorised compliance owner.",
        "Record the relevant registration group only from the provider's current certificate, Commission notice, or approved compliance source.",
        "Maintain the approved compliance calendar for audit, renewal, transition, evidence, and response deadlines.",
        "Track documents requested by the provider's compliance owner or Approved Quality Auditor without interpreting whether the evidence is sufficient.",
        "Keep application submitted, audit underway, decision pending, approved, varied, and renewed as separate statuses.",
        "Escalate any uncertainty about registration group, transition pathway, audit scope, Practice Standards, worker screening, or provider eligibility.",
        "Do not update public marketing claims such as registered, approved, compliant, certified, or accredited unless the responsible owner has approved the exact wording."
      ]
    },
    {
      "type":"callout",
      "title":"Tracking is not compliance advice",
      "text":"A VA may maintain the evidence register, due dates, certificate records, audit tasks, and status log. The VA does not decide whether a provider must register, whether a transition pathway applies, whether the provider meets the Practice Standards, or whether an audit outcome is sufficient."
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Treating an application receipt as proof of registration",
        "Using the old 0115 label as if it automatically proves current SIL registration",
        "Assuming every support-coordination provider is now under mandatory registration",
        "Calling a course, worker, or provider NDIS certified without an authoritative basis",
        "Copying old registration wording into a website or proposal",
        "Giving a participant or worker a legal interpretation of the registration rules"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"An Australian provider says it has applied under the new SIL rules and asks you to change its website to say fully registered under 0138 before the Commission has made a decision. At the same time, an old spreadsheet still lists 0115. Explain the status checks, records you update, public wording you do not change, and the compliance handoff."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Use current Commission evidence.",
        "Track status precisely.",
        "Do not turn pending into approved.",
        "Keep registration interpretation with the responsible specialist."
      ]
    }
  ]$$::jsonb,
  content_version = content_version + 1,
  updated_at = now()
where slug = '2026-provider-registration-changes-and-sil-administration-awareness'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'ndis-administration-fundamentals'
    )
  );

update public.training_lessons
set
  summary = 'NDIS service agreements help participants and providers record what supports will be delivered, how, at what cost, and under which responsibilities and change processes. Written agreements are recommended in most cases and mandatory for SDA, while substantive terms and price changes stay with authorised people.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Coordinate NDIS service-agreement administration without negotiating terms",
        "Track versions, signatures, review dates, and participant-requested changes",
        "Recognize when pricing changes require participant agreement before records are updated"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"A service agreement is a signed agreement between a participant and provider that helps both sides understand what NDIS supports will be delivered and how. Current NDIS guidance recommends written service agreements in most provider relationships, while written agreements are mandatory for specialist disability accommodation. The agreement can cover supports, prices, travel and other fees, payment arrangements, cancellation rules, responsibilities, changes, and complaint pathways."
    },
    {
      "type":"heading",
      "text":"Core ideas"
    },
    {
      "type":"list",
      "items":[
        "The participant should be able to understand the agreement and suggest changes before signing.",
        "A new provider, materially different supports, or a new plan can trigger a need to review or replace the agreement.",
        "Current 2026 NDIS pricing guidance says proposed changes to existing service-agreement prices must be discussed with participants and agreed before the changes are made.",
        "The provider's approved template and authorised staff should control substantive terms.",
        "A VA can coordinate versions and signatures but should not interpret legal meaning or pressure a participant to accept terms."
      ]
    },
    {
      "type":"heading",
      "text":"A practical workflow"
    },
    {
      "type":"steps",
      "items":[
        "Start from the provider's current approved agreement template.",
        "Populate only verified participant, provider, support, contact, and administrative facts.",
        "Track draft, sent, participant questions, requested changes, approved changes, signed, review, expiry, and ended status separately.",
        "Preserve each material version instead of overwriting the previous draft.",
        "Route changes to price, cancellation, travel, fees, service scope, notice period, responsibilities, or complaint terms to the authorised owner.",
        "For proposed price changes, do not update the live agreement or billing setup until the provider confirms that the participant has agreed.",
        "Store the executed agreement in the approved source system and create the next review task."
      ]
    },
    {
      "type":"callout",
      "title":"Coordinate, do not negotiate",
      "text":"Do not explain legal meaning, decide whether a term is fair or compliant, negotiate support prices, tell a participant they must sign, or accept substantive changes on behalf of the provider unless you hold the required authority outside the VA role."
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Treating silence as agreement to a price change",
        "Editing cancellation or travel terms directly from an email without approval",
        "Losing the previous signed version",
        "Using an old agreement after the participant's supports materially changed",
        "Calling written agreements mandatory for every NDIS support",
        "Explaining contract meaning as if you were giving legal advice"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"A provider wants to apply its new 2026 price to an existing participant immediately. The participant's current signed agreement lists the old price, and no record shows they have agreed to the change. Explain what the VA can prepare, what must not be changed yet, and what evidence is needed before the billing setup is updated."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Use the current approved template.",
        "Preserve versions and participant agreement evidence.",
        "Do not change substantive terms from your own judgment.",
        "Keep negotiation and legal interpretation with authorised people."
      ]
    }
  ]$$::jsonb,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'service-agreements-and-administrative-change-tracking'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'ndis-administration-fundamentals'
    )
  );

update public.training_lessons
set
  summary = 'The NDIS pricing schedule effective 1 July 2026 is the current starting point for support-item and price administration. A VA can prepare billing from approved evidence but cannot decide support-item eligibility, cancellation billability, travel treatment, or pricing exceptions.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Use the current 2026 NDIS pricing schedule as an administrative reference",
        "Prepare pricing and billing exceptions from evidence rather than memory",
        "Escalate support-item, cancellation, travel, and other billability questions"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"The NDIS pricing schedule effective 1 July 2026 sets out current support-item information and price guidance, including support item numbers, names, units, and national, remote, and very remote pricing information. Billing can also depend on the participant's agreement, actual support delivered, location, management pathway, and the conditions attached to the support. A VA should never turn a similar-sounding item or old price into a claim just because the system accepts it."
    },
    {
      "type":"heading",
      "text":"Core ideas"
    },
    {
      "type":"list",
      "items":[
        "Use the provider's approved copy of the current NDIS pricing schedule and support catalogue, not a saved spreadsheet from a previous year.",
        "Proposed price changes to existing service agreements need participant agreement before they are made.",
        "Cancellation, provider travel, non-face-to-face work, group supports, remote loading, and other billing situations can have conditions that vary by support.",
        "A system validation or available support item is not proof that a claim is appropriate.",
        "The billing record should point back to the agreement, support evidence, and authorised pricing decision."
      ]
    },
    {
      "type":"heading",
      "text":"A practical exception workflow"
    },
    {
      "type":"steps",
      "items":[
        "Confirm the participant, support date, delivered or cancelled status, location, and management pathway.",
        "Confirm the provider's current approved support item and price source.",
        "Check the participant's current agreement and any approved price-change evidence.",
        "Link the roster, support log, case note, attendance, travel, cancellation, or other source evidence required by the provider's process.",
        "Prepare the invoice or claim fields only when the approved rule is clear.",
        "Put unclear support items, price differences, cancellation charges, travel, duplicate claims, unusual quantities, or rejected claims into an exception queue.",
        "Record the authorised reviewer decision before resubmitting or changing the billing record."
      ]
    },
    {
      "type":"callout",
      "title":"Do not make the claim fit",
      "text":"Do not swap support items, change support evidence, alter dates or quantities, reuse an old price, or add travel or cancellation charges simply to make a rejected or uncertain claim pass."
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Using the 2025-26 price when a 2026-27 source applies",
        "Changing the participant's agreed price without recorded agreement",
        "Assuming every short-notice cancellation is billable",
        "Adding travel because another participant was charged travel",
        "Choosing a nearby support item after a rejection",
        "Treating an internal billing spreadsheet as the official source"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"A provider's billing sheet uses an older price. The current 2026 schedule is different, the participant's agreement still lists the older amount, and a manager asks you to update the invoice immediately. Explain the source checks, participant-agreement issue, exception record, and reviewer handoff before any amount is changed."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Use current sources.",
        "Tie billing to evidence and agreement.",
        "Do not guess billability.",
        "Record the authorised decision."
      ]
    }
  ]$$::jsonb,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'pricing-cancellations-travel-and-billing-exceptions'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'ndis-administration-fundamentals'
    )
  );

update public.training_lessons
set
  summary = 'NDIS providers need effective incident and complaint processes. Registered providers must notify the NDIS Commission of reportable incidents within strict timeframes, so a VA who receives a safety allegation must preserve the facts and escalate immediately rather than trying to decide the case.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will learn"
    },
    {
      "type":"list",
      "items":[
        "Recognize when a message belongs in the provider's urgent incident or complaint process",
        "Understand the current 24-hour and 5-business-day reportable-incident timing context",
        "Preserve the participant's words and evidence without investigating or suppressing the complaint"
      ]
    },
    {
      "type":"heading",
      "text":"Why this matters"
    },
    {
      "type":"paragraph",
      "text":"Registered NDIS providers must notify the NDIS Commission of reportable incidents. Most reportable incident categories require notification within 24 hours of the registered provider becoming aware, followed by further information within 5 business days. Unauthorised restrictive practice has a different 5-business-day pathway unless harm occurred, in which case the 24-hour timeframe can apply. A VA should not decide reportability, but delay at the administrative layer can put the provider and participant at risk."
    },
    {
      "type":"heading",
      "text":"High-risk categories to escalate immediately"
    },
    {
      "type":"list",
      "items":[
        "Death or serious injury of a person with disability connected with NDIS supports or services",
        "Abuse or neglect",
        "Unlawful sexual or physical contact or assault",
        "Sexual misconduct or grooming",
        "Alleged or actual unauthorised restrictive practice",
        "Any participant message suggesting immediate safety risk, exploitation, serious service failure, or urgent safeguarding concern",
        "Privacy incidents or complaints that the provider's policy marks urgent"
      ]
    },
    {
      "type":"heading",
      "text":"A practical response workflow"
    },
    {
      "type":"steps",
      "items":[
        "Preserve the participant or reporter's wording as accurately as possible.",
        "Record the time received, channel, people identified, and only the facts known at that point.",
        "Use the provider's urgent escalation route immediately rather than waiting for the normal admin queue.",
        "Tell the responsible key personnel or incident owner that the timing of awareness may matter for Commission reporting.",
        "Do not decide whether the matter is legally reportable; give the responsible owner the facts needed to make that determination.",
        "Do not interview witnesses, coach anyone's account, promise confidentiality you cannot provide, or promise an outcome.",
        "Secure related records and restrict access to the people who need them.",
        "Keep the incident or complaint task open until the authorised owner confirms the next action."
      ]
    },
    {
      "type":"callout",
      "title":"Escalate first, classify second",
      "text":"The VA's job is to make sure a serious allegation does not sit in an inbox. Immediate escalation protects the participant and gives the provider's authorised people time to assess safety, reportability, required notifications, and next steps."
    },
    {
      "type":"heading",
      "text":"Complaint handling"
    },
    {
      "type":"list",
      "items":[
        "Do not discourage a participant from complaining or make service consequences conditional on withdrawing a complaint.",
        "Acknowledge the concern according to the provider's approved process.",
        "Keep the complaint accessible, respectful, and documented.",
        "Do not rewrite the participant's wording to make the provider look better.",
        "Keep complaint resolution decisions with the provider's authorised complaint owner."
      ]
    },
    {
      "type":"heading",
      "text":"Common mistakes"
    },
    {
      "type":"list",
      "items":[
        "Waiting until the next business day because the VA is unsure whether the event is reportable",
        "Trying to investigate the allegation in chat",
        "Calling an incident non-reportable before key personnel review it",
        "Editing a participant's wording to sound less serious",
        "Sharing incident details with the whole team",
        "Arguing with the participant about whether the complaint is fair"
      ]
    },
    {
      "type":"scenario",
      "title":"Practice scenario",
      "text":"At 4:40 pm, a participant messages the VA saying a worker physically handled them in a way that made them feel unsafe. The worker has already finished the shift. Explain the immediate administrative actions, what timing information you preserve, who receives the escalation, and what you do not investigate or decide."
    },
    {
      "type":"heading",
      "text":"Before you move on"
    },
    {
      "type":"list",
      "items":[
        "Safety outranks inbox order.",
        "Preserve facts and timing.",
        "Escalate immediately.",
        "Do not decide reportability or investigate independently."
      ]
    }
  ]$$::jsonb,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'complaints-incidents-safeguarding-and-escalation'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id
      from public.training_courses
      where slug = 'ndis-administration-fundamentals'
    )
  );

-- Editorially review all lessons while keeping the course itself draft. Lessons
-- can be marked ready because draft courses are not returned to learners.
update public.training_lessons
set
  is_published = true,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  updated_at = now()
where module_id in (
  select id
  from public.training_modules
  where course_id = (
    select id
    from public.training_courses
    where slug = 'ndis-administration-fundamentals'
  )
);

update public.training_assessments
set
  instructions = 'Complete an NDIS provider administration simulation covering participant privacy and authority, service-agreement version control, 2026 price-change evidence, support-delivery records, funding-management pathways, claim and billing exceptions, current SIL and digital-platform registration awareness, complaints, incident escalation, and provider QA. Prioritise participant safety, preserve source evidence, and identify the correct owner for every decision. Do not provide funding, legal, clinical, support-planning, pricing, registration, incident-reportability, restrictive-practice, or compliance advice. The work product must distinguish routine administration from decisions that require the provider''s authorised specialist.',
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (
  select id
  from public.training_courses
  where slug = 'ndis-administration-fundamentals'
);

update public.training_courses
set
  summary = 'Administrative training for Filipino VAs supporting Australian NDIS providers, covering participant records, service agreements, support evidence, payment pathways, 2026 pricing administration, SIL and digital-platform registration awareness, complaints, incident escalation, and provider QA.',
  review_requirement = 'specialist',
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  specialist_reviewed_by = null,
  specialist_reviewer_role = null,
  specialist_review_notes = null,
  specialist_reviewed_at = null,
  status = 'draft',
  published_at = null,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'ndis-administration-fundamentals';

-- Any existing specialist work is stale after this substantive curriculum edit.
-- Preserve the assignment itself, but move it onto a new review revision so a
-- specialist must explicitly refresh and review the current course.
update public.training_specialist_reviews review
set
  reviewer_name = null,
  reviewer_role = null,
  checklist = '{}'::jsonb,
  notes = null,
  decision = 'in_progress',
  reviewed_at = null,
  review_revision = review.review_revision + 1,
  assigned_revision = null,
  updated_at = now()
where review.course_id = (
  select id
  from public.training_courses
  where slug = 'ndis-administration-fundamentals'
);

insert into public.training_specialist_review_events (
  course_id,
  event_type,
  actor_label,
  reviewer_name,
  reviewer_role,
  review_due_date,
  review_revision,
  assigned_revision,
  course_content_version,
  checklist,
  notes,
  created_at
)
select
  course.id,
  'invalidated',
  'Curriculum migration',
  review.assigned_reviewer_name,
  review.assigned_reviewer_role,
  review.review_due_date,
  review.review_revision,
  review.assigned_revision,
  course.content_version,
  '{}'::jsonb,
  'NDIS curriculum refreshed against current 2026 registration, pricing, service-agreement, complaint, and incident guidance. A fresh specialist review is required.',
  now()
from public.training_courses course
join public.training_specialist_reviews review on review.course_id = course.id
where course.slug = 'ndis-administration-fundamentals';
