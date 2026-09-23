-- Write the existing Social Media Virtual Assistant course.
-- Platform features change over time; course remains draft until human review.

update public.training_courses
set
  summary = 'A practical social-media operations course for Virtual Assistants covering content calendars, creative briefs, asset QA, caption checks, publishing, campaigns, community management, escalation, reporting, repurposing, responsible AI, and influencer/UGC administration.',
  estimated_minutes = 300,
  status = 'draft',
  published_at = null,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '20000000-0000-4000-8000-000000000009';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Social media operations start with business purpose, not posting frequency"},{"type":"paragraph","text":"A Social Media Virtual Assistant supports the planning, preparation, publishing, moderation, tracking, and administration around a brand’s social channels. The VA may draft, schedule, report, organise assets, and manage routine community interactions, but should work inside the client’s approved strategy, tone, claims, and escalation rules."},{"type":"heading","text":"Know what each channel is for"},{"type":"list","items":["Brand awareness","Education","Community support","Lead generation","Recruitment","Customer retention","Event promotion","Product or service launches","Reputation management"]},{"type":"paragraph","text":"A client may use several channels for different reasons. Do not assume every post should be copied everywhere. The audience, format, context, link behaviour, and moderation needs may differ."},{"type":"heading","text":"Define the audience before drafting"},{"type":"list","items":["Who the content is meant for","What they already know","What problem or interest matters to them","What action the brand wants next","What language and level of formality fit the audience","What claims or topics require approval"]},{"type":"callout","title":"VA support is not unlimited brand authority","text":"Do not announce pricing, policy, partnerships, product claims, legal positions, medical claims, guarantees, political positions, or sensitive company news unless the client has explicitly approved the content and timing."},{"type":"scenario","title":"One brand, three audiences","text":"A client serves customers, job applicants, and business partners on the same channels. Explain how the same company update might need different framing depending on which audience the post is meant to reach."},{"type":"heading","text":"Key takeaway"},{"type":"paragraph","text":"Strong social media support begins with objective, audience, source material, and approval boundaries. The content calendar comes after those are clear."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000011';

update public.training_lessons
set
  content = '[{"type":"heading","text":"A content calendar is an operating system for publishing"},{"type":"paragraph","text":"The calendar should show what is planned, why it exists, who owns each step, and whether the content is actually ready to publish. It should not be a decorative spreadsheet that everyone ignores."},{"type":"heading","text":"Useful calendar fields"},{"type":"list","items":["Publish date and time zone","Channel","Content pillar or campaign","Audience","Format","Draft copy","Asset link","Call to action","Owner","Approver","Approval status","Final link or tracking parameter","Published URL","Notes or exceptions"]},{"type":"heading","text":"Approval workflow"},{"type":"steps","items":["Draft from approved source material.","Complete fact and asset checks.","Send to the correct reviewer.","Capture changes in one source of truth.","Record explicit approval.","Schedule or publish only the approved version.","Keep the published URL or proof when required."]},{"type":"callout","title":"Approval must apply to the final version","text":"If the caption, creative, offer, date, price, or claim changes after approval, the revised version may need approval again. Do not treat approval of an earlier draft as approval of every later edit."},{"type":"scenario","title":"Launch-week calendar","text":"A product launch has five scheduled posts. Two are approved, one needs a price update, one is waiting for legal review, and one asset is missing. Build the calendar status and explain which posts can be scheduled now."},{"type":"heading","text":"Calendar hygiene"},{"type":"list","items":["Avoid duplicate posts unless intentionally cross-posted.","Use exact time zones.","Archive or label cancelled content clearly.","Do not leave outdated promotional copy active after the offer ends.","Keep evergreen content separate from date-sensitive campaigns.","Carry unresolved approvals forward visibly."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000012';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Creative briefs reduce rework"},{"type":"paragraph","text":"A designer or content creator works faster when the request includes the goal, audience, format, required copy, asset references, dimensions or placement needs, deadline, and approval owner. A vague instruction such as ''make this look good for Instagram'' creates avoidable revisions."},{"type":"heading","text":"Creative brief fields"},{"type":"list","items":["Objective","Audience","Channel and placement","Format","Core message","Required text","Call to action","Brand references","Source material","Must-use or must-avoid elements","Deadline","Approver"]},{"type":"heading","text":"Asset QA before approval"},{"type":"steps","items":["Check the correct brand or campaign.","Check spelling, names, prices, dates, and claims.","Check that text is readable at intended size.","Check crops and safe areas for the target placement.","Check links or QR codes if present.","Check alt text or accessibility notes when part of the workflow.","Confirm the final asset matches the approved copy."]},{"type":"callout","title":"A polished design can still be wrong","text":"Visual quality does not compensate for an expired price, incorrect date, wrong product photo, unreadable legal line, or broken link."},{"type":"scenario","title":"Carousel QA","text":"A six-slide carousel looks good, but slide three uses an old statistic, slide five has a different CTA, and the final slide links to last month’s campaign. Write the QA note so the creator knows exactly what to fix."},{"type":"heading","text":"Canva and design tools"},{"type":"paragraph","text":"Use the client’s approved brand kit, templates, folders, and export settings. Avoid creating parallel versions in personal accounts when the team expects the source file to remain editable and accessible."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000021';

