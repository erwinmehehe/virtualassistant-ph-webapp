-- Deepen marketing-virtual-assistant with connected practical work. Preserve IDs and learner progress.
with lesson_specs(course_slug,lesson_slug,exercise_title,exercise_text,deliverable,template_title,template_text,checklist_items) as (
values
('marketing-virtual-assistant','how-marketing-work-moves-from-brief-to-campaign','Resolve the launch brief before production starts','North & Pine Home is launching its Arc Shelving Collection on Friday. The project board says Friday 09:00 AEST, an old email says Thursday, and the designer says the founder told them Monday. The approved objective is qualified design-consult bookings, but the final approver and UTM owner are missing from the brief.

Build the campaign control brief, surface the conflicting inputs, and write the exact decisions needed before production can safely continue.','Submit a campaign control brief with objective, audience, approved offer, deliverables, owners, launch date conflict, missing decisions, approval owner, dependencies, tracking owner, and next checkpoint.','Campaign control brief','Campaign:
Objective:
Audience:
Approved offer / proposition:
Primary CTA:
Channels:
Deliverables:
Launch date:
Conflicting source(s):
Final approver:
Tracking / UTM owner:
Dependencies:
Missing decision(s):
Decision owner:
Current status:
Next checkpoint:
Handoff:','["Objective and audience come from an approved source.","Conflicting dates are shown rather than silently reconciled.","No launch date or approver is invented.","Every deliverable has an owner and dependency state.","Tracking ownership is resolved before launch.","The handoff names the exact decisions still required."]'::jsonb),
('marketing-virtual-assistant','brand-claims-approvals-and-source-of-truth','Audit claims before they enter production','The Arc campaign folder contains these statements: "Australia''s #1 modular storage range", "installs in under 30 minutes", a testimonial claiming 42% more storage space, and the launch price $799. The current pricing sheet says $849. Only the installation claim has a current product-source note.

Create a claim and approval register. Decide what is publishable, what needs evidence, what needs specialist or approver review, and what must be removed or corrected.','Submit a claim register with claim text, source, source date, approval status, risk, required reviewer, corrected wording where appropriate, and final publication status.','Marketing claim register','Claim:
Asset / channel:
Current wording:
Approved source:
Source date:
Evidence status:
Approval status:
Reviewer:
Risk / issue:
Corrected wording:
Publish / hold / remove:
Owner:
Next action:','["Every factual claim traces to a current source.","Old campaign usage is not treated as current approval.","Price conflicts are resolved from the approved pricing source.","Unsupported superlatives are held or removed.","Testimonials and quantified results require explicit evidence and permission.","Publication status is visible for every claim."]'::jsonb),
('marketing-virtual-assistant','content-calendars-briefs-and-production-tracking','Build a production board from the campaign brief','North & Pine needs seven launch assets: landing page, launch email, reminder email, Instagram carousel, Facebook video, sales one-pager, and booking confirmation email. The carousel depends on final pricing, the emails depend on the landing page URL, and the sales one-pager needs founder approval.

Create the production board and sequence the work so blockers are visible before they become missed deadlines.','Submit a production tracker with asset, purpose, owner, dependency, due date, review stage, approver, blocker, next action, and release status for all seven assets.','Campaign production tracker','Asset:
Purpose:
Channel:
Owner:
Dependency:
Due date:
Review stage:
Approver:
Blocker:
Next action:
Final file / URL:
Release status:
Notes:','["All seven required assets are present.","Dependencies are explicit rather than hidden in notes.","Review stage and final approval are separate fields.","Blocked assets cannot appear release-ready.","Final files or URLs are identifiable.","The board makes the critical path understandable."]'::jsonb),
('marketing-virtual-assistant','asset-coordination-and-quality-assurance','Run a release-gate QA pass','Four Arc campaign assets are marked Ready: the landing page has the correct price but the booking CTA links to staging; the email uses the old $799 price; the carousel is approved but slide 4 uses an obsolete product image; the sales PDF is accurate but has no recorded final approval.

Decide which assets can release, which must pause, and the exact evidence needed to clear each blocker.','Submit an asset release-gate matrix showing asset, version, factual checks, link/file checks, approval evidence, blocker, launch impact, owner, fix, recheck method, and final release state.','Asset release-gate matrix','Asset:
Version:
Price / claim check:
Link / destination check:
Visual / file check:
Approval evidence:
Blocker:
Launch impact:
Owner:
Required fix:
Recheck method:
Release state:
Proof link / note:','["No asset is marked ready solely because design is complete.","Prices, claims, links, files, and approvals are checked independently.","Staging or broken destinations block public release.","Obsolete creative is traced to the approved source asset.","Missing approval evidence remains a blocker.","Every fix has a defined recheck before release."]'::jsonb),
('marketing-virtual-assistant','email-campaign-administration','Prepare the launch email for a safe send','The Arc launch email is scheduled for Thursday 16:00. The draft links to the correct landing page but uses the old price in the footer. The send list includes active prospects, existing customers, three unsubscribed records, and two internal test addresses. The UTM campaign name is blank.

Build the send-readiness record and decide what must change before scheduling.','Submit an email send-readiness sheet covering audience, suppression, test recipients, subject/preheader, CTA destination, approved price, UTM naming, approval, owner, schedule, and go/no-go status.','Email send-readiness sheet','Campaign:
Email:
Audience segment:
Suppression rule:
Unsubscribed excluded?:
Internal test recipients:
Subject:
Preheader:
Primary CTA:
Destination URL:
Approved price / offer:
UTM source:
UTM medium:
UTM campaign:
Approval:
Scheduled time / timezone:
Owner:
Go / no-go:
Blocker / next action:','["Unsubscribed contacts are excluded before send.","The offer and price match the approved campaign source.","CTA and destination are verified.","UTM naming exists before scheduling.","Tests and approvals are recorded separately.","The final go/no-go decision is evidence-based."]'::jsonb),
('marketing-virtual-assistant','crm-segments-tags-and-campaign-data-hygiene','Repair a campaign segment without damaging CRM history','The proposed Arc launch segment is "all homeowners". The export contains active prospects, existing customers, inactive contacts, unsubscribed records, duplicate emails, and contacts with no state field. Marketing wants NSW and VIC prospects only.

Define the corrected segment and create an exception log for records that cannot be safely included or excluded without more evidence.','Submit a CRM segment definition and data-hygiene exception log showing inclusion rules, exclusion rules, suppression, duplicate handling, missing-field treatment, record counts, owner, and QA evidence.','CRM segment and hygiene log','Campaign:
Segment purpose:
Inclusion rules:
Exclusion rules:
Suppression rules:
Required fields:
Duplicate rule:
Missing-field rule:
Before count:
After count:
Exceptions:
Records held for review:
QA query / check:
Owner:
Next action:','["Segment logic matches the campaign audience.","Unsubscribed records remain suppressed.","Duplicates are not merged without evidence.","Missing state data is not guessed.","Before and after counts are recorded.","Exceptions remain visible for review."]'::jsonb),
('marketing-virtual-assistant','campaign-launch-checklists-and-cross-channel-coordination','Run the Arc launch control desk','Launch is 09:00 Friday. At 08:10 the landing page works, the email is approved, the CRM segment is fixed, the carousel still contains the old price, the paid ad claim is awaiting founder approval, and Sales has not received the lead-routing rules.

Build the go/no-go board. Separate launch-blocking issues from items that can continue later and define the stop-launch conditions.','Submit a cross-channel launch control board with dependency, owner, evidence, release status, blocker, stop-launch condition, contingency, next checkpoint, and final go/no-go recommendation.','Cross-channel launch control board','Workstream:
Dependency:
Owner:
Evidence:
Current state:
Blocker:
Launch impact:
Stop-launch condition:
Contingency:
Decision owner:
Next checkpoint:
Final go / hold / partial release:
Handoff:','["Critical dependencies are checked before public release.","Blocked assets do not force unrelated channels to publish incorrectly.","Stop-launch conditions are explicit.","Contingencies do not bypass approval or factual QA.","Sales and lead routing are treated as launch dependencies.","The final recommendation distinguishes full, partial, and held release."]'::jsonb),
('marketing-virtual-assistant','community-lead-and-response-routing','Fix the marketing-to-sales lead handoff','After the Arc landing page goes live, five enquiries arrive: two booked consultations, one pricing question, one existing customer asking for support, and one interior designer asking about trade terms. The current automation sends every form submission to the same sales queue with no context.

Design the routing and handoff logic so each enquiry reaches the correct owner with the right source and campaign context.','Submit a lead-routing matrix and sample handoffs covering lead type, qualification evidence, campaign source, owner, SLA/checkpoint, CRM fields, exception route, and next action.','Campaign lead-routing matrix','Lead / enquiry:
Source campaign:
Landing page / channel:
Enquiry type:
Known facts:
Missing data:
Route:
Owner:
SLA / checkpoint:
CRM fields:
Sales / support / partner handoff note:
Exception:
Next action:
Status:','["Support requests are not misrouted as sales leads.","Trade enquiries are separated from consumer consultations.","Routing uses known evidence rather than assumed intent.","Campaign source is preserved in the handoff.","Every routed lead has an owner and checkpoint.","Exceptions have a defined fallback route."]'::jsonb),
('marketing-virtual-assistant','marketing-reporting-and-basic-performance-interpretation','Build a decision-ready campaign report','The first seven days show: 12,000 landing-page sessions, 410 CTA clicks, 96 bookings, 41 qualified consultations, 14 sales opportunities, and 3 closed deals. Email drove 48 bookings, organic social 18, paid social 21, and direct/unknown 9. Compared with the previous campaign, sessions are up 35% but booking rate is lower.

Write the report without claiming that any channel caused revenue unless the evidence supports it.','Submit a one-page performance report with objective, metric definitions, current results, comparison, funnel rates, channel observations, data gaps, hypotheses, and two next tests.','Marketing performance report','Campaign:
Objective:
Reporting period:
Comparison period:
Metric definitions:
Sessions:
CTA clicks:
Bookings:
Qualified consultations:
Sales opportunities:
Closed deals:
Funnel rates:
Channel observations:
Verified changes:
Data gaps:
Hypotheses:
Recommended tests:
Owner:
Next measurement window:','["Metrics use consistent definitions and date ranges.","Funnel rates are calculated from the stated populations.","Channel contribution is not overstated as causation.","Observations and hypotheses are clearly separated.","Data gaps are visible.","Recommended tests follow from evidence."]'::jsonb),
('marketing-virtual-assistant','responsible-ai-in-marketing-operations','Verify an AI-assisted campaign draft','An approved AI tool drafts Arc campaign copy containing "Australia''s favourite storage brand", "save 40% of your time", and a customer quote that does not exist in the source material. It also rewrites the approved CTA.

Create the verification log, retain only supported content, and show what requires human approval before the draft can proceed.','Submit an AI-assisted marketing verification log with prompt purpose, source material, generated claim, evidence check, privacy check, edit, approval requirement, and final disposition.','AI marketing verification log','Asset:
AI use purpose:
Approved tool?:
Source material:
Sensitive data included?:
Generated claim / quote:
Evidence:
Verification result:
Required edit:
Human approval needed:
Final wording:
Disposition:
Owner:
Notes:','["Confidential or personal data is not inserted into unapproved tools.","Generated claims are checked against source evidence.","Fabricated quotes or testimonials are removed.","Approved CTA wording is not silently changed.","Human approval remains visible where required.","The final draft can be traced back to approved source material."]'::jsonb),
('marketing-virtual-assistant','agency-and-in-house-handoffs','Create one handoff everyone can continue from','North & Pine uses an external designer, freelance email specialist, internal Sales team, and founder approver. On Thursday afternoon the designer says the carousel is done, email says they are waiting on final URL, Sales says they never received the offer terms, and the founder believes everything is ready.

Produce the handoff that reconciles statuses without pretending incomplete work is finished.','Submit a campaign handoff pack showing workstream, owner, latest evidence, actual status, dependency, approval needed, next action, due time, risk, and receiving-owner acknowledgement.','Campaign stakeholder handoff','Workstream:
Owner:
Latest evidence:
Actual status:
Dependency:
Approval / decision needed:
Next action:
Due time:
Risk:
Handoff to:
Acknowledged?:
Source-of-truth link:
Notes:','["Status comes from current evidence rather than verbal confidence.","Each dependency has an owner.","Approvals and execution tasks are distinguished.","Sales receives the exact offer/lead context it needs.","Open risks are visible.","The receiving owner can continue without reconstructing the campaign."]'::jsonb),
('marketing-virtual-assistant','composite-marketing-va-work-simulation','Run the North & Pine campaign operations simulation','North & Pine Home is preparing the Arc Shelving Collection launch. You inherit the approved campaign brief, production board, asset QA log, CRM export, email draft, lead-routing rules, and first-week performance data. Several records conflict.

Run the campaign control desk from pre-launch through first reporting. Protect approvals, suppression, claims, tracking, lead ownership, and evidence.','Submit the complete campaign operations portfolio: control brief, claim register, production board, release-gate QA, email readiness sheet, CRM segment log, launch control board, lead-routing matrix, performance report, AI verification log, and stakeholder handoff.','Marketing campaign control pack','CAMPAIGN:
Objective:
Audience:
Approved offer:
Launch date:
Approver:

PRE-LAUNCH
Critical blockers:
Claims held:
Asset QA:
Email readiness:
CRM readiness:
Lead routing:
Go / hold decision:

POST-LAUNCH
Observed results:
Funnel:
Channel observations:
Data gaps:
Hypotheses:
Tests:

HANDOFF
Open decisions:
Owners:
Next checkpoints:
Evidence links:','["All portfolio artifacts use the same campaign facts.","Approvals, execution state, and live state are not confused.","Suppression, claims, URLs, and tracking are QA''d before launch.","Lead routing preserves source and ownership.","Reporting separates evidence from interpretation.","The final handoff is decision-ready and internally consistent."]'::jsonb)
),
targets as (
 select l.id,l.content,s.* from lesson_specs s
 join public.training_courses c on c.slug=s.course_slug
 join public.training_modules m on m.course_id=c.id
 join public.training_lessons l on l.module_id=m.id and l.slug=s.lesson_slug
 where l.is_published=true
),
cleaned as (
 select t.id,t.exercise_title,t.exercise_text,t.deliverable,t.template_title,t.template_text,t.checklist_items,
 coalesce(jsonb_agg(b.block order by b.ord) filter (where not (
   (b.block->>'type'='heading' and coalesce(b.block->>'text','') ilike 'Practice:%')
   or (b.block->>'type'='paragraph' and p.prev_type='heading' and coalesce(p.prev_text,'') ilike 'Practice:%')
 )),'[]'::jsonb) cleaned_content
 from targets t
 cross join lateral jsonb_array_elements(t.content) with ordinality b(block,ord)
 left join lateral (
  select pb.block->>'type' prev_type,pb.block->>'text' prev_text
  from jsonb_array_elements(t.content) with ordinality pb(block,ord)
  where pb.ord=b.ord-1
 ) p on true
 group by t.id,t.exercise_title,t.exercise_text,t.deliverable,t.template_title,t.template_text,t.checklist_items
),
rebuilt as (
 select c.id,jsonb_agg(case
  when b.block->>'type'='exercise' then jsonb_build_object('type','exercise','title',c.exercise_title,'text',c.exercise_text,'deliverable',c.deliverable)
  when b.block->>'type'='template' then jsonb_build_object('type','template','title',c.template_title,'text',c.template_text)
  when b.block->>'type'='checklist' then jsonb_build_object('type','checklist','title','Before you submit','items',c.checklist_items)
  else b.block end order by b.ord) content
 from cleaned c cross join lateral jsonb_array_elements(c.cleaned_content) with ordinality b(block,ord)
 group by c.id
)
update public.training_lessons l set content=r.content,content_version=l.content_version+1,reviewed_by='Curriculum QA',last_reviewed_at=now(),updated_at=now()
from rebuilt r where l.id=r.id;

update public.training_assessments a
set instructions='Complete the North & Pine Home Arc Shelving Collection campaign-operations simulation as one coherent portfolio.

You own cross-channel campaign operations: brief control, claims and approvals, production tracking, email readiness, CRM segmentation, launch coordination, lead routing, reporting, AI verification, and stakeholder handoff. Social platform publishing, comments/DMs, moderation, creator rights, and platform-native community work belong to the Social Media VA course.

Submit:
1. Campaign control brief resolving conflicting launch inputs and missing owners.
2. Claim and approval register for price, proof points, testimonials, and unsupported claims.
3. Seven-asset production board with dependencies and approvers.
4. Asset release-gate QA matrix.
5. Email send-readiness sheet including suppression, CTA, UTMs, test recipients, approval, and schedule.
6. CRM segment definition and hygiene exception log with before/after counts.
7. Cross-channel launch control board with stop-launch conditions and a go/hold recommendation.
8. Lead-routing matrix for consultation, support, trade, and other enquiries.
9. First-week performance report separating observations, data gaps, hypotheses, and tests.
10. AI-assisted marketing verification log.
11. Agency/in-house stakeholder handoff with owners and next checkpoints.

Use only the supplied fictional evidence. Do not invent approval, customer consent, pricing, claims, attribution, tracking, performance causes, or campaign outcomes. Preserve the boundary between recommendation, approval, scheduled state, live state, and verified post-launch result.',resource_pack='[{"id":"brief","kind":"document","title":"Arc campaign brief and decision log","content":"Brand: North & Pine Home\nCampaign: Arc Shelving Collection\nObjective: qualified design-consult bookings\nAudience: Australian homeowners and interior designers\nApproved offer: free 20-minute storage planning consultation\nPrimary CTA: Book a planning consultation\nApproved launch target: Friday 09:00 AEST, pending final founder confirmation\nApprover: founder for claims/offers; marketing lead for execution\nApproved facts: modular shelving collection; consultation is free; no guaranteed savings/performance claims.\nOpen decision: final paid-ad claim approval.\nOld email still says Thursday launch; designer chat says Monday."},{"id":"production","kind":"csv","title":"Arc campaign production board","content":"asset,status,owner,dependency,issue\nLanding page,Ready,Web,None,CTA links to staging\nLaunch email,Draft,Marketing,Landing page,Old $799 price in footer\nReminder email,Draft,Marketing,Landing page,UTM campaign blank\nInstagram carousel,Approved,Design,Final pricing,Slide 4 shows $799\nFacebook video,Approved,Design,None,None\nSales one-pager,Review,Sales Ops,Founder approval,No approval recorded\nBooking confirmation,Ready,Ops,Booking form,None"},{"id":"crm","kind":"csv","title":"Arc CRM segment sample","content":"contact_id,state,status,customer_status,email_opt_in,suppression,email\n101,NSW,Active,Prospect,true,false,a@example.com\n102,VIC,Active,Prospect,true,false,b@example.com\n103,NSW,Inactive,Prospect,true,false,c@example.com\n104,NSW,Active,Customer,true,false,d@example.com\n105,VIC,Active,Prospect,false,true,e@example.com\n106,,Active,Prospect,true,false,f@example.com\n107,VIC,Active,Prospect,true,false,b@example.com"},{"id":"email","kind":"document","title":"Launch email readiness notes","content":"Scheduled: Thursday 16:00 AEST\nSubject: Meet the Arc Shelving Collection\nCTA: Book a planning consultation\nDestination: final landing page\nFooter price: $799\nApproved current price source: $849\nUTM source=email\nUTM medium=email\nUTM campaign is blank\nList export includes unsubscribed/suppressed rows unless excluded by final segment\nInternal test recipients: qa@northpine.example and marketing@northpine.example"},{"id":"leads","kind":"csv","title":"First launch enquiries","content":"lead_id,source,enquiry,known_context\nL1,Landing page,Booked consultation,Homeowner NSW\nL2,Landing page,Booked consultation,Homeowner VIC\nL3,Email,Asks current price,Prospect NSW\nL4,Landing page,Existing customer asks about damaged item,Existing customer\nL5,Facebook,Interior designer asks trade terms,Trade prospect"},{"id":"performance","kind":"csv","title":"First-week campaign performance","content":"metric,current,previous\nLanding page sessions,12000,8900\nCTA clicks,410,360\nBookings,96,70\nQualified consultations,41,34\nSales opportunities,14,11\nClosed deals,3,2\nEmail bookings,48,NA\nOrganic social bookings,18,NA\nPaid social bookings,21,NA\nDirect/unknown bookings,9,NA"},{"id":"ai","kind":"document","title":"AI-assisted draft excerpt","content":"Draft generated in approved AI tool:\n\"Australia''s favourite storage brand.\"\n\"Save 40% of your time.\"\nCustomer quote: \"Arc changed our whole home.\"\nCTA rewritten to: \"Buy now.\"\nNo source in the campaign brief supports the superlative, time-saving claim, or customer quote. Approved CTA is Book a planning consultation."}]'::jsonb,updated_at=now()
from public.training_courses c
where a.course_id=c.id and c.slug='marketing-virtual-assistant' and a.is_published=true;

update public.training_courses set content_version=content_version+1,reviewed_by='Curriculum QA',last_reviewed_at=now(),updated_at=now()
where slug='marketing-virtual-assistant';
