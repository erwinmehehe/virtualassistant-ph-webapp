-- Write the existing Sales & Lead Generation Virtual Assistant course.
-- Course remains draft-only until reviewer metadata and explicit publication are recorded.

update public.training_courses
set
  summary = 'A practical sales-support course for Virtual Assistants covering ICPs, ethical lead research, prospect lists, CRM hygiene, outreach preparation, reply triage, qualification support, appointment setting, pipeline operations, reporting, and sensitive sales escalations.',
  estimated_minutes = 300,
  status = 'draft',
  published_at = null,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '20000000-0000-4000-8000-000000000007';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Sales support starts with knowing who the business is trying to reach"},{"type":"paragraph","text":"A Sales & Lead Generation Virtual Assistant supports the front of the sales process: researching prospects, keeping records clean, preparing outreach, helping schedule calls, tracking replies, and handing qualified opportunities to the right salesperson. The goal is not to contact the most people. The goal is to help the business find, engage, and track the right people responsibly."},{"type":"heading","text":"Understand the funnel"},{"type":"list","items":["Prospect: a person or company that may fit the target market.","Lead: a prospect that has entered the business’s tracking or outreach process.","Qualified lead: a lead that meets the client’s defined criteria for fit, need, timing, authority, or another agreed standard.","Opportunity: a qualified sales conversation with a defined commercial next step.","Customer: a prospect that has completed the agreed purchase or contract step."]},{"type":"heading","text":"Build an ICP from explicit criteria"},{"type":"paragraph","text":"An ideal customer profile, or ICP, describes the type of company or buyer the client wants to prioritise. It should be based on real criteria such as industry, size, geography, use case, technology, buying trigger, or business model. Do not invent a prospect’s needs just because they look similar to an existing customer."},{"type":"list","items":["Industry or business type","Company size or team size","Location or service area","Typical problem or use case","Relevant tools or systems","Budget or commercial fit when known","Buying trigger","Disqualifiers"]},{"type":"callout","title":"Fit is not intent","text":"A company can match the ICP perfectly and still have no current interest. Keep firmographic fit, engagement, and sales intent as separate signals."},{"type":"scenario","title":"Define the target list","text":"A client sells bookkeeping support to Australian trades businesses with 5–30 staff. Create the fields you would use to identify likely-fit companies without inventing revenue, pain points, or buying intent that you cannot verify."},{"type":"heading","text":"Key takeaway"},{"type":"paragraph","text":"Good lead generation begins with a clear target definition and honest evidence. A clean funnel is more valuable than a large list full of people who were never suitable prospects."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000011';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Lead research must be accurate, lawful, and respectful of the client’s rules"},{"type":"paragraph","text":"A VA may research business websites, public directories, company pages, approved data tools, existing CRM records, and other sources the client has authorised. The fact that data is technically accessible does not automatically mean it should be collected, copied, or used in every outreach workflow."},{"type":"heading","text":"Research standards"},{"type":"list","items":["Use sources the client has approved.","Record the source when the data may need verification later.","Prefer business-relevant information over unnecessary personal details.","Do not bypass paywalls, authentication, access controls, or platform restrictions.","Do not fabricate email addresses, titles, company facts, or intent signals.","Do not keep stale or obviously incorrect data just to increase list size.","Respect opt-out, suppression, and do-not-contact rules in the client’s system."]},{"type":"heading","text":"Data-quality checks"},{"type":"steps","items":["Confirm the company is still operating.","Confirm the prospect matches the target geography or market.","Verify the person’s current role when role matters.","Check for an existing CRM record before creating another one.","Separate confirmed facts from inferred attributes.","Mark uncertain data for review rather than treating it as verified."]},{"type":"callout","title":"Do not make outreach deceptive","text":"Do not pretend you personally know the prospect, claim to have read material you did not review, or imply an existing relationship that does not exist."},{"type":"scenario","title":"Conflicting sources","text":"A company website lists one operations manager, LinkedIn shows another person with the same title, and the CRM already contains a third contact from last year. Explain how you would verify the current contact before adding or replacing records."},{"type":"heading","text":"Ethical lead generation protects the client too"},{"type":"paragraph","text":"Poor data and aggressive outreach damage deliverability, brand reputation, and CRM trust. Responsible list building is part of sales quality, not an obstacle to growth."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000012';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Prospect research should answer specific sales questions"},{"type":"paragraph","text":"The purpose of research is to determine whether a prospect fits the client’s criteria and to collect enough verified context for the next sales action. Random facts do not improve a list unless they help qualification, prioritisation, or relevant outreach."},{"type":"heading","text":"Common research fields"},{"type":"list","items":["Company name and website","Location","Industry or category","Company size when verifiable","Relevant decision-maker or role","Business email or approved contact route","Existing relationship or CRM history","Source URL","Relevant trigger or context","Verification date"]},{"type":"heading","text":"Work from a defined list brief"},{"type":"steps","items":["Read the ICP and exclusions.","Define mandatory versus optional fields.","Define acceptable sources.","Set the verification standard.","Check the CRM before adding a record.","Research in batches using consistent criteria.","Review a sample before scaling the list."]},{"type":"callout","title":"Do not optimise for row count","text":"A list of 500 weak records creates more cleanup and worse outreach than 100 well-researched prospects that actually fit the client’s market."},{"type":"scenario","title":"Build a 50-company list","text":"The client asks for 50 software companies in Sydney with 20–100 staff and an operations leader. Write the research specification you would confirm before starting, including how to handle companies where staff count or contact role cannot be verified."},{"type":"heading","text":"Handoff quality"},{"type":"paragraph","text":"A usable prospect list should make it easy for the salesperson to understand why the account was included, what was verified, and what still needs research."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000021';

update public.training_lessons
set
  content = '[{"type":"heading","text":"CRM hygiene protects the sales process from duplicate reality"},{"type":"paragraph","text":"Sales teams lose time when the same person appears several times, old records remain active, or enrichment overwrites better data. Treat the CRM as an operational source of truth rather than a dumping ground for every piece of information you find."},{"type":"heading","text":"Deduplication checks"},{"type":"list","items":["Exact email match","Company domain","Phone number","Person name plus company","Existing account relationship","Former versus current employer","Parent versus subsidiary company"]},{"type":"heading","text":"Enrichment should add confidence, not overwrite it"},{"type":"steps","items":["Check which fields already exist.","Compare the new source with the current record.","Keep the more authoritative or recent value.","Preserve useful history where the CRM supports it.","Record the source or verification date when needed.","Flag conflicts for review rather than choosing randomly."]},{"type":"heading","text":"Status hygiene"},{"type":"list","items":["Do not leave departed employees as active decision-makers.","Do not re-open opted-out contacts because a new email was found.","Do not mark a lead qualified merely because information is complete.","Do not delete history that explains why an account was disqualified.","Do not move a deal stage just to make pipeline reports look healthier."]},{"type":"callout","title":"Clean data can still be wrong data","text":"Formatting every field perfectly does not help if the record belongs to the wrong company or the contact left two years ago."},{"type":"scenario","title":"Three versions of one prospect","text":"The CRM contains three contacts that appear to be the same person: one Gmail address, one company email at a previous employer, and one new company email. Explain how you would investigate, merge, archive, or preserve history without losing useful context."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000022';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Personalisation should come from real relevance"},{"type":"paragraph","text":"Outreach works better when it connects the client’s offer to something genuinely relevant about the prospect. Personalisation does not mean inserting a first name into a generic template or inventing a compliment."},{"type":"heading","text":"Build an outreach brief"},{"type":"list","items":["Who the target is","Why this segment matters","Offer or problem the client addresses","Approved proof points","Allowed claims","Tone","Call to action","Exclusions or claims to avoid","Personalisation fields","Opt-out or compliance instructions"]},{"type":"heading","text":"Good personalisation sources"},{"type":"list","items":["A recent company announcement","A role responsibility shown on the company site","A relevant product or service page","A genuine hiring or expansion signal","A known tool or workflow relevant to the offer","A previous interaction already recorded in the CRM"]},{"type":"callout","title":"Personalisation must be true","text":"Do not say ''I loved your recent article'' if you did not read it. Do not claim a shared connection that does not exist. Deceptive familiarity can damage the client’s reputation."},{"type":"scenario","title":"Research-to-message handoff","text":"You found a prospect whose company just opened a second location and is hiring operations staff. Write the short research note a salesperson could use to decide whether that context is relevant to the client’s service without pretending the prospect has a specific problem."},{"type":"heading","text":"VA boundary"},{"type":"paragraph","text":"If the client has not authorised you to send outreach directly, prepare the research, drafts, and sequence inputs for approval instead of assuming that list access includes sending authority."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000031';

update public.training_lessons
set
  content = '[{"type":"heading","text":"A sequence is a planned follow-up system"},{"type":"paragraph","text":"Sales follow-up should be deliberate. A sequence defines timing, channels, message purpose, stop conditions, and ownership. It should not continue blindly after a prospect replies, opts out, becomes a customer, or clearly does not fit."},{"type":"heading","text":"Sequence controls"},{"type":"list","items":["Entry criteria","Message timing","Approved channels","Message goal at each step","Personalisation requirements","Maximum follow-ups","Stop conditions","Owner for replies","Suppression rules"]},{"type":"heading","text":"Reply triage"},{"type":"steps","items":["Read the reply in context.","Classify the response accurately.","Stop automation when the reply requires human handling.","Record the message and next action.","Route to the correct owner.","Set a follow-up date when needed."]},{"type":"heading","text":"Useful reply categories"},{"type":"list","items":["Interested","Not now","Not a fit","Referral to another person","Question","Objection","Unsubscribe or do not contact","Out of office","Wrong contact","Complaint or sensitive response"]},{"type":"callout","title":"Never continue automation after a clear opt-out","text":"Suppression and do-not-contact handling are basic operational controls. A VA should not re-add the person through another list simply because a different data source exists."},{"type":"scenario","title":"Sequence reply queue","text":"You receive five replies: ''send pricing'', ''not interested'', an out-of-office with a return date, ''talk to our CFO'', and ''remove me from your list''. Show the correct CRM action, sequence action, owner, and follow-up for each."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000032';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Qualification supports the salesperson; it does not replace sales judgment"},{"type":"paragraph","text":"A VA can collect qualification information using the client’s approved questions and criteria. The goal is to determine whether the prospect meets the minimum conditions for the next sales step, not to pressure the prospect or invent a business case."},{"type":"heading","text":"Possible qualification dimensions"},{"type":"list","items":["Relevant problem or use case","Company or team fit","Current process or tool","Timing","Decision process","Required location or service area","Minimum budget or commercial threshold when the client has defined one","Authority or stakeholder role"]},{"type":"heading","text":"Use only approved questions"},{"type":"paragraph","text":"If the client has a discovery form or qualification script, follow it. Do not ask for sensitive or unnecessary information just because it might be interesting."},{"type":"heading","text":"Know the boundary"},{"type":"list","items":["Do not negotiate commercial terms unless authorised.","Do not promise product capabilities, discounts, implementation dates, or results you cannot verify.","Do not mark a prospect qualified solely because they agreed to a meeting.","Do not reject a lead based on personal assumptions outside the client’s criteria.","Do not conceal information that could materially affect fit."]},{"type":"callout","title":"Qualification is evidence-based","text":"The question is whether the prospect meets the agreed criteria, not whether the VA personally believes they are likely to buy."},{"type":"scenario","title":"Discovery handoff","text":"A prospect confirms they have the relevant problem and want to review options next month, but they are not the budget owner. Prepare the CRM qualification note and identify what the salesperson still needs to learn."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000041';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Appointment setting is a conversion workflow"},{"type":"paragraph","text":"Booking a call is not finished when a calendar event exists. The prospect needs the correct time, context, meeting link, expectations, and a simple way to reschedule when allowed. The sales team needs the qualification context before the meeting starts."},{"type":"heading","text":"Booking checklist"},{"type":"steps","items":["Confirm the prospect and meeting purpose.","Use the salesperson’s approved availability.","Confirm time zone.","Create the event with the correct attendees and meeting link.","Add useful context or CRM link for the sales owner.","Send the approved confirmation.","Schedule reminders if the workflow includes them.","Record the booked stage in the CRM."]},{"type":"heading","text":"Reduce avoidable no-shows"},{"type":"list","items":["Make the purpose of the meeting clear.","Avoid overly long delays between interest and booking when availability allows.","Send confirmation immediately.","Use reminders at the approved intervals.","Include a reschedule route.","Make sure the meeting link actually works.","Do not hide the expected duration."]},{"type":"callout","title":"Do not overbook to hit a metric","text":"A calendar full of low-fit or duplicate meetings wastes sales capacity. Booking quality matters as much as booking count."},{"type":"scenario","title":"Prospect misses the call","text":"A qualified prospect does not attend a scheduled discovery call. Write the no-show workflow: CRM update, follow-up timing, rebooking message, and when to stop chasing based on the client’s rules."},{"type":"heading","text":"Meeting handoff"},{"type":"paragraph","text":"The salesperson should be able to open the record and quickly see why the call was booked, what the prospect said, what they care about, and any unresolved question."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000042';

update public.training_lessons
set
  content = '[{"type":"heading","text":"The CRM should show what happened and what happens next"},{"type":"paragraph","text":"A sales pipeline is only useful when stage, notes, tasks, ownership, and next action reflect the real opportunity. A VA often becomes the person who keeps that operating discipline consistent."},{"type":"heading","text":"A strong CRM note includes"},{"type":"list","items":["Verified contact and company","Source","Reason for outreach or inbound enquiry","Relevant qualification facts","What was sent or discussed","Prospect response","Current stage","Next action","Owner","Due date"]},{"type":"heading","text":"Stage discipline"},{"type":"steps","items":["Use the client’s stage definitions.","Move the record only when the stage condition is met.","Create the next task before leaving the record.","Preserve disqualification reason when relevant.","Do not reopen dead opportunities just to increase pipeline volume.","Keep closed-won and closed-lost outcomes accurate."]},{"type":"callout","title":"A stage is not a mood","text":"Do not move an opportunity from ''qualified'' to ''proposal'' because the salesperson feels positive. The proposal stage should mean the agreed condition for that stage has actually happened."},{"type":"scenario","title":"Messy opportunity record","text":"A record is in ''proposal sent'', but the notes show the prospect only requested a discovery call. No owner is assigned and there is no next task. Explain how you would correct the operational record without inventing sales activity."},{"type":"heading","text":"Handoffs matter at every stage"},{"type":"paragraph","text":"When ownership moves from lead-gen VA to setter to salesperson to account manager, each handoff should carry enough context that the prospect does not need to start over."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000051';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Activity metrics and outcome metrics are different"},{"type":"paragraph","text":"Sales support often tracks list size, contacts added, emails sent, replies, meetings booked, qualified opportunities, proposals, and wins. High activity can be useful, but it does not automatically mean the sales system is working well."},{"type":"heading","text":"Useful funnel metrics"},{"type":"list","items":["Prospects researched","Valid contacts","Outreach sent","Reply rate","Positive reply rate","Qualified lead rate","Meeting booked rate","Show rate","Opportunity creation rate","Proposal rate","Win rate","Time between stages"]},{"type":"heading","text":"Define the denominator"},{"type":"paragraph","text":"A 20% booking rate means nothing unless everyone knows whether it is bookings divided by all leads, contacted leads, replies, or qualified leads. Keep metric definitions stable."},{"type":"heading","text":"Report quality alongside volume"},{"type":"list","items":["Bounce or invalid-contact rate","Duplicate-record rate","Opt-out rate","No-show rate","Disqualification reasons","Stale opportunities","Missing next actions","Source-level performance"]},{"type":"callout","title":"Do not game the funnel","text":"Moving unqualified leads forward can make a dashboard look better temporarily while making sales efficiency worse."},{"type":"scenario","title":"Weekly funnel report","text":"Outreach volume rose 40%, reply rate fell from 12% to 6%, meetings stayed flat, and invalid contacts doubled. Write the short operations summary and identify what should be investigated before sending more outreach."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000052';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Some replies need a salesperson, manager, or specialist"},{"type":"paragraph","text":"A VA can triage routine sales responses, but sensitive objections, complaints, legal or privacy concerns, pricing exceptions, and high-value negotiations may require another owner. The job is to recognise the boundary and preserve the context."},{"type":"heading","text":"Escalate when"},{"type":"list","items":["The prospect asks for pricing or contract terms outside the approved range.","The reply alleges spam, misuse of data, or a privacy concern.","The prospect threatens legal or regulatory action.","The prospect raises a technical requirement you cannot verify.","A strategic account asks for executive involvement.","The prospect disputes a prior promise.","A negotiation needs authority you do not have."]},{"type":"heading","text":"Handle objections without inventing answers"},{"type":"steps","items":["Acknowledge the question.","Check the approved response library.","Answer only what is verified and authorised.","Record the objection accurately.","Escalate unresolved commercial or technical questions.","Set the next follow-up or owner."]},{"type":"callout","title":"Do not debate an opt-out","text":"If someone clearly asks not to be contacted, apply the client’s suppression process. The goal is not to win the argument."},{"type":"scenario","title":"Sensitive prospect reply","text":"A prospect says, ''Where did you get my details? Remove me immediately.'' Write the operational steps you would take in the CRM and sequence, and describe what should be escalated if the client’s process does not explain how to answer the source question."},{"type":"heading","text":"Preserve tone and evidence"},{"type":"paragraph","text":"Do not paraphrase a sensitive objection so aggressively that the meaning changes. Record the original message or link to it, add a neutral summary, and route it to the right owner."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000061';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Final composite sales and lead-generation simulation"},{"type":"paragraph","text":"This simulation combines ICP use, prospect research, CRM hygiene, outreach preparation, reply triage, qualification, appointment setting, reporting, and escalation. The company and prospects are fictional and based on common sales-support patterns rather than any single client."},{"type":"scenario","title":"Harborline Growth Partners","text":"Harborline Growth Partners sells operational consulting to service businesses. The CRM contains 120 target accounts, but 18 are duplicates, 14 have contacts who changed companies, and 9 were previously marked do-not-contact. A new list of 60 prospects has been imported without sources. Twelve outreach replies arrive today: four interested, two referrals, three not interested, one opt-out, one pricing objection, and one complaint asking how the company obtained the contact details."},{"type":"heading","text":"Part 1: Clean and prioritise"},{"type":"steps","items":["Define which records should be suppressed before outreach.","Describe how you would deduplicate and verify the imported list.","Prioritise which interested or referred leads need immediate action.","Identify the records that require manual review rather than automated cleanup."]},{"type":"heading","text":"Part 2: Replies and bookings"},{"type":"list","items":["Write the CRM action for each reply category.","Draft the next step for an interested lead.","Handle the opt-out operationally.","Escalate the data-source complaint correctly.","Prepare the information needed before booking a discovery call.","Define the no-show follow-up rule you would confirm with the client."]},{"type":"heading","text":"Part 3: Reporting"},{"type":"steps","items":["Build a short funnel report.","Separate data-quality problems from campaign-performance problems.","List the metrics you would not trust until the CRM cleanup is complete.","Write the salesperson handoff for one qualified opportunity."]},{"type":"callout","title":"Assessment standard","text":"A strong answer protects data quality and prospect trust while keeping the sales process moving. It does not inflate activity, ignore opt-outs, invent qualification evidence, or make unauthorised commercial promises."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000007-0000-4000-8000-000000000062';

update public.training_assessments
set
  instructions = 'Complete the Harborline Growth Partners composite sales-support simulation. Clean and verify prospect data, apply suppression rules, triage replies, prepare qualification and appointment-setting handoffs, handle sensitive responses, update CRM ownership and next actions, and produce a short funnel report. The assessment tests ethical sales-support judgment and work output rather than sales trivia.',
  is_published = false,
  updated_at = now()
where id = '23000000-0000-4000-8000-000000000007';
