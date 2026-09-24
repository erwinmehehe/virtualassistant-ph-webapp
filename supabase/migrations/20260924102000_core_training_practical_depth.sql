-- Deepen the weakest published core VA courses with first-class practical work.
-- Executive VA already has the same practical block system in 20260924101000.
-- This migration upgrades Marketing, Customer Support, and E-commerce, removes
-- their redundant legacy Practice endings, and converts existing artifact drills
-- in Operations, Project Management, Sales/Lead Gen, and Social Media into the
-- learner-facing exercise block instead of duplicating content.

with practice (
  course_slug,
  lesson_slug,
  exercise_title,
  exercise_text,
  deliverable,
  template_title,
  template_text,
  checklist_title,
  checklist_items
) as (
  values
  ('marketing-virtual-assistant',
   'how-marketing-work-moves-from-brief-to-campaign',
   'Turn a vague request into a campaign control brief',
   'A fictional founder says, "We need a September campaign for our new service." Build the operating brief before any asset work starts. Separate the business objective, audience, offer, proof, channels, owners, approvals, dependencies, dates, and missing decisions.',
   'A one-page campaign control brief plus a short list of unresolved questions that must be answered before production starts.',
   'Campaign control brief',
   'Campaign:
Business objective:
Audience:
Offer:
Approved proof / source:
Primary message:
Channels:
Required assets:
Owners:
Approvers:
Dependencies:
Launch date:
Measurement:
Known constraints:
Open decisions:
Source links:',
   'Campaign-brief QA',
   array['The business objective is specific enough to measure.','Audience and offer are explicit.','Claims point to an approved source.','Owners and approvers are named.','Dependencies and deadlines are visible.','Missing decisions are surfaced before production begins.']::text[]),
  ('marketing-virtual-assistant',
   'brand-claims-approvals-and-source-of-truth',
   'Audit a claim before it becomes public',
   'A draft ad says a service is "the fastest-growing option in Australia" and promises a 40% improvement. The source pack contains one customer case study and an internal spreadsheet with no methodology. Decide what can be used, what must be rewritten, and what evidence or approval is missing.',
   'A claim-evidence register covering each proposed claim, source, evidence strength, expiry or checked date, approval status, and publish decision.',
   'Marketing claim register',
   'Claim:
Channel / asset:
Exact source:
Checked date:
Evidence type:
What the source actually proves:
What it does not prove:
Approval owner:
Status: Approved / Rewrite / Hold
Safer wording:
Notes:',
   'Claim QA',
   array['Every material claim has a traceable source.','The wording does not exceed what the evidence supports.','Time-sensitive evidence has a checked date.','Testimonials and results are not generalized into universal outcomes.','Approval ownership is visible.','Unsupported claims are held or rewritten, not published.']::text[]),
  ('marketing-virtual-assistant',
   'content-calendars-briefs-and-production-tracking',
   'Build a production calendar that exposes blockers',
   'A four-week campaign needs two emails, six social posts, one landing-page refresh, a customer story, and a webinar reminder. Some copy is approved, the customer story is still awaiting consent, and design capacity is limited. Build the calendar so the team can see what can ship and what is blocked.',
   'A four-week production board with asset, channel, owner, due date, approval state, dependency, blocker, source link, and publish status.',
   'Campaign production board',
   'Asset:
Channel:
Purpose:
Owner:
Due date:
Source copy / brief:
Design dependency:
Approval owner:
Approval status:
Blocker:
Scheduled / publish date:
Final URL:
Notes:',
   'Production-board QA',
   array['Every asset has one owner.','Approval state is separate from production state.','Dependencies are visible before the due date.','Unapproved customer material is not treated as ready.','Final source and published URL can be traced.','Blocked work has a next action and owner.']::text[]),
  ('marketing-virtual-assistant',
   'asset-coordination-and-quality-assurance',
   'Run an asset QA handoff',
   'A designer sends a banner set, two social crops, and an email hero. One file uses an old logo, one has a price that differs from the approved offer, and one mobile crop cuts off the CTA. Prepare the QA result and designer handoff.',
   'An asset QA sheet showing pass/fail by file, issue, evidence, severity for launch readiness, owner, and retest status.',
   'Marketing asset QA sheet',
   'Asset:
Version:
Channel / placement:
Dimensions:
Copy source:
Price / offer checked:
Logo / brand checked:
Image rights checked:
Mobile crop checked:
Link / CTA checked:
Issue:
Action:
Owner:
Retest:
Final status:',
   'Asset QA checklist',
   array['The asset matches the approved brief and offer.','Brand elements use the current source files.','Prices, dates, and claims match the approved source.','Rights or consent are confirmed where required.','Mobile and desktop placement are checked.','Failed assets remain blocked until retested.']::text[]),
  ('marketing-virtual-assistant',
   'email-campaign-administration',
   'Prepare an email campaign for safe send',
   'A campaign email has a new subject line, two audience segments, three links, a discount expiry date, and a personalization field. Build the pre-send process and identify what must stop the send if it fails.',
   'A pre-send test record with audience definition, suppression check, sender details, subject/preheader, personalization test, link test, offer/date verification, mobile review, approvals, and go/no-go decision.',
   'Email campaign pre-send record',
   'Campaign:
Audience:
Exclusions / suppression:
Sender name:
From address:
Reply-to:
Subject:
Preheader:
Personalization fields:
Offer / expiry source:
Links tested:
UTM / tracking:
Desktop test:
Mobile test:
Approval:
Scheduled time + zone:
Go / No-go:
Reason:',
   'Email-send QA',
   array['Audience inclusion and exclusion rules are documented.','Suppression or opt-out rules are applied.','Personalization has a safe fallback.','Every link is tested.','Offer and expiry details match the approved source.','A failed critical check produces a no-go, not a note to fix later.']::text[]),
  ('marketing-virtual-assistant',
   'crm-segments-tags-and-campaign-data-hygiene',
   'Clean a campaign segment without corrupting CRM history',
   'A CRM segment contains duplicate contacts, stale job titles, missing consent fields, inconsistent lifecycle stages, and internal test records. Define the cleanup before the next campaign is scheduled.',
   'A segment-definition sheet plus an exception log for duplicates, stale data, suppression, missing fields, and records that need review.',
   'Campaign segment definition',
   'Segment purpose:
Inclusion rules:
Exclusion rules:
Suppression rules:
Required fields:
Source list / CRM view:
Deduplication key:
Stale-data rule:
Test / internal records:
Expected count:
Actual count:
Exceptions:
Owner for unresolved records:
Final saved view / segment:',
   'CRM segment QA',
   array['Inclusion and exclusion rules are explicit.','Suppressed contacts cannot re-enter through a loose filter.','Duplicates are resolved without losing useful history.','Stale or uncertain data is flagged instead of guessed.','Expected and actual counts are compared.','The final segment can be reproduced from documented rules.']::text[]),
  ('marketing-virtual-assistant',
   'campaign-launch-checklists-and-cross-channel-coordination',
   'Run a launch go/no-go review',
   'A campaign is due at 09:00. Email is ready, the landing page still shows yesterday''s price, one social asset lacks approval, and analytics tags have not been checked. Decide what can launch and what must be held.',
   'A cross-channel go/no-go sheet with component, owner, dependency, critical check, status, blocker, rollback path, and final launch decision.',
   'Campaign launch control sheet',
   'Launch:
Target time + zone:
Component:
Owner:
Dependency:
Copy approved:
Offer / price checked:
Link checked:
Tracking checked:
Mobile checked:
Approval:
Rollback / pause method:
Status:
Blocker:
Decision owner:
Final go / no-go:',
   'Launch QA',
   array['All customer-facing channels use the same approved offer.','Unapproved assets do not launch.','Landing pages and links are checked from the live path.','Tracking is verified before paid or high-volume traffic starts.','A rollback or pause path is known.','The final go/no-go owner is explicit.']::text[]),
  ('marketing-virtual-assistant',
   'community-lead-and-response-routing',
   'Route a mixed marketing response queue',
   'A campaign generates a product question, a sales enquiry, a refund complaint, a media request, a partnership pitch, an unsubscribe request, and a hostile public comment. Route each item without turning the marketing inbox into an untracked catch-all.',
   'A response-routing log with category, public/private handling, approved response, destination owner, CRM/support record, urgency, and follow-up checkpoint.',
   'Marketing response routing log',
   'Incoming item:
Channel:
Category:
Public response needed:
Private reply needed:
Approved reply / acknowledgement:
Destination team:
Record / CRM / ticket:
Urgency:
Risk / sensitivity:
Owner:
Follow-up time:
Final status:',
   'Routing QA',
   array['Sales, support, privacy, media, and partnership work goes to the correct owner.','Public replies do not expose private account details.','Opt-outs are actioned through the approved process.','Complaints are acknowledged without inventing remedies.','Every routed item has a record and owner.','Sensitive or high-risk items have a defined escalation path.']::text[]),
  ('marketing-virtual-assistant',
   'marketing-reporting-and-basic-performance-interpretation',
   'Turn campaign metrics into a decision-ready report',
   'A campaign increased reach 35%, clicks 8%, leads 3%, and spend 20%. Email open rate rose while conversion fell. Build the report without claiming causes that the data does not prove.',
   'A one-page performance summary with objective, metric definitions, actuals, comparison period, material changes, verified facts, hypotheses, data-quality caveats, and next tests.',
   'Marketing performance summary',
   'Campaign:
Objective:
Reporting period:
Comparison period:
Metric:
Definition / source:
Current:
Previous / target:
Change:
Observed fact:
Possible explanation:
Evidence still needed:
Data-quality issue:
Recommended next test:
Owner:',
   'Reporting QA',
   array['Metrics are tied to the campaign objective.','Observed facts are separated from explanations.','Percentages use the correct denominator.','Data-quality gaps are disclosed.','Correlation is not described as proven causation.','Recommended next steps are framed as tests or decisions, not invented certainty.']::text[]),
  ('marketing-virtual-assistant',
   'responsible-ai-in-marketing-operations',
   'Create an AI-assisted marketing workflow with verification',
   'A marketer wants AI to draft five social variants, summarize customer reviews, and suggest an email subject line. Define what data can be used, what must be removed, what sources must be checked, and who approves the final output.',
   'An AI work log covering approved tool, permitted input, removed data, requested draft, claims to verify, source checks, edits, approval owner, and final disposition.',
   'Marketing AI verification log',
   'Task:
Approved AI tool:
Data allowed:
Data removed / replaced:
Prompt objective:
Draft output:
Claims / facts to verify:
Verification source:
Brand / legal / client approval:
Human edits:
Final owner:
Final status:',
   'AI-assisted marketing QA',
   array['Private customer data is not pasted into unapproved tools.','AI is used for drafting or transformation, not as a factual source.','Claims, prices, policies, and statistics are verified.','Brand voice is edited by a human.','Approval requirements are unchanged because AI was used.','The final output has a named human owner.']::text[]),
  ('marketing-virtual-assistant',
   'agency-and-in-house-handoffs',
   'Build a campaign handoff another team can continue',
   'An agency is handing a campaign to an in-house coordinator mid-flight. Three assets are live, two are approved but unscheduled, one is blocked, and a customer-story approval is still pending. Prepare the handoff so nobody has to reconstruct status from Slack.',
   'A campaign handoff containing current state, live assets, pending work, blockers, approvals, key metrics, source links, owners, dates, and next checkpoints.',
   'Marketing campaign handoff',
   'Campaign:
Objective:
Current phase:
Live assets + URLs:
Approved not live:
In production:
Blocked:
Pending approvals:
Audience / segment:
Offer source:
Key results so far:
Open risks:
Next milestone:
Owner by workstream:
Critical links:
Next checkpoint:',
   'Handoff QA',
   array['Live, approved, in-production, and blocked states are distinct.','Final URLs and source files are linked.','Pending approvals have owners.','Open risks and customer commitments are visible.','Metrics include period and source.','The receiving team can continue without reconstructing chat history.']::text[]),
  ('marketing-virtual-assistant',
   'composite-marketing-va-work-simulation',
   'Run the marketing campaign control desk',
   'Use the composite campaign scenario as an operating desk. Resolve the unsupported claim, stale CRM segment, broken link, unapproved asset, customer complaint, and conflicting performance numbers while keeping the launch moving where it is safe.',
   'A campaign control pack containing prioritized risk queue, claim register, segment correction, launch go/no-go sheet, response-routing note, performance summary, and end-of-shift handoff.',
   'Marketing campaign control desk',
   'ISSUE:
Priority:
Confirmed facts:
Risk:
Source:
Action I can take:
Approval / decision needed:
Owner:
Deadline:
Status:
Next checkpoint:

HANDOFF
Launched:
Held:
Fixed:
Still blocked:
Decisions open:
Customer / brand risk:
Tomorrow first:',
   'Final marketing simulation QA',
   array['Unsupported claims are stopped or rewritten.','CRM suppression and segment integrity are protected.','Broken customer paths are fixed or held before launch.','Unapproved assets remain blocked.','Customer complaints are routed with context.','Conflicting metrics are reported as unresolved until verified.']::text[]),
  ('customer-support-virtual-assistant',
   'customer-support-channels-roles-and-outcomes',
   'Map a support journey across channels',
   'A fictional customer asks a product question on social, reports a billing issue by email, and later opens live chat because the email is unresolved. Map how the case should move without creating three disconnected histories.',
   'A channel-ownership map showing customer intent, source channel, system of record, responsible team, handoff rule, response expectation, and final resolution record.',
   'Support channel ownership map',
   'Customer issue:
Starting channel:
System of record:
Primary owner:
Other teams involved:
What can be answered here:
What must move private:
Handoff trigger:
SLA / response expectation:
Customer update:
Final resolution evidence:',
   'Channel-map QA',
   array['One system of record is identified.','Public channels do not carry private account details.','Channel switches preserve the earlier context.','Ownership remains visible after handoff.','Response expectations are realistic and policy-based.','Resolution evidence is recorded in the case.']::text[]),
  ('customer-support-virtual-assistant',
   'tone-empathy-accuracy-and-ownership',
   'Rewrite responses that sound human and stay accurate',
   'Rewrite four fictional replies: a delayed order, a refund request outside policy, a login problem, and a customer upset about repeating information. Show empathy without fake language and state only what is verified.',
   'Four send-ready replies plus a short note identifying the verified fact, policy source, next owner, and any promise deliberately avoided.',
   'Support response worksheet',
   'Customer issue:
Verified facts:
Policy / source:
What the customer needs:
Acknowledgement:
Answer:
Action taken:
What happens next:
Owner:
Timing I can safely state:
Escalation:
Final reply:',
   'Response QA',
   array['The reply addresses the actual issue in the first few lines.','Empathy is specific rather than scripted.','No refund, deadline, replacement, or technical fix is promised without authority.','Facts match the source record.','The next action and owner are clear.','The customer is not asked to repeat information already in the case.']::text[]),
  ('customer-support-virtual-assistant',
   'ticket-triage-priority-and-routing',
   'Triage a mixed support queue',
   'A queue contains an account-compromise report, duplicate charge, delivery delay, feature question, angry public complaint, password-reset issue, cancellation request, and routine how-to question. Prioritize by customer impact and risk, not arrival time.',
   'An eight-row triage queue with category, impact, urgency, SLA, action, owner, escalation reason, and next checkpoint.',
   'Support triage queue',
   'Ticket:
Customer / account:
Category:
Impact:
Urgency:
SLA:
Risk flag:
First action:
Can I resolve:
Escalation owner:
Customer update:
Next checkpoint:
Status:',
   'Triage QA',
   array['Security and payment risks are surfaced immediately.','Urgency is based on consequence, not tone alone.','Routine issues continue without unnecessary escalation.','Every escalated ticket includes useful evidence.','SLA and customer update needs are visible.','No ticket loses ownership while waiting on another team.']::text[]),
  ('customer-support-virtual-assistant',
   'notes-tags-statuses-and-handoffs',
   'Turn a long thread into a usable ticket record',
   'A support thread has 18 messages, two agents, a partial troubleshooting attempt, and one promised follow-up. Clean the internal record so the next agent can continue without rereading the whole thread.',
   'A concise case note with issue, verified facts, steps already tried, customer expectation, commitments, owner, status, tags, next action, and deadline.',
   'Support case handoff note',
   'Issue:
Customer impact:
Verified facts:
Troubleshooting completed:
Outcome:
Policy / article used:
Customer expectation:
Commitment already made:
Current status:
Tags:
Owner:
Next action:
Deadline:
Escalation:
Source thread:',
   'Case-note QA',
   array['The note summarizes rather than copying the thread.','Facts and customer claims are distinguished.','Previous troubleshooting is visible.','Existing promises are preserved accurately.','Status and tags match the actual state.','The next owner can act without rereading the conversation.']::text[]),
  ('customer-support-virtual-assistant',
   'using-a-knowledge-base-without-copy-paste-support',
   'Use the knowledge base as a source, not a script',
   'A customer asks how to change a setting, but the knowledge-base article includes steps for both old and new interfaces. Determine which part applies, adapt the response, and flag the article problem for maintenance.',
   'A customer reply linked to the correct KB source plus a knowledge-base improvement note identifying the stale or ambiguous section.',
   'Knowledge-base use record',
   'Customer question:
Product / plan / version:
KB article:
Relevant section:
Verified steps:
Steps not applicable:
Customer reply:
Article problem found:
Proposed KB correction:
Evidence:
KB owner:
Follow-up:',
   'KB response QA',
   array['The article matches the customer context.','Only relevant steps are sent.','Outdated or conflicting instructions are not copied blindly.','The answer is written for the customer rather than pasted verbatim.','A knowledge gap is logged for the KB owner.','Any unresolved product issue is escalated.']::text[]),
  ('customer-support-virtual-assistant',
   'troubleshooting-boundaries-and-escalation',
   'Build a troubleshooting evidence trail',
   'A customer cannot sign in and reset emails are not arriving. Use only approved support checks. Show what you verify, what you ask the customer to try, what evidence you collect, and when the case must move to a specialist.',
   'A troubleshooting log with symptom, environment, checks, results, customer-safe steps, evidence, stop condition, escalation owner, and next update.',
   'Troubleshooting evidence log',
   'Issue:
Environment / device:
Account status:
Known incident check:
Step tried:
Result:
Evidence:
Customer instruction:
Sensitive data avoided:
Stop condition:
Escalation owner:
Case summary:
Next customer update:',
   'Troubleshooting QA',
   array['Approved steps are followed in a sensible order.','The customer is not asked for passwords or unnecessary sensitive data.','Each attempted step has a recorded result.','Known incidents are checked where relevant.','Access, security, money, or specialist boundaries trigger escalation.','The escalation includes enough evidence to avoid repeating basic checks.']::text[]),
  ('customer-support-virtual-assistant',
   'refunds-credits-cancellations-and-policy-boundaries',
   'Apply policy and prepare an exception correctly',
   'A customer requests a refund five days outside policy and says another agent promised it. Check the record, separate the normal policy from the claimed exception, and prepare the case for the authorized decision maker.',
   'A policy decision sheet showing eligibility, evidence, prior promise, action the VA may take, exception decision needed, approver, and customer response.',
   'Support policy decision sheet',
   'Request:
Order / account:
Requested outcome:
Relevant policy:
Eligibility result:
Evidence:
Prior promise / exception claim:
Action I may take:
Decision needed:
Approver:
Customer reply now:
Customer reply after decision:
Record update:',
   'Policy-boundary QA',
   array['The current approved policy is identified.','Prior promises are checked in the record.','The VA does not approve an unauthorized exception.','The customer receives a clear interim update.','The approver gets a concise evidence summary.','Final action and approval are documented.']::text[]),
  ('customer-support-virtual-assistant',
   'complaints-angry-customers-and-de-escalation',
   'De-escalate a serious complaint without becoming defensive',
   'A customer posts publicly that the business stole their money after a delayed refund. Prepare the public acknowledgement, private follow-up, evidence review, internal escalation, and next customer checkpoint.',
   'A complaint response pack with public reply, private message, verified timeline, remedy boundary, escalation note, owner, and follow-up time.',
   'Complaint escalation brief',
   'Complaint:
Public channel:
Customer impact:
Verified timeline:
Public acknowledgement:
Private follow-up:
Evidence checked:
Policy / remedy boundary:
Serious allegation / risk:
Escalation owner:
Next customer update:
Final resolution record:',
   'Complaint-handling QA',
   array['The public reply is brief and does not expose account details.','The customer is not argued with or blamed.','The timeline is verified before explaining what happened.','A remedy is not promised outside authority.','Serious allegations are routed to the correct owner.','The customer has a clear next checkpoint.']::text[]),
  ('customer-support-virtual-assistant',
   'sla-response-time-resolution-and-backlog',
   'Build a backlog control board',
   'A support queue has 126 open tickets, 17 past first-response SLA, 9 awaiting customers, 14 waiting on another team, and a spike in one issue type. Build a control view that helps a lead decide what to work first.',
   'A backlog board grouped by SLA risk, customer impact, dependency, age, issue pattern, owner, and next action, plus a short exception summary.',
   'Support backlog control board',
   'Ticket / cohort:
Open since:
SLA:
SLA risk:
Customer impact:
Status:
Waiting on:
Owner:
Next action:
Next checkpoint:
Repeated issue category:
Escalation:
Resolution target:
Notes:',
   'Backlog QA',
   array['SLA breaches are separated from routine open work.','Waiting-on-customer and waiting-on-team states are distinguishable.','High-impact customers are not hidden by queue size.','Repeated issue patterns are surfaced.','Every blocked group has an owner and checkpoint.','The summary distinguishes backlog volume from actual customer risk.']::text[]),
  ('customer-support-virtual-assistant',
   'quality-assurance-and-support-coaching-notes',
   'Score a support case and write useful coaching',
   'Review a fictional case where the refund was correct but approval was undocumented, the agent used a misleading phrase, and the internal note omitted the exception reason. Score the work without turning QA into a tone-only exercise.',
   'A support QA scorecard with accuracy, policy, communication, ownership, documentation, risk, evidence, coaching note, and follow-up check.',
   'Support QA scorecard',
   'Case:
Accuracy:
Policy adherence:
Tone / clarity:
Ownership:
Documentation:
Risk handling:
What was done well:
What needs correction:
Evidence:
Coaching note:
Required follow-up:
Reviewer:
Recheck date:',
   'QA-review checklist',
   array['Scoring covers correctness and policy, not only friendliness.','The review cites evidence from the case.','Coaching describes a behavior to change.','The note distinguishes a one-off miss from a process problem.','Serious compliance or security issues are escalated.','A recheck is defined when improvement needs verification.']::text[]),
  ('customer-support-virtual-assistant',
   'crm-and-cross-team-handoffs',
   'Build a handoff that closes the ownership gap',
   'A support issue now needs billing, product, and account-management input. Prepare the handoff so each team gets only the context it needs and the customer still has one visible owner.',
   'A cross-team handoff with issue summary, customer impact, evidence, work already completed, exact request to each team, owner, due time, customer update, and return path.',
   'Support cross-team handoff',
   'Customer / account:
Issue:
Impact:
Verified facts:
Actions already taken:
Team receiving:
Exact question / action requested:
Evidence / links:
Current customer owner:
Customer update sent:
Due / checkpoint:
Return path:
Final owner:
Status:',
   'Handoff QA',
   array['The receiving team gets a specific request.','Completed support work is visible.','Sensitive data is limited to what the team needs.','The customer still has a clear owner.','A due time or checkpoint prevents silent waiting.','The result returns to the support record.']::text[]),
  ('customer-support-virtual-assistant',
   'composite-customer-support-simulation',
   'Run the customer support control desk',
   'Use the final support simulation as a live queue. Triage the payment issue, login problem, delayed order, policy exception, angry complaint, and unresolved handoff. Produce customer replies and internal records that stay inside policy and authority.',
   'A support control pack containing triage queue, two send-ready replies, troubleshooting log, policy exception brief, complaint escalation, backlog note, and end-of-shift handoff.',
   'Customer support control desk',
   'CASE:
Priority:
Customer impact:
Verified facts:
Policy / KB source:
Action I can take:
Reply:
Escalation:
Owner:
Deadline:
Next checkpoint:
Internal note:

END OF SHIFT
Resolved:
Waiting on customer:
Waiting on team:
SLA risk:
Serious escalations:
Tomorrow first:',
   'Final support simulation QA',
   array['Security and payment issues are prioritized correctly.','Customer replies use verified information.','Troubleshooting stops at the proper boundary.','Policy exceptions go to an authorized owner.','Serious complaints retain one customer owner.','Every open case ends with a checkpoint and internal record.']::text[]),
  ('ecommerce-virtual-assistant',
   'how-an-online-store-operates',
   'Map an order across the store stack',
   'A fictional order moves from storefront to payment, inventory, fulfilment, shipping, support, and finance. Map the systems and owners so a VA can see where one edit may create downstream effects.',
   'An end-to-end store operations map showing trigger, system of record, owner, key data, downstream dependency, control check, and exception path.',
   'E-commerce operations map',
   'Stage:
Trigger:
System of record:
Primary owner:
Key fields:
Downstream system:
Control check:
Common exception:
VA action:
Approval needed:
Completion evidence:',
   'Store-map QA',
   array['Each stage has a source-of-truth system.','Downstream effects of key changes are visible.','Money, inventory, customer, and fulfilment ownership are separated.','Common exceptions have a route.','Completion evidence is defined.','The map prevents treating the storefront as the only system that matters.']::text[]),
  ('ecommerce-virtual-assistant',
   'products-variants-skus-and-source-data',
   'Build a product source record before publishing',
   'Create a fictional product with four variants. The supplier spreadsheet, current storefront, and warehouse list disagree on one SKU and one weight. Resolve what can be verified and flag what cannot.',
   'A product source sheet with title, variants, SKU, barcode, price, weight, inventory source, image mapping, evidence, conflicts, and approval owner.',
   'Product source record',
   'Product:
Approved title:
Option:
Variant:
SKU:
Barcode:
Price:
Weight:
Inventory source:
Image:
Source file:
Checked date:
Conflict:
Decision needed:
Approver:
Final status:',
   'Product-data QA',
   array['Every variant has a unique intended SKU.','Conflicting sources are not silently reconciled.','Price and inventory fields use the designated source.','Images map to the correct variant.','Unverified facts remain flagged.','A reviewer can trace each important field to its source.']::text[]),
  ('ecommerce-virtual-assistant',
   'product-listing-and-content-qa',
   'QA a product page before it goes live',
   'A product page draft has approved product data but an old image, an unsupported waterproof claim, a broken size-guide link, and a mobile crop problem. Run the release review.',
   'A product-page QA sheet covering data, copy, claims, variants, images, links, SEO fields, inventory behavior, mobile display, and final go/no-go.',
   'Product page QA sheet',
   'Product:
Variant:
Title checked:
Price checked:
Inventory checked:
Claim source:
Images checked:
Alt text:
Size / compatibility:
Links:
Mobile:
SEO fields:
Policy link:
Issue:
Owner:
Retest:
Go / No-go:',
   'Listing QA',
   array['Copy uses approved product facts.','Claims do not exceed source evidence.','Variant and inventory behavior are tested.','Images match the product and variant.','Links work from the customer page.','Mobile layout is checked before publish.']::text[]),
  ('ecommerce-virtual-assistant',
   'bulk-updates-collections-and-merchandising-support',
   'Plan a bulk catalog change with rollback',
   'A merchant asks you to update the vendor field and collection tag on 250 products. The existing tag controls an automated collection. Plan the change so you can prove the right records changed and recover if the rule behaves badly.',
   'A bulk-change plan with target filter, fields, expected count, dependencies, backup, test sample, approval, rollback, verification, and result log.',
   'Bulk catalog change plan',
   'Change:
Target records:
Filter / selection rule:
Fields changing:
Expected count:
Dependencies:
Before-state export:
Test sample:
Test result:
Approval:
Rollback method:
Full run count:
Post-change checks:
Unexpected result:
Final status:',
   'Bulk-change QA',
   array['Target records and fields are explicit.','Dependencies on tags, feeds, or automation are checked.','A recoverable before-state exists.','A small sample is tested first.','Expected and actual counts are compared.','Rollback is defined before the full change.']::text[]),
  ('ecommerce-virtual-assistant',
   'order-processing-and-exception-tracking',
   'Run an order exception queue',
   'Triage eight fictional orders: payment review, out of stock, wrong address, duplicate order, cancellation request, fulfilment delay, damaged item, and marketplace sync failure. Keep routine work moving while making decisions visible.',
   'An eight-row exception queue with order status, risk, evidence, action, approval requirement, owner, customer update, and next checkpoint.',
   'Order exception queue',
   'Order:
Payment status:
Fulfilment status:
Exception:
Customer impact:
Evidence:
Action I can take:
Approval needed:
Owner:
Customer update:
Next checkpoint:
Final outcome:',
   'Order-exception QA',
   array['Payment and fraud signals follow approved review.','Inventory is not changed to make the order appear clean.','Address or cancellation changes respect fulfilment state.','Customer communication uses confirmed status.','Every blocked order has an owner.','Resolution is recorded in the order history.']::text[]),
  ('ecommerce-virtual-assistant',
   'shipping-tracking-and-fulfilment-communication',
   'Investigate a delivered-not-received case',
   'A customer says their package never arrived while carrier tracking says delivered. Build the investigation using the store policy and carrier evidence without accusing the customer or promising an immediate refund.',
   'A delivery investigation record with order/tracking verification, carrier evidence, customer checks, policy threshold, case reference, action, owner, and next update.',
   'Delivery investigation log',
   'Order:
Tracking:
Carrier:
Ship-to address checked:
Carrier status:
Delivery evidence:
Customer checks:
Store policy:
Investigation threshold:
Carrier / 3PL case:
Action:
Approval needed:
Customer update:
Next checkpoint:',
   'Shipping-investigation QA',
   array['Order and tracking numbers are verified.','Carrier evidence is recorded accurately.','The customer is not accused of fraud.','Refund or replacement is not promised before the approved decision point.','Case references and checkpoints are saved.','The customer knows what happens next.']::text[]),
  ('ecommerce-virtual-assistant',
   'returns-refunds-exchanges-and-policy-based-support',
   'Apply return policy and route an exception',
   'Handle five fictional cases: wrong size, damaged item, late return, missing parcel, and duplicate purchase. For each, identify policy eligibility, evidence, action the VA may take, and who decides exceptions.',
   'A five-row returns decision sheet with eligibility, evidence, approved remedy, exception, approval owner, logistics action, finance effect, and customer response.',
   'Returns decision sheet',
   'Order:
Request:
Reason:
Delivery date:
Policy window:
Eligibility:
Evidence:
Approved remedy:
Exception needed:
Approver:
Return / replacement logistics:
Refund status:
Customer reply:
Final record:',
   'Returns QA',
   array['Eligibility is based on the current policy.','Evidence requirements are proportionate and approved.','The VA does not invent an exception.','Refund status is not marked complete before system confirmation.','Inventory/logistics effects are captured.','The customer receives a clear next step.']::text[]),
  ('ecommerce-virtual-assistant',
   'customer-service-across-email-chat-and-marketplaces',
   'Unify one customer case across three channels',
   'A customer emails about a damaged item, opens chat before receiving a reply, then messages through a marketplace. Consolidate the history so the customer gets one consistent answer and the marketplace rules are still followed.',
   'An omnichannel case record with source messages, system of record, verified facts, channel-specific constraints, current owner, approved response, and next checkpoint.',
   'Omnichannel customer case',
   'Customer:
Order:
Channels:
System of record:
Issue:
Verified facts:
Prior replies:
Marketplace constraints:
Approved remedy / policy:
Current owner:
Response by channel:
Next action:
Next checkpoint:
Final resolution:',
   'Omnichannel support QA',
   array['All channel history is consolidated.','The customer is not asked to repeat known facts.','Marketplace-specific rules are respected.','Replies remain consistent across channels.','One owner is visible.','Final resolution is recorded in the source system.']::text[]),
  ('ecommerce-virtual-assistant',
   'inventory-monitoring-and-reorder-administration',
   'Investigate an inventory mismatch before changing stock',
   'The storefront shows 18 units, the warehouse file shows 11, and the marketplace feed shows 20. Build the reconciliation and reorder note without forcing the numbers to match.',
   'An inventory discrepancy report with each source, timestamp, expected cause categories, affected orders, actions allowed, unresolved difference, reorder threshold, and owner decision.',
   'Inventory discrepancy report',
   'SKU:
Storefront quantity:
Warehouse quantity:
Marketplace quantity:
Checked time:
Open orders:
Recent receipts / returns:
Known sync delay:
Difference:
Evidence:
Action I can take:
Adjustment approval:
Reorder rule:
Owner:
Next reconciliation:',
   'Inventory QA',
   array['Source timestamps are compared.','Open orders and recent movements are considered.','Stock is not edited just to make systems agree.','Manual adjustments require the correct authority.','Customer-impacting shortages are surfaced.','The next reconciliation point is recorded.']::text[]),
  ('ecommerce-virtual-assistant',
   'promotions-discount-codes-and-launch-checklists',
   'QA a promotion before customers see it',
   'A 15% promotion should apply only to one collection, exclude sale items, start at midnight Sydney time, and end after three days. A test shows one excluded product still receives the discount. Run the launch decision.',
   'A promotion QA record with rule definition, scope, exclusions, dates/time zone, test cases, stacking behavior, landing-page copy, channel consistency, defect, and go/no-go.',
   'Promotion launch QA',
   'Promotion:
Offer:
Eligible products:
Exclusions:
Code / automatic:
Stacking rule:
Start + zone:
End + zone:
Test case:
Expected:
Actual:
Landing page:
Email / social copy:
Defect:
Owner:
Go / No-go:',
   'Promotion QA checklist',
   array['Eligibility and exclusions match the approved brief.','Start and end times use the correct time zone.','Stacking behavior is tested.','Customer-facing copy matches the actual rule.','Representative eligible and ineligible products are tested.','A failed pricing rule blocks launch.']::text[]),
  ('ecommerce-virtual-assistant',
   'store-reporting-and-marketplace-handoffs',
   'Build a store operations handoff from messy metrics',
   'Store revenue is up, refund value is up faster, two marketplaces show stale inventory, and one fulfilment queue is aging. Prepare the operating summary and handoff without treating revenue growth as proof the operation is healthy.',
   'A store operations report with period, source, sales/orders, exceptions, refund/return movement, fulfilment backlog, inventory sync issues, unresolved risks, owners, and next checkpoints.',
   'E-commerce operations handoff',
   'Period:
Source:
Orders:
Revenue:
Refunds / returns:
Fulfilment backlog:
Shipping exceptions:
Inventory discrepancies:
Marketplace sync:
Customer-service trend:
Observed change:
Data-quality caveat:
Owner:
Action:
Next checkpoint:
Critical links:',
   'Store-reporting QA',
   array['Metrics identify their period and source.','Revenue is not reported without relevant exception context.','Marketplace sync issues are visible.','Observed facts are separated from explanations.','Open operational risks have owners.','The next team can continue from linked source records.']::text[]),
  ('ecommerce-virtual-assistant',
   'composite-e-commerce-va-work-simulation',
   'Run the e-commerce operations control desk',
   'Use the final store scenario as a live operating queue. Resolve the duplicate SKU, delivered-not-received case, stock discrepancy, broken promotion rule, delayed fulfilment, and marketplace sync issue in the correct order.',
   'An e-commerce control pack containing priority queue, SKU correction note, delivery investigation, inventory discrepancy report, promotion no-go note, marketplace handoff, and end-of-shift summary.',
   'E-commerce operations control desk',
   'ISSUE:
Priority:
Customer / revenue impact:
Confirmed facts:
Source:
Action I can take:
Approval needed:
Owner:
Customer update:
Deadline:
Next checkpoint:
Final evidence:

END OF SHIFT
Resolved:
Still blocked:
Orders at risk:
Inventory risk:
Promotion status:
Marketplace issues:
Tomorrow first:',
   'Final e-commerce simulation QA',
   array['Payment, inventory, and customer-impact risks are prioritized.','Duplicate SKU changes use verified source data.','Delivered-not-received follows the approved investigation path.','Inventory mismatches are not forced to agree.','Broken promotion logic produces a no-go.','Open marketplace issues end with an owner and checkpoint.']::text[])
),
targets as (
  select l.id, p.*
  from practice p
  join public.training_courses c on c.slug = p.course_slug
  join public.training_modules m on m.course_id = c.id
  join public.training_lessons l on l.module_id = m.id and l.slug = p.lesson_slug
  where l.is_published = true
)
update public.training_lessons l
set
  content = l.content || jsonb_build_array(
    jsonb_build_object(
      'type', 'exercise',
      'title', t.exercise_title,
      'text', t.exercise_text,
      'deliverable', t.deliverable
    ),
    jsonb_build_object(
      'type', 'template',
      'title', t.template_title,
      'text', t.template_text
    ),
    jsonb_build_object(
      'type', 'checklist',
      'title', t.checklist_title,
      'items', to_jsonb(t.checklist_items)
    )
  ),
  content_version = l.content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