update public.training_lessons
set
  content = '[{"type":"heading","text":"A caption should do one job clearly"},{"type":"paragraph","text":"Social copy should connect the content to the audience and next action. Avoid stuffing every post with unrelated messages, excessive hashtags, unsupported claims, and generic engagement bait."},{"type":"heading","text":"Caption QA"},{"type":"list","items":["Correct brand voice","Clear main point","Verified names, dates, prices, and product details","Approved claim language","Correct CTA","Correct destination link","No accidental private information","Appropriate spelling and formatting","No placeholder text","No promises the business cannot guarantee"]},{"type":"heading","text":"Claims need evidence and authority"},{"type":"paragraph","text":"Statements about performance, health, finance, earnings, guarantees, rankings, customer results, or regulated topics can create serious risk. Draft only from approved source material and escalate anything that sounds like a claim the client has not verified."},{"type":"heading","text":"Hashtags and discoverability"},{"type":"list","items":["Use hashtags only when they serve the client’s strategy.","Avoid copying large irrelevant hashtag blocks.","Check spelling and meaning before using unfamiliar tags.","Do not use trending terms that have nothing to do with the post.","Do not promise that hashtags will guarantee reach."]},{"type":"callout","title":"Links need a final click test","text":"A perfectly written CTA is useless if the destination is broken, expired, incorrectly tracked, or points to the wrong page."},{"type":"scenario","title":"Unsupported result claim","text":"A draft says, ''Our method doubles sales in 30 days.'' The source material only says one client experienced strong growth. Rewrite the caption direction so the claim is not overstated, and identify what approval would be required before publishing any quantified result."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000022';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Scheduling is the final control point before content becomes public"},{"type":"paragraph","text":"Scheduling tools make publishing easier, but they also make it easier to publish the wrong version automatically. A Social Media VA should treat the scheduling queue like a release queue."},{"type":"heading","text":"Pre-publish checklist"},{"type":"steps","items":["Confirm final approval.","Confirm the correct account and channel.","Confirm date, time, and time zone.","Confirm caption and asset are the approved versions.","Check links.","Check tags, mentions, and collaborators.","Check format and crop.","Check campaign timing.","Confirm no conflicting post is scheduled at the same time.","Save the proof or published URL when required."]},{"type":"heading","text":"Platform behaviour changes"},{"type":"paragraph","text":"Social platforms regularly change publishing options, media limits, collaboration features, link behaviour, and account permissions. Follow the client’s current approved workflow and the platform’s current interface rather than memorising a single permanent set of buttons."},{"type":"callout","title":"Do not publish from the wrong brand account","text":"When managing several clients or regions, verify the account identity before every manual publish or scheduling change."},{"type":"scenario","title":"Wrong asset in scheduler","text":"Ten minutes before a scheduled launch post, you notice the scheduler contains the previous draft while the final approved file is in the campaign folder. Describe the safest correction and verification steps."},{"type":"heading","text":"After publishing"},{"type":"list","items":["Confirm the post is live.","Check formatting and crop.","Check the link.","Record the URL.","Monitor early comments if required.","Report publishing failures promptly.","Do not silently delete a live mistake without following the client’s correction process."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000031';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Campaign coordination connects social to the rest of the launch"},{"type":"paragraph","text":"A social campaign may depend on landing pages, email, sales, customer support, inventory, events, PR, paid ads, or product changes. The VA should make dependencies visible so social content does not go live before the business is ready."},{"type":"heading","text":"Campaign checklist"},{"type":"list","items":["Campaign objective","Audience","Offer or message","Start and end dates","Approved assets","Landing page","Tracking","Support or sales readiness","Inventory or availability when relevant","Approvals","Reporting cadence","Owner for live issues"]},{"type":"heading","text":"Launch-day coordination"},{"type":"steps","items":["Confirm every dependency is ready.","Confirm scheduled posts and links.","Confirm community-response guidance.","Confirm any promo code or offer terms.","Monitor first-wave comments and DMs.","Track publishing or landing-page issues.","Escalate material problems quickly.","Record changes for the post-launch review."]},{"type":"callout","title":"Social should not announce what the business cannot deliver","text":"If the landing page is broken, inventory is unavailable, pricing is not final, or support has not been briefed, pause and escalate rather than publishing because the calendar says it is time."},{"type":"scenario","title":"Launch dependency failure","text":"A campaign is due to publish in 20 minutes, but the landing page returns an error and customer support has not received the offer terms. Write the internal escalation and state what should happen to the scheduled posts."},{"type":"heading","text":"Post-campaign handoff"},{"type":"paragraph","text":"Archive final assets, published URLs, performance notes, common audience questions, incidents, and learnings so the next campaign does not repeat the same mistakes."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000032';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Community management is customer-facing operations"},{"type":"paragraph","text":"Comments and DMs can contain product questions, complaints, sales enquiries, support issues, spam, harassment, partnership requests, and sensitive personal information. The VA needs routing rules, not just a friendly tone."},{"type":"heading","text":"Routine reply workflow"},{"type":"steps","items":["Read the full comment or message.","Identify the intent.","Check the approved response source.","Answer what is safe and verified.","Move private account details into an approved private channel.","Record or route anything that needs sales, support, or another team.","Set a follow-up when the conversation is not complete."]},{"type":"heading","text":"Typical categories"},{"type":"list","items":["General question","Product or service question","Lead or sales enquiry","Customer support issue","Complaint","Spam","Abuse or harassment","Influencer or partnership enquiry","Media request","Sensitive or regulated topic"]},{"type":"callout","title":"Do not ask customers to post private data publicly","text":"Order numbers, phone numbers, addresses, account details, health information, or other sensitive details should move into the client’s approved private support process."},{"type":"scenario","title":"Public support request","text":"A customer comments that they were charged twice and includes their email address publicly. Write the public response, describe any moderation action allowed by policy, and explain the private handoff to support."},{"type":"heading","text":"Response quality"},{"type":"list","items":["Answer the actual question.","Avoid robotic copy-paste replies.","Do not promise outcomes outside authority.","Keep tone calm.","Preserve context.","Close the loop when another team resolves the issue."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000041';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Sensitive comments need policy, evidence, and escalation"},{"type":"paragraph","text":"Some social interactions involve serious complaints, misinformation, threats, discrimination, legal claims, privacy issues, employee allegations, safety concerns, or public controversy. A VA should not improvise the brand’s position."},{"type":"heading","text":"Escalate immediately when"},{"type":"list","items":["There is a safety threat.","Someone alleges fraud, discrimination, abuse, illegal activity, or serious misconduct.","A user claims private data was exposed.","The media or a regulator contacts the brand.","A post is attracting rapid coordinated backlash.","The issue concerns an employee or internal confidential matter.","The reply requires legal, medical, financial, or other professional advice.","The user threatens legal action or serious public escalation."]},{"type":"heading","text":"Preserve evidence"},{"type":"steps","items":["Capture the original comment or message.","Record time and platform.","Do not alter the wording in the internal record.","Apply moderation only under the approved policy.","Notify the correct owner.","Pause automated replies if they could worsen the issue.","Track the approved public or private response."]},{"type":"callout","title":"Deleting criticism is not a crisis strategy","text":"Moderation should follow the client’s rules for spam, abuse, privacy, threats, or prohibited content. Do not remove legitimate criticism simply because it is uncomfortable."},{"type":"scenario","title":"Viral complaint","text":"A post criticising the client gains hundreds of comments in an hour and includes a claim you cannot verify. Build the escalation note, moderation approach, evidence log, and communication checkpoints."},{"type":"heading","text":"VA boundary"},{"type":"paragraph","text":"Your role is to preserve facts, follow moderation policy, and route the issue. The authorised spokesperson or decision-maker owns the brand’s official position."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000042';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Reporting should connect content activity to the client’s objective"},{"type":"paragraph","text":"A social report is not a screenshot collection. It should show what was published, what happened, what changed, and what the team may want to test or investigate."},{"type":"heading","text":"Possible metrics"},{"type":"list","items":["Reach or impressions","Engagements","Engagement rate using the client’s defined formula","Link clicks","Video views or completion","Follower change","DM or enquiry volume","Leads or conversions where tracking is available","Saves or shares","Response time","Top-performing content by agreed metric"]},{"type":"heading","text":"Define the metric before comparing"},{"type":"paragraph","text":"Platforms may calculate or expose metrics differently. Use the client’s stable reporting definitions and avoid comparing unlike metrics as if they were identical."},{"type":"heading","text":"Good reporting flow"},{"type":"steps","items":["State the objective.","Show the core metrics.","Compare with the relevant previous period or target.","Identify meaningful content-level patterns.","Separate facts from hypotheses.","List recommended tests rather than pretending causation is proven.","Flag tracking or data gaps."]},{"type":"callout","title":"Do not declare a post successful from vanity metrics alone","text":"High reach may be useful for awareness but weak for lead generation. Judge performance against the content objective."},{"type":"scenario","title":"Monthly report","text":"Reach increased 60%, engagement rate fell, link clicks stayed flat, and one educational carousel generated most saves. Write the summary without claiming that reach caused sales or that saves guarantee future conversions."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000051';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Repurposing should preserve the original meaning"},{"type":"paragraph","text":"A webinar, article, podcast, customer interview, or long video can produce several social assets. The VA should extract useful ideas without changing claims, removing necessary context, or making the speaker appear to say something they did not say."},{"type":"heading","text":"Repurposing workflow"},{"type":"steps","items":["Start from the approved source.","Identify reusable themes or sections.","Match each idea to an appropriate format.","Preserve factual context.","Draft the new asset.","Check quotes and claims against the source.","Send for approval.","Track the relationship between source and derivative content."]},{"type":"heading","text":"Responsible AI use"},{"type":"list","items":["Use AI for brainstorming, restructuring, summarising, or first drafts when the client permits it.","Do not upload confidential client, customer, employee, or campaign data into unapproved AI tools.","Verify every factual claim, quote, date, and statistic.","Rewrite generic output to match the brand.","Do not fabricate testimonials, quotes, customer stories, comments, or performance results.","Do not ask AI to imitate a living person deceptively."]},{"type":"callout","title":"AI output is a draft, not proof","text":"If AI generates a statistic, trend claim, quote, or platform fact, verify it before the content enters the approval queue."},{"type":"scenario","title":"Turn a webinar into five posts","text":"The client provides a 45-minute webinar. Design a repurposing plan for one carousel, two short posts, one video clip, and one email-social teaser while preserving source accuracy and avoiding invented quotes."},{"type":"heading","text":"Version control"},{"type":"paragraph","text":"Label source content and derivative assets clearly so the team can trace where a claim came from and update related posts if the source changes."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000052';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Influencer and UGC work needs records and usage rights"},{"type":"paragraph","text":"A Social Media VA may research creators, organise outreach, track deliverables, collect files, coordinate approvals, and maintain campaign records. Commercial terms, contracts, usage rights, payments, and disclosure requirements should follow the client’s approved legal and marketing process."},{"type":"heading","text":"Creator tracking fields"},{"type":"list","items":["Creator name and handle","Channel","Audience fit","Contact route","Campaign","Deliverables","Due dates","Approval status","Usage rights or licence reference","Disclosure requirement","Payment status","Published links","Performance notes"]},{"type":"heading","text":"UGC administration"},{"type":"steps","items":["Confirm the requested asset.","Confirm the approved brief.","Track due date.","Receive and store the file in the approved location.","Check it against the brief.","Route required revisions.","Confirm approval.","Confirm usage rights before the brand republishes or edits the content.","Archive the published proof."]},{"type":"callout","title":"Receiving a file does not automatically grant the brand unlimited rights","text":"Usage rights, term, territory, editing rights, paid-media rights, whitelisting, and exclusivity are commercial or legal terms. Do not assume permission beyond the approved agreement."},{"type":"scenario","title":"Creator asset request","text":"A creator sends a video that looks strong, but the contract record only mentions one organic post and the marketing team wants to use the clip in paid ads. Explain what you should verify before scheduling the ad asset."},{"type":"heading","text":"VA boundary"},{"type":"paragraph","text":"Do not negotiate legal terms, sign creator agreements, approve unbudgeted fees, or promise campaign scope unless the client has explicitly authorised you to do so."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000061';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Final composite social media simulation"},{"type":"paragraph","text":"This simulation combines planning, approvals, asset QA, scheduling, community management, reporting, AI use, and influencer administration. The brand is fictional and built from common social-media operating patterns rather than any single client."},{"type":"scenario","title":"North & Pine Home","text":"North & Pine Home is launching a new product Friday. Four posts are planned across two channels. One carousel still contains an old price, one short video is approved, one caption makes an unsupported ''best in Australia'' claim, and one scheduled post links to a staging page. A creator has sent UGC, but paid-ad usage rights are unclear. Meanwhile, a customer publicly reports a duplicate charge and another comment accuses the brand of misleading advertising."},{"type":"heading","text":"Part 1: Release control"},{"type":"steps","items":["Decide which content can publish and which must pause.","Write the QA issues for each blocked asset.","Identify every approval or evidence dependency.","Verify links, dates, price, claims, and account before scheduling."]},{"type":"heading","text":"Part 2: Community and escalation"},{"type":"list","items":["Write the public reply to the duplicate-charge customer.","Move sensitive information into the correct private process.","Handle the misleading-advertising accusation using the escalation policy.","Preserve evidence and identify the decision owner."]},{"type":"heading","text":"Part 3: Reporting and rights"},{"type":"steps","items":["Prepare the creator/UGC rights question.","Build the post-launch reporting checklist.","Separate objective performance data from interpretation.","Write the end-of-day social handoff."]},{"type":"callout","title":"Assessment standard","text":"A strong answer treats social publishing as controlled public release. It protects factual accuracy, customer privacy, commercial rights, approvals, and brand escalation rules rather than optimising only for posting speed or engagement."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000009-0000-4000-8000-000000000062';

update public.training_assessments
set
  instructions = 'Complete the North & Pine Home composite social-media operations simulation. Review the content calendar, identify approval and QA blockers, correct unsafe claims and broken publishing inputs, handle public customer and reputation issues, verify creator usage-rights questions, and produce a reporting and handoff plan. The assessment tests social-media operations judgment and work output rather than platform trivia.',
  is_published = false,
  updated_at = now()
where id = '23000000-0000-4000-8000-000000000009';
