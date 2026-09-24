-- Deepen social-media-virtual-assistant with connected practical work. Preserve IDs and learner progress.
with lesson_specs(course_slug,lesson_slug,exercise_title,exercise_text,deliverable,template_title,template_text,checklist_items) as (
values
('social-media-virtual-assistant','channels-audiences-objectives-and-va-boundaries','Map the role of each social channel before posting','North & Pine Home is launching the Arc Shelving Collection. Instagram is intended for visual discovery, Facebook for local community reach and customer questions, and LinkedIn only for trade-partner updates. The founder asks you to "just post everything everywhere."

Create the channel-role matrix and identify which decisions still belong to the campaign owner rather than the Social Media VA.','Submit a channel-role matrix with audience, objective, content type, CTA, response expectations, risks, approval owner, and explicit VA boundaries for each channel.','Social channel-role matrix','Channel:
Primary audience:
Objective:
Approved content type:
Primary CTA:
Response expectation:
Public risk:
Approval owner:
What the VA can decide:
What requires approval:
Source / evidence:
Notes:','["Each channel has a distinct job rather than duplicated posting.","Audience and objective come from approved campaign direction.","Strategy, offer, budget, and sensitive brand-position decisions stay with the authorised owner.","Public-response risk is visible.","CTA and escalation paths fit the channel.","The matrix prevents post-everywhere from becoming the default."]'::jsonb),
('social-media-virtual-assistant','content-calendars-and-approval-workflows','Build a publishable weekly content calendar','The Arc launch week needs two Instagram posts, two Facebook posts, one story set, and one post-launch FAQ recap. The carousel is approved, the reel is still in review, the FAQ source is not final, and the founder has not approved the weekend post.

Build the calendar so status, approver, asset source, and blockers are visible before scheduling.','Submit a one-week social calendar with channel, format, objective, asset, caption status, claim source, approval state, publish time/timezone, dependency, owner, and release status.','Social content calendar','Date:
Time / timezone:
Channel:
Format:
Objective:
Asset:
Caption:
Claim / source:
Approval state:
Approver:
Dependency:
Owner:
Schedule state:
Release status:
Live URL:
Notes:','["Draft, approved, scheduled, and published states are distinct.","Every factual claim has a source.","Unapproved content is not scheduled as final.","Timezone and channel are explicit.","Dependencies and blockers are visible.","Live URLs are recorded after publication."]'::jsonb),
('social-media-virtual-assistant','creative-briefs-canva-workflows-and-asset-qa','QA the Arc social asset set','Four social assets are ready for review: an Instagram carousel with the old $799 price on slide 4, a Facebook video with correct details, a story graphic using an outdated logo, and a reel cover cropped so the product name is unreadable on mobile.

Run the creative QA pass and decide what can move to approval.','Submit a social creative QA matrix with asset/version, channel/format, dimensions, brand checks, price/claim checks, mobile-safe check, approval evidence, issue, owner, fix, and recheck status.','Social creative QA matrix','Asset:
Version:
Channel / format:
Dimensions:
Logo / brand check:
Price / claim check:
Text-safe / crop check:
Accessibility / alt-text input:
Approval evidence:
Issue:
Owner:
Required fix:
Recheck:
Ready for approval?:','["Channel dimensions and safe areas are checked.","Brand assets use the current approved source.","Price and factual claims match current campaign evidence.","Mobile crop/readability is checked.","Approval is not inferred from file location.","Every blocked asset has an owner and recheck step."]'::jsonb),
('social-media-virtual-assistant','caption-drafting-hashtags-links-and-claims','Rewrite captions without inventing the campaign','A draft caption says: "Australia''s best storage system. Save 40% of your time. Shop now at our new collection." The approved campaign source supports neither superlative nor time-saving claim. The link in the draft goes to the home page instead of the Arc landing page.

Create the corrected caption pack for Instagram and Facebook using only approved facts.','Submit two platform-ready captions with hook, approved product facts, CTA, destination URL, hashtag rationale, claim sources, approval status, and any unresolved questions.','Social caption and claim sheet','Channel:
Post / asset:
Objective:
Audience:
Hook:
Approved facts:
Claim source:
Caption:
CTA:
Destination URL:
Hashtags / tags:
Unresolved question:
Approval status:
Owner:
Notes:','["No unsupported superlative or performance claim remains.","Platform wording changes do not alter the approved offer.","CTA links to the correct destination.","Hashtags/tags are relevant rather than stuffed.","Claims can be traced to source evidence.","Unresolved facts remain visible instead of guessed."]'::jsonb),
('social-media-virtual-assistant','scheduling-and-platform-publishing-checks','Run the final publishing check','At 08:30 Friday, one Arc post is scheduled to the wrong Instagram account, another links to staging, the Facebook video is scheduled in the wrong timezone, and the approved carousel is ready.

Build the publishing queue and decide which items can safely go live.','Submit a publishing-readiness queue with account, channel, asset/version, caption approval, URL, UTM if required, publish time/timezone, permissions, blocker, owner, and go/hold status.','Social publishing-readiness queue','Post:
Channel:
Account:
Asset / version:
Caption approved?:
Claim source checked?:
Destination URL:
UTM / tracking:
Publish time:
Timezone:
Account permission:
Blocker:
Owner:
Go / hold:
Post-publish check:
Live URL:','["Correct account identity is verified.","Staging or broken URLs block publication.","Timezone is explicit.","Only approved asset and caption versions are scheduled.","Permissions are checked before scheduling.","Post-publish verification is defined."]'::jsonb),
('social-media-virtual-assistant','campaign-and-launch-coordination','Coordinate social launch readiness without duplicating Marketing Ops','Marketing has confirmed the Arc landing page, offer, and email launch. Social still has three tasks: replace the old-price carousel, clear the reel claim, and prepare launch-day monitoring. The founder asks Social to fix the CRM segment too.

Build the social launch board and route non-social dependencies back to their proper owner.','Submit a platform-readiness board showing social asset, channel, dependency from Marketing Ops, social owner, approval status, publishing status, community-monitoring plan, escalation path, and non-social handoffs.','Social launch readiness board','Social asset / task:
Channel:
Marketing dependency:
Dependency status:
Social owner:
Approval:
Publishing status:
Community monitoring:
Escalation path:
Non-social issue:
Handoff owner:
Next checkpoint:
Release state:','["Social work stays focused on platform readiness and public execution.","CRM/email/landing-page operations are handed back to Marketing Ops.","Social assets cannot bypass campaign-level approvals.","Community monitoring is planned before launch.","Escalation owners are explicit.","Release state reflects actual platform readiness."]'::jsonb),
('social-media-virtual-assistant','comments-dms-and-routine-community-replies','Triage the launch-day community queue','Within the first hour, North & Pine receives five contacts: a product-availability comment, a DM asking delivery timing, a duplicate-charge complaint, a comment asking for trade pricing, and a customer asking whether the shelf fits a specific wall type not covered in the approved product FAQ.

Triage the queue, answer only what the approved sources support, and route the rest.','Submit a five-row community triage log with public/private channel, issue, approved source, response, privacy risk, route, owner, status, and next checkpoint.','Community triage and reply log','Contact:
Channel:
Public / private:
Issue:
Approved source:
Known facts:
Unknowns:
Reply:
Privacy / security risk:
Route:
Owner:
Status:
Next checkpoint:
Internal note:','["Routine questions use approved sources.","Billing/account issues move to the support workflow.","Trade pricing is routed to the authorised owner.","Unsupported compatibility advice is not invented.","Public replies avoid personal/account data.","Every unresolved item has an owner and checkpoint."]'::jsonb),
('social-media-virtual-assistant','complaints-sensitive-topics-and-escalation','Handle a public complaint without improvising policy','A customer comments publicly: "You charged me twice and your ad is misleading." The payment issue belongs to Support, while the advertising accusation may require Marketing/brand review. The customer begins posting the same complaint on multiple posts.

Write the public acknowledgement, preserve evidence, move sensitive investigation private, and create the dual-owner escalation record.','Submit a reputation-issue record with public reply, evidence captured, private-channel move, support handoff, brand/marketing escalation, prohibited disclosures, owner, and next checkpoint.','Social reputation escalation record','Public post / comment:
Customer:
Issue(s):
Evidence captured:
Public acknowledgement:
Private-channel move:
Support handoff:
Marketing / brand escalation:
What must not be disclosed:
Decision owner:
Social monitoring action:
Next checkpoint:
Status:
Internal note:','["The public reply acknowledges without arguing.","Payment/account details are not handled publicly.","Support and brand-review issues are separated.","Evidence is preserved before moderation changes.","No refund, legal, or advertising conclusion is invented.","Ownership and monitoring checkpoints are explicit."]'::jsonb),
('social-media-virtual-assistant','social-reporting-and-content-performance','Report performance without vanity-metric storytelling','Launch-week data shows Instagram reach up 60%, engagement rate down from 4.8% to 3.1%, link clicks flat at 190, saves concentrated on one educational carousel, 22 DMs, and 8 tracked consultation bookings. Facebook reach is flat but link clicks increased 25%.

Prepare the report and distinguish what happened from what you think may explain it.','Submit a social performance report with objective, metric definitions, matched comparison, channel/content observations, tracked conversions, data gaps, hypotheses, and two tests.','Social performance report','Campaign:
Objective:
Period:
Comparison period:
Channel:
Metric definitions:
Reach / impressions:
Engagement:
Engagement rate:
Clicks:
Saves / shares:
DMs:
Tracked bookings / conversions:
Top content:
Observed changes:
Data gaps:
Hypotheses:
Tests:
Owner:
Next reporting window:','["Metrics use stable definitions and comparable periods.","Reach is not treated as success without objective context.","Tracked conversions are reported separately from untracked influence.","Observations and hypotheses are separated.","Content-level patterns are supported by the data.","Recommended tests are specific and measurable."]'::jsonb),
('social-media-virtual-assistant','content-repurposing-and-responsible-ai','Repurpose approved source content with traceability','North & Pine records a 25-minute product-demo webinar. The approved source explains three use cases, installation limitations, and the Arc warranty. An AI draft invents a customer quote and shortens a limitation until it becomes misleading.

Build a five-piece repurposing plan and verification log that preserves the approved meaning.','Submit a repurposing matrix for one carousel, two short posts, one reel clip, and one story set, with source timestamp, extracted idea, claim check, required context, AI use, approval, and final asset status.','Social repurposing and AI verification matrix','Source asset:
Source timestamp / section:
Derivative asset:
Channel / format:
Extracted idea:
Approved fact / quote:
Required context:
AI used?:
AI output issue:
Verification:
Required edit:
Approval:
Owner:
Final status:','["Every derivative asset traces to the approved source.","Quotes and claims remain faithful to source context.","AI-generated facts or quotes are removed unless verified.","Important limitations are not edited away.","Confidential data is not sent to unapproved tools.","Approval and final status are visible."]'::jsonb),
('social-media-virtual-assistant','influencer-and-ugc-administration','Verify creator rights before reusing UGC','Creator Maya Lane delivers an Arc installation video. The tracker confirms one organic Instagram post for 30 days in Australia. The team wants to crop the video, run it in paid Facebook ads for 90 days, and reuse it on the website. No record covers those additional uses.

Create the rights tracker and the exact questions that must be resolved before reuse.','Submit a creator/UGC rights record with asset, source agreement, organic rights, paid-media rights, editing rights, term, territory, website rights, disclosure, payment status, unresolved rights, owner, and release decision.','Creator and UGC rights tracker','Creator:
Handle:
Asset:
Agreement / source:
Organic rights:
Paid-media rights:
Editing rights:
Website rights:
Term:
Territory:
Whitelisting:
Exclusivity:
Disclosure:
Payment status:
Unresolved rights:
Decision owner:
Release / hold:
Evidence link:','["Receiving the file is not treated as unlimited permission.","Organic, paid, editing, website, term, and territory rights are separated.","Missing rights remain unresolved rather than assumed.","Commercial/legal decisions stay with the authorised owner.","Disclosure requirements are visible.","Release status matches documented rights."]'::jsonb),
('social-media-virtual-assistant','composite-social-media-va-simulation','Run the North & Pine social launch shift','North & Pine''s Arc launch is live. You inherit the approved campaign brief, weekly social calendar, four assets, scheduling queue, community contacts, UGC rights note, and first-week platform metrics. Some public-facing items are unsafe or incomplete.

Run the social operations shift from final publishing QA through community handling and reporting, without taking over email, CRM, or broader campaign operations.','Submit the complete social operations portfolio: channel-role matrix, weekly calendar, creative QA, caption/claim sheet, publishing queue, launch board, community triage, reputation escalation record, performance report, repurposing/AI matrix, UGC rights tracker, and end-of-shift handoff.','Social launch operations pack','CAMPAIGN:
Objective:
Approved offer:
Social channels:

PUBLISHING
Approved posts:
Held posts:
Asset / caption issues:
Account / URL / timing issues:
Live URLs:

COMMUNITY
Routine replies:
Support handoffs:
Escalations:
Monitoring checkpoints:

RIGHTS / REPURPOSING
UGC status:
Rights gaps:
AI / source verification:

REPORTING
Observed results:
Data gaps:
Hypotheses:
Tests:

HANDOFF
Owners:
Open decisions:
Next checkpoints:','["All social artifacts use the same approved campaign facts.","Unsafe claims, links, accounts, or rights block publication.","Customer privacy and support boundaries are respected.","Community and reputation issues have clear owners.","Reporting separates observed data from interpretation.","The final handoff stays within Social Media VA scope."]'::jsonb)
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
set instructions='Complete the North & Pine Home Arc Shelving Collection social-operations simulation as one coherent portfolio.

You own platform-native planning, creative/caption QA, scheduling, publishing checks, social launch readiness, comments/DMs, reputation escalation, reporting, repurposing, and creator/UGC administration. Email, CRM segmentation, landing-page operations, cross-channel campaign control, and lead-routing design belong to the Marketing VA course.

Submit:
1. Social channel-role matrix for Instagram, Facebook, and LinkedIn/trade use.
2. Corrected one-week content calendar with approvals and blockers.
3. Social creative QA matrix for the supplied assets.
4. Corrected Instagram and Facebook caption/claim sheet.
5. Publishing-readiness queue with account, URL, time/timezone, permission, and go/hold status.
6. Social launch readiness board showing Marketing Ops dependencies and social-only ownership.
7. Five-row comments/DM community triage log.
8. Public complaint/reputation escalation record.
9. Social performance report separating observations from hypotheses.
10. Repurposing and AI verification matrix.
11. Creator/UGC rights tracker with unresolved permissions.
12. End-of-shift social handoff.

Use only the supplied fictional evidence. Do not invent product compatibility, refund/payment outcomes, rights, claims, creator permission, conversion causality, or platform results. Protect customer privacy and route account-level issues to Support.',resource_pack='[{"id":"calendar","kind":"csv","title":"Arc launch social calendar","content":"date,time,channel,asset,status,issue\nFri,09:00,Instagram,Carousel,Approved,Slide 4 has old $799 price\nFri,09:15,Facebook,Launch video,Approved,None\nFri,12:00,Instagram,Reel,Draft,Caption says ''best in Australia''\nFri,14:00,Facebook,Link post,Scheduled,Links to staging\nSat,10:00,Instagram,Story set,Review,Uses outdated logo\nMon,11:00,Facebook,FAQ recap,Draft,FAQ source not final"},{"id":"accounts","kind":"document","title":"Publishing account and timing notes","content":"Approved Instagram account: @northpinehome\nApproved Facebook page: North & Pine Home Australia\nOne queued Instagram post is mistakenly scheduled on @northpinetrade.\nAll public launch times use AEST for this fictional exercise.\nStaging URL: https://staging.northpine.example/arc\nFinal URL: https://northpine.example/arc\nOnly approved asset/caption combinations may publish."},{"id":"community","kind":"document","title":"Launch-day comments and DMs","content":"Comment: ''Is Arc available in Melbourne?''\nDM: ''How long is delivery to Sydney?''\nComment: ''You charged me twice.''\nComment: ''Do you offer trade pricing for designers?''\nDM: ''Will this mount safely on my wall type? I cannot find it in your guide.''\nComment: ''This ad is misleading. Your old post showed a lower price.''"},{"id":"policy","kind":"policy","title":"Social response and escalation rules","content":"Routine availability/delivery answers may use approved current sources.\nBilling, refund, and account-specific issues must move to Support/private workflow.\nDo not request payment/account details in public comments.\nTrade pricing requires Sales/Partnerships approval.\nUnsupported product compatibility questions go to Product/Support.\nAdvertising/claim complaints must preserve evidence and route to Marketing/brand owner.\nSocial may acknowledge publicly but may not invent refunds, legal conclusions, or claim substantiation."},{"id":"rights","kind":"document","title":"Creator Maya Lane rights note","content":"Creator: Maya Lane / @mayalanehome\nAsset: Arc installation video\nDocumented right: one organic Instagram post\nTerm: 30 days\nTerritory: Australia\nPaid-media rights: not documented\nEditing/cropping rights: not documented\nWebsite reuse: not documented\nWhitelisting: not documented\nPayment status: approved internally, payment confirmation not in social tracker"},{"id":"metrics","kind":"csv","title":"Arc launch social performance","content":"channel,metric,current,previous\nInstagram,Reach,48000,30000\nInstagram,Engagement rate,3.1%,4.8%\nInstagram,Link clicks,190,188\nInstagram,Saves,620,340\nInstagram,DMs,22,14\nInstagram,Tracked consultation bookings,8,5\nFacebook,Reach,21000,20800\nFacebook,Link clicks,125,100\nFacebook,Tracked consultation bookings,5,4"},{"id":"source","kind":"document","title":"Approved product source for repurposing","content":"Approved Arc product-demo webinar notes:\n- Arc is a modular shelving collection.\n- Installation requirements vary by wall type and must follow the product guide.\n- Do not make universal compatibility claims.\n- Approved warranty wording is in the current product guide.\n- No approved customer quote appears in the webinar.\n- No approved ''best in Australia'' or time-saving claim appears in the source."}]'::jsonb,updated_at=now()
from public.training_courses c
where a.course_id=c.id and c.slug='social-media-virtual-assistant' and a.is_published=true;

update public.training_courses set content_version=content_version+1,reviewed_by='Curriculum QA',last_reviewed_at=now(),updated_at=now()
where slug='social-media-virtual-assistant';