from targets t
where l.id = t.id
  and not exists (
    select 1 from jsonb_array_elements(l.content) block
    where block->>'type' = 'exercise'
  );

-- Remove legacy Practice / Final practice pairs once a first-class exercise exists.
-- Keep every other teaching block unchanged and preserve lesson IDs/progress.
with eligible as (
  select l.id, l.content
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where c.slug in (
    'executive-virtual-assistant',
    'marketing-virtual-assistant',
    'customer-support-virtual-assistant',
    'ecommerce-virtual-assistant'
  )
    and l.is_published = true
    and exists (
      select 1 from jsonb_array_elements(l.content) b
      where b->>'type' = 'exercise'
    )
),
expanded as (
  select
    e.id,
    b.block,
    b.ord,
    lag(b.block) over (partition by e.id order by b.ord) as previous_block
  from eligible e
  cross join lateral jsonb_array_elements(e.content) with ordinality b(block, ord)
),
rebuilt as (
  select
    id,
    jsonb_agg(block order by ord) as content
  from expanded
  where not (
    (
      block->>'type' = 'heading'
      and (
        lower(coalesce(block->>'text','')) = 'practice'
        or lower(coalesce(block->>'text','')) like 'final practice:%'
      )
    )
    or (
      previous_block->>'type' = 'heading'
      and (
        lower(coalesce(previous_block->>'text','')) = 'practice'
        or lower(coalesce(previous_block->>'text','')) like 'final practice:%'
      )
      and block->>'type' in ('paragraph','scenario')
    )
  )
  group by id
)
update public.training_lessons l
set content = r.content,
    content_version = l.content_version + 1,
    updated_at = now()
