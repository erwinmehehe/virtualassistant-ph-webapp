-- Deepen Marketing, E-commerce, and Social Media training with role-specific practical work.
-- Marketing and E-commerce replace the generic catalog practice blocks with
-- lesson-specific exercises, reusable templates, and QA checklists.
-- Social Media promotes the 12 existing work-product drills into first-class
-- exercises and keeps one reusable social-operations template/checklist per lesson.
-- Lesson IDs, enrollment, progress, assessments, and publication state are preserved.

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
),
rebuilt as (
  select
    t.id,
    coalesce(
      jsonb_agg(b.block order by b.ord)
        filter (where b.block->>'type' not in ('exercise','template','checklist')),
      '[]'::jsonb
    )
    || jsonb_build_array(
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
    ) as content
  from targets t
  cross join lateral jsonb_array_elements(
    (select l2.content from public.training_lessons l2 where l2.id = t.id)
  ) with ordinality b(block, ord)
  group by
    t.id,
    t.exercise_title,
    t.exercise_text,
    t.deliverable,
    t.template_title,
    t.template_text,
    t.checklist_title,
    t.checklist_items
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

-- Remove the old prose/scenario Practice ending now that the lesson has one
-- stronger first-class practical task. Preserve all other teaching blocks.
with eligible as (
  select l.id, l.content
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where c.slug in (
    'marketing-virtual-assistant',
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
cleaned as (
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
set
  content = c.content,
  content_version = l.content_version + 1,
  updated_at = now()
from cleaned c
where l.id = c.id
  and l.content is distinct from c.content;

-- Social Media already has 12 lesson-specific "Work product drill" scenarios.
-- Make those the primary learner exercise instead of leaving the generic catalog
-- exercise beside them.
with eligible as (
  select l.id, l.content
  from public.training_lessons l
  join public.training_modules m on m.id = l.module_id
  join public.training_courses c on c.id = m.course_id
  where c.slug = 'social-media-virtual-assistant'
    and l.is_published = true
    and exists (
      select 1
      from jsonb_array_elements(l.content) b
      where b->>'type' = 'heading'
        and b->>'text' = 'Work product drill'
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
social_rebuilt as (
  select
    id,
    coalesce(
      jsonb_agg(
        case
          when previous_block->>'type' = 'heading'
            and previous_block->>'text' = 'Work product drill'
            and block->>'type' = 'scenario'
          then jsonb_build_object(
            'type', 'exercise',
            'title', coalesce(nullif(block->>'title',''), 'Produce the social media work product'),
            'text', block->>'text',
            'deliverable', 'A reviewer-ready social media work product with source brief, approval state, QA evidence, owner, and next handoff.'
          )
          else block
        end
        order by ord
      ) filter (
        where not (
          block->>'type' = 'heading'
          and block->>'text' = 'Work product drill'
        )
        and block->>'type' not in ('exercise','template','checklist')
      ),
      '[]'::jsonb
    )
    || jsonb_build_array(
      jsonb_build_object(
        'type', 'template',
        'title', 'Social media operations work product',
        'text', 'Channel / campaign:
Objective:
Audience:
Source brief / approved reference:
Asset / post / conversation:
Draft or current state:
Claim / link / date / price check:
Approval status:
Publishing or response status:
Community / privacy / rights risk:
Metric or evidence:
Revision needed:
Owner:
Next checkpoint:
Handoff:'
      ),
      jsonb_build_object(
        'type', 'checklist',
        'title', 'Social media QA',
        'items', jsonb_build_array(
          'The work traces back to an approved brief, source, or policy.',
          'Claims, links, dates, prices, tags, and destinations are checked before publishing.',
          'Draft, approved, scheduled, published, and revised states are not confused.',
          'Public replies do not expose private customer or account information.',
          'Creator or UGC usage rights are confirmed before reuse outside the approved scope.',
          'The final owner and next checkpoint are explicit.'
        )
      )
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
from social_rebuilt r
where l.id = r.id
  and l.content is distinct from r.content;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in (
  'marketing-virtual-assistant',
  'ecommerce-virtual-assistant',
  'social-media-virtual-assistant'
);
