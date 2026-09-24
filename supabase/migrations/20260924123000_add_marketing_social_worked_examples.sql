-- Add expert modelling to highest-judgment Marketing and Social lessons.
with worked_examples(course_slug,lesson_slug,example_title,example_text) as (
values
('marketing-virtual-assistant','brand-claims-approvals-and-source-of-truth','Worked example: old approval is not current proof','Last year''s campaign used “trusted by 5,000+ Australian homes.” The new campaign folder contains the same line, but the current customer count source is missing. Prior publication proves the sentence was once used, not that it is still accurate or approved. Hold the claim, find the current source, and only restore it if the evidence and approval are current.'),
('marketing-virtual-assistant','crm-segments-tags-and-campaign-data-hygiene','Worked example: segment logic should be reproducible','A marketer says, “send this to our good leads.” That is not a usable segment rule. A reproducible segment might be: active prospect, NSW or VIC, opted in, not an existing customer, and no suppression flag. If a record is missing state or consent evidence, put it in the exception set instead of guessing.'),
('marketing-virtual-assistant','campaign-launch-checklists-and-cross-channel-coordination','Worked example: one blocked channel does not erase the launch plan','Email and landing page are fully approved, but the paid ad still contains an unapproved claim. The correct response is not automatically launch everything or cancel everything. Hold the unsafe paid asset, confirm whether the approved channels can launch independently, document the dependency, and let the authorised campaign owner make any broader go/no-go decision.'),
('marketing-virtual-assistant','marketing-reporting-and-basic-performance-interpretation','Worked example: a better result does not prove the reason','Bookings rise from 70 to 96 while landing-page traffic rises 35% and the audience mix changes. The verified fact is that bookings increased. It is not yet proven that the new email, new headline, or social campaign caused the lift. Report the observed change, note the concurrent changes, and propose the next analysis or test.'),
('social-media-virtual-assistant','caption-drafting-hashtags-links-and-claims','Worked example: platform adaptation cannot change the fact','The approved source says the Arc shelf supports a specified load when installed according to instructions. An Instagram draft turns that into “holds anything you throw at it.” The second line is punchier but changes the factual claim. Keep the creative tone, but preserve the approved meaning and link back to the correct product source.'),
('social-media-virtual-assistant','scheduling-and-platform-publishing-checks','Worked example: scheduling is a release control','A post is approved, but it is queued to the wrong brand account and points to a staging URL. Approval alone does not make it safe to publish. Account identity, final URL, timezone, asset version, caption version, and permissions are independent release checks. Any failed check keeps the post on hold.'),
('social-media-virtual-assistant','complaints-sensitive-topics-and-escalation','Worked example: acknowledge publicly, investigate privately','A customer comments that they were charged twice. A useful public reply can acknowledge the issue and invite the customer into the approved private support route. It should not ask for payment details in comments, promise a refund, or debate whether the charge is valid. Social owns the public handoff; Support owns the account-level investigation.'),
('social-media-virtual-assistant','influencer-and-ugc-administration','Worked example: possession is not permission','A creator emails a video file after completing one organic post. The marketing team now wants to cut the video into ads. Having the file does not prove paid-media, editing, website, or extended-term rights. Check the agreement and rights tracker first, then route any missing commercial permission to the authorised owner before reuse.')
),
targets as (
 select l.id,w.example_title,w.example_text from worked_examples w
 join public.training_courses c on c.slug=w.course_slug
 join public.training_modules m on m.course_id=c.id
 join public.training_lessons l on l.module_id=m.id and l.slug=w.lesson_slug
 where l.is_published=true
),
rebuilt as (
 select t.id,
 coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord<ex.exercise_ord),'[]'::jsonb)
 || jsonb_build_array(jsonb_build_object('type','callout','title',t.example_title,'text',t.example_text))
 || coalesce(jsonb_agg(b.block order by b.ord) filter(where b.ord>=ex.exercise_ord),'[]'::jsonb) content
 from targets t
 join lateral (
   select min(b2.ord) exercise_ord
   from jsonb_array_elements((select l2.content from public.training_lessons l2 where l2.id=t.id)) with ordinality b2(block,ord)
   where b2.block->>'type'='exercise'
 ) ex on ex.exercise_ord is not null
 cross join lateral jsonb_array_elements((select l3.content from public.training_lessons l3 where l3.id=t.id)) with ordinality b(block,ord)
 where not exists (
   select 1 from jsonb_array_elements((select l4.content from public.training_lessons l4 where l4.id=t.id)) existing
   where existing->>'type'='callout' and existing->>'title'=t.example_title
 )
 group by t.id,t.example_title,t.example_text,ex.exercise_ord
)
update public.training_lessons l
set content=r.content,content_version=l.content_version+1,reviewed_by='Curriculum QA',last_reviewed_at=now(),updated_at=now()
from rebuilt r where l.id=r.id;