from rebuilt r
where l.id = r.id
  and l.content is distinct from r.content;

-- Operations, Project Management, Sales/Lead Gen, and Social Media already
-- contain specific "Work product drill" scenarios. Promote those existing drills
-- into first-class exercise blocks rather than adding another exercise.
with eligible as (
  select l.id, l.content
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where c.slug in (
    'operations-virtual-assistant',
    'project-management-for-virtual-assistants',
    'sales-lead-generation-virtual-assistant',
    'social-media-virtual-assistant'
  )
    and l.is_published = true
    and exists (
      select 1 from jsonb_array_elements(l.content) b
      where b->>'type' = 'heading' and b->>'text' = 'Work product drill'
    )
),
expanded as (
  select
    e.id,
    b.block,
    b.ord,
    lag(b.block) over (partition by e.id order by b.ord) as previous_block
  from eligible e
  cross join lateral jsonb_array_elements(e.content) with ordinality b(block, ord)
),
rebuilt as (
  select
    id,
    jsonb_agg(
      case
        when previous_block->>'type' = 'heading'
          and previous_block->>'text' = 'Work product drill'
          and block->>'type' = 'scenario'
        then jsonb_build_object(
          'type', 'exercise',
          'title', coalesce(nullif(block->>'title',''), 'Produce the work product'),
          'text', block->>'text',
          'deliverable', 'Complete the requested work product so another operator or reviewer can use it without reconstructing the lesson.'
        )
        else block
      end
      order by ord
    ) filter (
      where not (block->>'type' = 'heading' and block->>'text' = 'Work product drill')
    ) as content
  from expanded
  group by id
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
where slug in (
  'executive-virtual-assistant',
  'marketing-virtual-assistant',
  'customer-support-virtual-assistant',
  'operations-virtual-assistant',
  'project-management-for-virtual-assistants',
  'social-media-virtual-assistant',
  'sales-lead-generation-virtual-assistant',
  'ecommerce-virtual-assistant'
);
