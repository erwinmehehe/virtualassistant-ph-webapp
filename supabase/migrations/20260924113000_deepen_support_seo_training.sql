-- Deep practical pass for Customer Support and SEO Virtual Assistant.
-- Replaces generic lesson artifacts with connected, role-specific work products.
-- Preserves course/module/lesson IDs and learner progress.

with practice_specs (
  course_slug, lesson_slug, exercise_title, exercise_text, deliverable,
  template_title, template_text, checklist_title, checklist_items
) as (
  values
(
    'customer-support-virtual-assistant',
    'customer-support-channels-roles-and-outcomes',
    'Consolidate a duplicate omnichannel case',
    'Northstar Home Co. customer Maya Santos emails at 09:02 about order NHC-1842 not arriving, sends a Facebook message at 09:07, and opens live chat at 09:11. The email contains the order number, the social message contains only her name, and chat adds that the parcel was needed for an installer appointment today.

The order record shows one customer, one order, and no prior support case. Create one case history without sending three conflicting replies. Decide which channel should carry the substantive response and what should happen to the duplicate contacts.',
    'A consolidated case record showing identity match evidence, primary ticket/channel, linked duplicate contacts, issue summary, customer impact, customer-facing reply, internal note, owner, status, and next checkpoint.',
    'Omnichannel case consolidation record',
    'Customer:
Order / account:
Primary ticket:
Primary response channel:
Duplicate contacts:
Identity-match evidence:
Issue:
Customer impact:
Known facts:
Unknowns:
Reply sent:
Internal note:
Linked / merged records:
Owner:
Status:
Next checkpoint:',
    'Case-consolidation QA',
    array['All contacts are tied to the same customer using evidence, not assumption.','One primary case remains the source of truth.','The reply does not contradict information sent on another channel.','Sensitive information is moved out of public or semi-public channels.','The internal record preserves every contact without duplicate work.','The case ends with one owner and next checkpoint.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'tone-empathy-accuracy-and-ownership',
    'Write a truthful delayed-delivery response',
    'Northstar customer Daniel paid for express delivery. Tracking shows the parcel left the depot Monday, has a carrier-delay scan Tuesday, and has no revised delivery date. The carrier SLA says support may open a trace after 24 hours without movement. Refunds for shipping fees require supervisor approval.

Write the customer reply, the internal ownership note, and the follow-up commitment. Do not invent a delivery date or promise a refund.',
    'A customer response plus internal commitment log containing verified facts, acknowledgement, action taken, realistic checkpoint, owner, and any approval required.',
    'Customer response and commitment log',
    'Customer:
Ticket:
Customer''s actual question / concern:
Verified facts:
What I cannot confirm:
Action I can take now:
Approval required:
Customer reply:
Follow-up owner:
Follow-up checkpoint:
Internal note:
Status:',
    'Response-quality QA',
    array['The response addresses the actual delivery problem, not just the customer''s emotion.','Every factual statement is supported by tracking or policy.','No delivery date, refund, or carrier outcome is invented.','Ownership is expressed as a concrete next action and checkpoint.','The customer is not asked to repeat information already in the case.','The internal note matches what the customer was told.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'ticket-triage-priority-and-routing',
    'Prioritise the Northstar morning queue',
    'At 09:15 Northstar has six new tickets:
A. Duplicate card charge, customer says two payments posted overnight. Billing SLA 2h.
B. Installer due 09:30 has not arrived. Dispatch SLA 1h.
C. Compatibility question for a purchase planned next month. Product SLA 4h.
D. Refund request outside policy. Support SLA 4h.
E. Password-reset request from an email that does not match the account. Security SLA 1h.
F. Angry complaint about a delivery that arrived one day late yesterday. Support SLA 4h.

Rank the queue using consequence, time sensitivity, security/payment risk, SLA, and routing requirements.',
    'A six-row triage board with priority order, category, impact, SLA deadline, evidence checked, route, owner, immediate action, and reason for priority.',
    'Support queue triage board',
    'Ticket:
Received:
Category:
Customer / account:
Impact:
Urgency:
SLA due:
Security / payment / safety flag:
Duplicate?:
Evidence checked:
Priority:
Route:
Immediate action:
Owner:
Reason for priority:
Status:',
    'Triage-board QA',
    array['Priority is based on consequence and deadline, not tone or arrival order alone.','Security and payment issues receive appropriate attention.','The 09:30 installer dependency is visible.','Every ticket has a route and owner.','Duplicates are identified before new cases are created.','The reasoning would still make sense to another agent reviewing the queue.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'notes-tags-statuses-and-handoffs',
    'Repair a weak billing handoff',
    'Ticket A has this internal note: "Customer upset. Sent to billing."

The case record actually shows two card captures for the same order, both for $189.00, one minute apart. The customer says they used the checkout once. Support verified the two transaction IDs but does not have authority to void or refund charges. The customer was told Billing would review within the 2-hour SLA.

Rewrite the note and complete the handoff so Billing can decide without rereading the entire thread.',
    'A decision-ready internal note with correct tags/status, verified transaction evidence, customer statement, action already taken, customer communication, exact Billing decision required, SLA checkpoint, and owner.',
    'Internal note and cross-team handoff',
    'Ticket:
Category / tags:
Status:
Customer:
Issue:
Verified evidence:
Customer statement:
Actions already taken:
What customer was told:
Decision / action needed from next team:
Next team:
SLA / due:
Escalation trigger:
Owner until accepted:
Next checkpoint:',
    'Handoff-note QA',
    array['The note contains evidence, not vague emotion labels.','The next team can see exactly what must be decided.','Support does not make the billing decision.','Customer communication and internal record agree.','Tags and status reflect the actual case state.','Ownership remains clear until the handoff is accepted.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'using-a-knowledge-base-without-copy-paste-support',
    'Resolve a policy conflict before replying',
    'Northstar''s saved refund macro says: "Approved refunds appear within five business days." The current knowledge-base article says: "Refund posting time depends on the payment provider; support must not promise a fixed posting date." The KB article was reviewed last month. The macro has no review date.

A customer asks when an already approved refund will appear. Determine the source of truth, draft the safe response, and log the stale macro for correction.',
    'A knowledge-source decision record with competing sources, freshness/authority check, chosen source of truth, customer response, stale-content issue, owner, and correction request.',
    'Knowledge-base source decision',
    'Customer question:
Candidate source 1:
Owner / review date:
Candidate source 2:
Owner / review date:
Conflict:
Authoritative source:
Why:
Safe customer answer:
Stale macro / article issue:
Correction owner:
Ticket note:
Next checkpoint:',
    'Knowledge-source QA',
    array['The response uses the most current approved source.','The outdated macro is not copied simply because it is convenient.','Any uncertainty is stated rather than guessed.','The stale content is logged for correction.','The customer receives a useful answer without an unsupported promise.','The evidence trail shows why one source was preferred.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'troubleshooting-boundaries-and-escalation',
    'Troubleshoot a login failure safely',
    'Customer Priya cannot sign in. The account exists. The email on the account is priya@example.com. She says password-reset messages are not arriving. The email is not bounced in the support-visible delivery log, and there is no active account lock. Support is allowed to verify email spelling, resend the approved reset once, check known incidents, and collect timestamps/browser details. Support may not change account email or bypass identity verification.

Build the troubleshooting record and identify the escalation point.',
    'A troubleshooting log with symptom, approved checks, results, evidence, steps attempted, customer instructions, security boundary, escalation trigger, specialist handoff, and next checkpoint.',
    'Support troubleshooting and escalation log',
    'Ticket:
Symptom:
Account / product:
Known incident check:
Approved check:
Result:
Evidence:
Step attempted:
Result:
Customer instruction:
Sensitive action NOT allowed:
Escalate when:
Escalation team:
Evidence for escalation:
Owner:
Next checkpoint:
Status:',
    'Troubleshooting QA',
    array['Troubleshooting follows approved steps rather than improvising access changes.','Identity and account-security boundaries are preserved.','Each step records a result before another action is tried.','Known incidents are checked before treating the case as isolated.','Escalation includes useful evidence and reproduction details.','The customer receives a clear next step and checkpoint.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'refunds-credits-cancellations-and-policy-boundaries',
    'Prepare an exception request without granting it',
    'A customer asks to cancel a service 90 minutes after the stated cancellation cutoff because of a family emergency. Policy says cancellations after cutoff are normally charged in full. Support may document the request and ask a manager for an exception, but may not waive the fee.

The customer is polite and asks, "Can you please make an exception?" Write the response support can send now and the manager decision request.',
    'A policy-exception record with policy rule, customer circumstances, verified timing, action allowed now, customer reply, exception requested, decision owner, deadline, and post-decision follow-up.',
    'Refund / cancellation exception request',
    'Ticket:
Request:
Policy source:
Normal rule:
Relevant date / cutoff:
Verified customer circumstances:
Action support can take:
Action support cannot approve:
Customer reply before decision:
Exception requested:
Decision owner:
Decision needed by:
Evidence:
Post-decision follow-up:
Owner:
Status:',
    'Exception-request QA',
    array['The normal policy is stated accurately.','The customer''s circumstances are documented without exaggeration.','Support does not promise the exception.','The customer gets a respectful interim response.','The manager receives a concise decision request with evidence.','The case remains owned until the decision is communicated.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'complaints-angry-customers-and-de-escalation',
    'Handle a public refund complaint',
    'A customer posts publicly: "Northstar stole my money. Refund was approved and nothing is back on my card."

The ticket shows the refund was approved two business days ago. The current policy says posting time depends on the payment provider. The customer''s post includes the last four digits of their card. The public social channel is not approved for account-specific troubleshooting.

Prepare the public response, private follow-up, evidence check, and escalation decision.',
    'A complaint record with public reply, private-channel move, sensitive-data handling, verified facts, de-escalation approach, escalation criteria, internal note, owner, and next checkpoint.',
    'Complaint and de-escalation record',
    'Public channel:
Complaint:
Sensitive data exposed?:
Immediate moderation / privacy action:
Public reply:
Private-channel request:
Verified account facts:
What is not yet known:
Policy / source:
De-escalation action:
Escalate because:
Escalation owner:
Internal note:
Next checkpoint:
Status:',
    'Complaint-handling QA',
    array['The public reply does not expose account details.','Sensitive payment information is handled according to policy.','The response acknowledges the issue through action, not scripted empathy.','Verified refund facts are separated from posting-time uncertainty.','Escalation is based on policy/risk, not simply customer anger.','The internal record preserves what was said publicly and privately.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'sla-response-time-resolution-and-backlog',
    'Build a backlog recovery plan',
    'A Northstar product issue creates a spike from 40 to 180 open tickets. Of the 180: 72 mention the same error code, 18 involve account access, 9 involve duplicate charges, 31 are routine product questions, 22 are delivery/installer issues, and 28 appear to be duplicates of existing cases.

Management confirms a known-issue banner may be used, but support must still preserve individual account/payment cases and cannot bulk-close customers who need follow-up.',
    'A backlog recovery board with ticket segments, count, SLA/risk, bulk-safe action if any, excluded cases, owner, staffing/queue recommendation, progress metric, and recovery checkpoint.',
    'Support backlog recovery board',
    'Incident / backlog:
Baseline open:
Current open:
Segment:
Count:
SLA / risk:
Can use common response?:
Cases excluded from bulk handling:
Route / owner:
Immediate action:
Resolution criteria:
Progress metric:
Next checkpoint:
Escalation threshold:',
    'Backlog-recovery QA',
    array['Known-issue tickets are grouped without losing account-specific cases.','Security, payment, and time-sensitive service cases remain individually controlled.','Duplicate cases are linked rather than blindly closed.','SLA risk is visible by segment.','Recovery progress uses measurable counts or age, not vague impressions.','Every segment has an owner and resolution criterion.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'quality-assurance-and-support-coaching-notes',
    'Score a support case and coach the real gap',
    'Review this completed case:
• Customer requested a refund outside policy.
• Agent obtained manager approval in Slack.
• Agent issued the correct approved refund.
• Customer reply said, "We always make exceptions in cases like this."
• Ticket contains no link or note showing the manager approval.
• Status was set to Resolved.
• Customer received the correct amount.

Score accuracy, policy adherence, communication, documentation, and resolution quality. Then write one coaching note that is specific enough to change future behaviour.',
    'A support QA scorecard with evidence by criterion, score/rating, critical error flag if applicable, coaching priority, corrected example, and reviewer note.',
    'Support QA scorecard and coaching note',
    'Ticket:
Reviewer:
Criterion:
Expected standard:
Observed evidence:
Result / score:
Risk:
Critical error?:
Why:
Corrected handling:
Coaching priority:
Coaching note:
Follow-up check:
Overall result:',
    'Support-QA checklist',
    array['The review separates correct outcome from flawed process/documentation.','Scores cite observable evidence from the case.','Policy and approval evidence are evaluated explicitly.','The coaching note targets one clear behaviour change.','The corrected example does not invent policy.','The QA result can be audited by another reviewer.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'crm-and-cross-team-handoffs',
    'Hand an upgrade opportunity to Sales without losing support context',
    'Customer Greenline Studio has hit its current plan''s monthly usage limit three times in six weeks. Support has explained the current limit and temporary reset timing. The customer asks, "Is there a plan that won''t keep doing this?" Support can explain current-plan behaviour but pricing and plan recommendations belong to Sales.

Create the CRM note and handoff. Keep the original support issue visible until the handoff is accepted.',
    'A CRM + Sales handoff containing account context, verified usage history, support issue, customer intent, what support explained, commercial boundary, urgency, exact Sales follow-up requested, owner, and acceptance checkpoint.',
    'CRM cross-team handoff',
    'Account:
Contact:
Current plan:
Support issue:
Verified history:
Customer stated intent:
What support explained:
Commercial / specialist boundary:
Next team:
Requested action:
Urgency / timing:
CRM fields / tags:
Support ticket status:
Handoff owner:
Accepted by:
Next checkpoint:',
    'CRM-handoff QA',
    array['The handoff contains verified customer context rather than a vague ''upsell'' label.','Support does not quote or recommend unapproved pricing.','Customer intent is recorded in the customer''s own context.','The support case is not prematurely abandoned.','Sales receives an exact requested action and timing.','CRM and ticket status remain consistent.']::text[]
  ),
(
    'customer-support-virtual-assistant',
    'composite-customer-support-simulation',
    'Run the Northstar support shift',
    'It is 09:00 at Northstar Home Co. You inherit a live queue containing a duplicate charge, a late installer, an unknown compatibility question, a refund request outside policy, a mismatched-email password reset, a public refund complaint, and a known-product-issue backlog beginning to grow.

Run the queue through the first half of the shift. Use the supplied assessment evidence, keep customer communications consistent, preserve policy/security boundaries, and make every unresolved case handoff-ready.',
    'A complete support shift pack: triage board, customer replies, case notes, KB decision, troubleshooting log, policy-exception request, complaint record, backlog recovery board, QA review, CRM/cross-team handoff, and shift handoff summary.',
    'Support shift control pack',
    'SHIFT:
Agent:
Start:
Queue open:

TOP PRIORITIES
1.
2.
3.

CASE CONTROL
Ticket:
Priority:
Issue:
Owner:
Status:
Policy / KB:
Customer reply:
Internal note:
Escalation:
Next checkpoint:

QUEUE / BACKLOG
Open:
SLA risk:
Known issue:
Recovery action:

CROSS-TEAM HANDOFFS
Ticket:
Team:
Decision / action needed:
Accepted?:

END-OF-SHIFT
Resolved:
Pending:
Escalated:
Next owner:
Critical follow-up:
Evidence / links:',
    'Support simulation QA',
    array['Triage, replies, notes, and handoffs tell one consistent story.','Security, payment, refund, and policy boundaries are respected.','No unsupported arrival, refund, compatibility, or account promise is made.','Known-issue backlog work does not erase individual high-risk cases.','Every unresolved case has an owner and checkpoint.','The shift handoff lets another agent continue without reconstructing the queue.']::text[]
  ),
(
    'seo-virtual-assistant',
    'search-intent-crawling-indexing-and-rankings',
    'Diagnose why a live page has no search clicks',
    'BrightPath Accounting''s /services/payroll page is live and linked from navigation, but the client says it "gets no SEO traffic." The supplied crawl shows status 200, self-canonical, indexable, and in sitemap. Search Console shows impressions for "payroll outsourcing" but few clicks and average position 11.2. The H1 is "Payroll Solutions" and the title is "Business Services | BrightPath."

Build the diagnostic sequence before recommending a rewrite.',
    'A search-visibility diagnostic with indexability evidence, query/performance evidence, page-intent assessment, competing-page check, on-page mismatch, internal-link evidence, hypotheses, recommended next checks, and validation method.',
    'Search visibility diagnostic',
    'URL:
Business intent:
Status:
Indexability:
Canonical:
Sitemap:
GSC date / country / device:
Queries:
Clicks / impressions / CTR / position:
Current title:
Current H1:
Internal-link evidence:
Competing URLs:
Confirmed findings:
Hypotheses:
Next evidence to collect:
Recommended action:
Validation after change:',
    'Visibility-diagnostic QA',
    array['Indexability is checked before assuming content is the problem.','Search Console metrics include date and population context.','Observed evidence is separated from hypotheses.','Page intent and query intent are compared directly.','Competing pages and internal links are checked before rewriting.','Every recommendation has a validation step.']::text[]
  ),
(
    'seo-virtual-assistant',
    'keywords-topics-entities-and-cannibalization',
    'Build the bookkeeping intent and cannibalization map',
    'BrightPath has:
• /services/bookkeeping: commercial service page.
• /blog/small-business-bookkeeping: informational article with H1 "Small Business Bookkeeping Services."
• /bookkeeping-services-small-business: older landing page redirecting to /services/bookkeeping.

Search Console shows both the service page and article receiving impressions for "small business bookkeeping services." The article also ranks for informational queries such as "what does a bookkeeper do."

Determine whether this is harmful overlap, useful intent separation, or unresolved without more evidence.',
    'An intent/cannibalization map with query cluster, intended page, current ranking URLs, intent, business role, overlap evidence, risk, recommended architecture, and evidence still needed before consolidation.',
    'Keyword intent and cannibalization map',
    'Query / cluster:
Volume source / date:
Intent:
Business value:
Intended page:
Current ranking URL 1:
Current ranking URL 2:
Page type:
Evidence of overlap:
Useful separation?:
Risk:
Recommended architecture:
Consolidate / differentiate / monitor:
Evidence still needed:
Validation:',
    'Cannibalization-map QA',
    array['Intent is evaluated before assuming two ranking URLs are a problem.','The service page and article have distinct business roles where evidence supports it.','Redirected URLs are not treated as active competing pages.','Volume and rankings are tied to supplied evidence.','Consolidation is not recommended without considering traffic, links, and page purpose.','The proposed structure identifies one clear primary page per intent.']::text[]
  ),
(
    'seo-virtual-assistant',
    'keyword-research-and-opportunity-prioritization',
    'Prioritise BrightPath keyword opportunities',
    'Keyword export for Australia:
• bookkeeping services: volume 2,400, KD 42, commercial
• small business bookkeeping: 1,900, KD 38, mixed
• outsourced bookkeeping: 720, KD 31, commercial
• bookkeeping checklist: 1,300, KD 24, informational
• payroll outsourcing: 880, KD 35, commercial
• what does a bookkeeper do: 2,900, KD 29, informational
• virtual CFO services: 590, KD 47, commercial, service not currently offered

Client goal: qualified bookkeeping and payroll enquiries, not traffic alone.',
    'A keyword opportunity matrix scoring relevance, intent, existing-page fit, business value, difficulty/competition context, current visibility, conversion path, priority, and action.',
    'Keyword opportunity matrix',
    'Keyword:
Country:
Volume:
Difficulty:
Intent:
Service offered?:
Business relevance:
Existing page fit:
Current URL / position:
Conversion path:
Opportunity:
Priority:
Action:
Evidence source:
Do not target because:
Owner / next step:',
    'Keyword-priority QA',
    array['Priority is not determined by volume alone.','Queries for services the client does not offer are not forced into the roadmap.','Commercial and informational intent are distinguished.','Existing-page fit is checked before proposing new content.','Metrics retain source/country context.','Every selected opportunity maps to a realistic conversion path.']::text[]
  ),
(
    'seo-virtual-assistant',
    'serp-analysis-and-competitor-gap-research',
    'Turn SERP evidence into the right page recommendation',
    'For "small business bookkeeping services", BrightPath''s supplied SERP notes show:
1. Service page with pricing/process sections.
2. Service page + FAQ.
3. Comparison guide linking to a service.
4. Service page focused on small businesses.
5. Directory/listicle.
Most ranking pages explain who the service is for, scope, process, pricing approach, and FAQs. BrightPath''s service page has 300 words and no process, proof, FAQs, or internal links from related guides.

The client asks for a 3,000-word blog because competitors "have long pages."',
    'A SERP/gap research brief with observed result types, intent pattern, common coverage, differentiators, missing evidence/content, recommended page type, sections to add, what not to copy, and source notes.',
    'SERP and competitor gap brief',
    'Query:
Country / device / checked date:
Observed intent:
Result type pattern:
Result 1:
Result 2:
Result 3:
Common useful coverage:
BrightPath current-page gaps:
Unique business evidence available:
Recommended page type:
Recommended sections:
Internal-link opportunities:
Do NOT copy:
Open questions:
Source notes:',
    'SERP-research QA',
    array['Recommendations come from observed SERP patterns, not word-count imitation.','The proposed page type matches dominant intent.','Competitor content is analysed for function, not copied.','BrightPath-specific evidence and differentiators are identified.','Gaps are separated from optional nice-to-have sections.','The brief records country, device, and checked date.']::text[]
  ),
(
    'seo-virtual-assistant',
    'titles-meta-descriptions-headings-and-search-intent',
    'Write a clean on-page metadata specification',
    'BrightPath /services/bookkeeping currently has:
Title: "Bookkeeping Services for Small Business"
Meta: "Bookkeeping services bookkeeping solutions for small business bookkeeping needs."
H1: "Bookkeeping Solutions"
Primary commercial queries include "bookkeeping services", "small business bookkeeping services", and "outsourced bookkeeping."

Write a natural title, meta description, H1, and supporting heading direction without stuffing synonyms.',
    'An on-page metadata spec with target intent, primary/secondary query evidence, current fields, proposed title/meta/H1, rationale, character checks, implementation owner, and post-publish QA.',
    'On-page metadata specification',
    'URL:
Target intent:
Primary query:
Secondary query:
Current title:
Proposed title:
Title characters:
Current meta:
Proposed meta:
Meta characters:
Current H1:
Proposed H1:
Supporting heading direction:
Reasoning:
Owner:
Publish status:
Live QA:
Validation date:',
    'On-page spec QA',
    array['Title, meta, and H1 support the same page intent.','Keywords are used naturally rather than stacked.','The copy reflects the actual service and page content.','Metadata is written for qualified clicks, not just keyword inclusion.','Character checks are recorded without treating limits as rigid ranking rules.','Live implementation is verified after publishing.']::text[]
  ),
(
    'seo-virtual-assistant',
    'content-briefs-coverage-and-helpful-depth',
    'Build a useful bookkeeping service content brief',
    'The bookkeeping service page needs more depth. Available business facts:
• Monthly bookkeeping and catch-up work are offered.
• Client provides Xero and MYOB workflows.
• Typical onboarding requires access, prior reports, chart-of-accounts context, and agreed reporting cadence.
• Pricing varies by scope and requires a quote.
• BrightPath does not provide tax advice on the bookkeeping page.
• Related pages: payroll service and small-business bookkeeping guide.

Create a brief that helps a writer answer commercial intent without padding to an arbitrary word count.',
    'A content brief with search intent, audience, conversion goal, evidence/source constraints, section outline, questions to answer, internal links, entities/concepts, examples, CTA, exclusions, and QA criteria.',
    'SEO content brief',
    'Page:
Primary intent:
Audience:
Business goal:
Primary query:
Supporting queries:
Evidence / sources:
Writer must NOT claim:
Recommended structure:
H1:
H2:
Purpose:
Questions to answer:
Example / proof needed:
Internal links:
External source needs:
CTA:
Approximate depth based on task:
QA criteria:',
    'Content-brief QA',
    array['Every section serves the search task or conversion goal.','Word count is not used as a proxy for usefulness.','Unsupported tax/accounting claims are excluded.','Internal links connect relevant service and informational pages.','Business-specific evidence is separated from generic filler.','The brief gives the writer enough evidence and constraints to produce accurate copy.']::text[]
  ),
(
    'seo-virtual-assistant',
    'internal-linking-and-anchor-text',
    'Audit and prioritise internal-link opportunities',
    'BrightPath link opportunity file:
• /tax-guide → /services/bookkeeping, suggested anchor "bookkeeping services" appears in paragraph 6.
• /blog/small-business-bookkeeping → /services/bookkeeping, anchor "bookkeeping support" appears in paragraph 4.
• /services/payroll → /services/bookkeeping, suggested anchor "bookkeeping services" does not appear.
• /old-bookkeeping → /services/bookkeeping, source URL redirects.
• /services/bookkeeping → /services/bookkeeping, self-link recommendation.
• /about → /services/bookkeeping, anchor exists but paragraph is unrelated team-bio text.

QA the file and keep only links that improve navigation and topical context.',
    'An internal-link QA matrix with source, destination, source status, relevance, anchor present, anchor recommendation, duplicate/self-link checks, keep/reject decision, rationale, and implementation/validation status.',
    'Internal linking QA matrix',
    'Source URL:
Source status:
Destination URL:
Destination status:
Source topic:
Destination intent:
Suggested anchor:
Anchor exists?:
Natural context?:
Self-link?:
Duplicate recommendation?:
Keep / reject:
Reason:
Implementation owner:
Live validation:
Notes:',
    'Internal-link QA',
    array['Redirecting or invalid source URLs are rejected or replaced.','Self-links are removed.','Anchor recommendations match real source-page language or are explicitly proposed edits.','Relevance is judged in reading context, not keyword similarity alone.','Duplicate recommendations are controlled.','Kept links are validated on the live source and destination.']::text[]
  ),
(
    'seo-virtual-assistant',
    'canonicals-indexability-redirects-and-sitemap-basics',
    'Triage conflicting crawl and indexability signals',
    'Crawler evidence:
• /old-bookkeeping returns 301 → /bookkeeping → /services/bookkeeping and is still in sitemap.
• /thank-you returns 200, has noindex, self-canonical, and is in sitemap.
• /services/bookkeeping returns 200, indexable, self-canonical, and is in sitemap.
• /blog/small-business-bookkeeping returns 200, indexable, self-canonical.
Client says /thank-you should remain noindex and /old-bookkeeping should no longer be used.

Create developer-ready fixes without claiming Google has reprocessed anything yet.',
    'A technical SEO issue log with URL, observed signals, conflict, intended state, recommended correction, owner, implementation status, validation checks, and re-crawl status.',
    'Technical indexability and redirect issue log',
    'Issue ID:
URL:
HTTP status:
Indexability:
Canonical:
Sitemap:
Redirect target / chain:
Intended state:
Conflict:
Recommendation:
Developer / CMS owner:
Implementation status:
Live validation:
Crawler validation:
Search-engine reprocessing status:
Evidence date:
Notes:',
    'Technical-issue QA',
    array['Observed status, indexability, canonical, and sitemap signals are recorded separately.','The noindex thank-you page is removed from sitemap without making it indexable.','Redirect chains are shortened to the final intended destination.','Implementation is distinguished from search-engine reprocessing.','Recommendations match the client''s intended URL state.','Every fix has exact post-change validation checks.']::text[]
  ),
(
    'seo-virtual-assistant',
    'google-search-console-and-performance-analysis',
    'Analyse BrightPath Search Console without guessing the cause',
    'Australia desktop+mobile GSC comparison:

Last 28 days:
• /services/bookkeeping | bookkeeping services | 42 clicks | 6,200 impressions | 0.68% CTR | pos 8.4
• /services/bookkeeping | outsourced bookkeeping | 16 | 1,600 | 1.00% | 9.2
• /blog/small-business-bookkeeping | small business bookkeeping services | 31 | 5,100 | 0.61% | 7.9

Previous 28 days:
• /services/bookkeeping | bookkeeping services | 48 | 5,400 | 0.89% | 7.8
• /services/bookkeeping | outsourced bookkeeping | 14 | 1,300 | 1.08% | 9.7
• /blog/small-business-bookkeeping | small business bookkeeping services | 28 | 4,100 | 0.68% | 8.1

Explain what changed and what the data does not prove.',
    'A GSC performance analysis with filters/date ranges, row-level changes, query mix observations, CTR/position/impression interpretation, hypotheses, additional segmentation needed, recommended next action, and validation window.',
    'Search Console performance analysis',
    'Property:
Country:
Device:
Search type:
Current period:
Comparison period:

Page / query:
Clicks current / prior:
Impressions current / prior:
CTR current / prior:
Position current / prior:
Observed change:
What this proves:
What it does NOT prove:
Hypothesis:
Additional segment / check:
Recommended action:
Validation window:
Source export:',
    'GSC-analysis QA',
    array['Current and comparison populations are matched.','Absolute and relative changes are not confused.','CTR, impressions, position, and query mix are considered separately.','Average position is not treated as a fixed rank.','Causation is not claimed from correlation alone.','Next analysis or action is tied to a measurable validation window.']::text[]
  ),
(
    'seo-virtual-assistant',
    'seo-qa-reporting-and-change-validation',
    'Validate SEO work on production',
    'Developer ticket says:
• /old-bookkeeping redirect chain fixed.
• /thank-you removed from sitemap.
• Bookkeeping title updated.
• Two internal links added.

New live/crawl check shows:
• /old-bookkeeping now 301 directly to /services/bookkeeping.
• /thank-you is still present in sitemap.
• Bookkeeping title is updated in rendered HTML.
• One internal link is present; the second source page still has no link.

Write the QA result without marking the whole ticket "done."',
    'An SEO change-validation log with requested change, implementation evidence, live result, crawler result, status per item, discrepancy, owner, next action, re-crawl requirement, and client-facing status language.',
    'SEO change validation log',
    'Change ID:
URL / item:
Requested change:
Owner:
Claimed implemented date:
Live check:
Crawler check:
Rendered/source check:
Result: Verified live / Partial / Blocked / Not reproduced
Discrepancy:
Evidence:
Next action:
Next owner:
Re-crawl / reprocess needed:
Validation date:
Client-facing status:',
    'SEO-validation QA',
    array['Each requested change is validated separately.','A partially completed ticket is not labelled fully verified.','Live evidence is distinguished from crawl/search reprocessing.','Missing internal links and sitemap errors remain open.','Evidence includes the URL/item and validation date.','Client-facing status accurately reflects what is confirmed.']::text[]
  ),
(
    'seo-virtual-assistant',
    'responsible-ai-for-seo-work',
    'Audit an AI-generated SEO finding against real evidence',
    'An AI draft says:
"46 pages are missing H1s, 23 pages have duplicate titles, and the bookkeeping page should rank #1 after metadata updates."

Supplied crawler extract actually contains 60 URLs, 4 missing H1s, and 7 duplicate-title URLs. No ranking forecast evidence is supplied. The client policy allows AI for drafting/summarising redacted exports, but not private analytics exports containing customer identifiers.

Turn the AI output into a verified, safe work note.',
    'An AI-assisted SEO verification log showing model claim, supplied source, verified result, unsupported/invented statement, corrected wording, privacy check, human reviewer, and final action.',
    'AI-assisted SEO verification log',
    'SEO task:
AI tool approved?:
Input classification:
Sensitive data removed?:
AI claim:
Source of truth:
Verified result:
Unsupported / invented:
Corrected wording:
Recommendation:
Human reviewer:
Evidence:
Implementation owner:
Validation:
Final status:',
    'AI-verification QA',
    array['Every number in the final note traces to the supplied source.','Unsupported ranking promises are removed.','AI output is treated as draft analysis, not crawl evidence.','Client-data handling follows the approved tool policy.','A human reviewer owns the final recommendation.','The corrected note preserves uncertainty where evidence is incomplete.']::text[]
  ),
(
    'seo-virtual-assistant',
    'composite-seo-va-work-simulation',
    'Run the BrightPath SEO workstream',
    'BrightPath Accounting wants more qualified bookkeeping and payroll enquiries from Australia. You inherit a keyword export, Search Console comparison, crawl issue file, page evidence, internal-link opportunities, and a client brief.

Build one coherent SEO workstream from demand mapping through implementation QA. Do not invent live checks, traffic, search volume, rankings, links, or outcomes beyond the supplied evidence.',
    'A complete SEO portfolio: visibility diagnostic, intent/cannibalization map, keyword opportunity matrix, SERP/gap brief, on-page spec, content brief, internal-link QA matrix, technical issue log, GSC analysis, change-validation log, AI verification note, prioritised roadmap, and client handoff.',
    'SEO workstream control pack',
    'CLIENT:
Market:
Primary business goal:
Evidence date:

PRIORITY ROADMAP
Issue / opportunity:
Evidence:
Business value:
Effort / dependency:
Priority:
Owner:
Validation:

CORE ARTIFACTS
Visibility diagnostic:
Intent/cannibalization map:
Keyword matrix:
SERP brief:
On-page spec:
Content brief:
Internal links:
Technical log:
GSC analysis:
Change validation:
AI verification:

CLIENT HANDOFF
What evidence shows:
What is recommended:
What is implemented:
What remains uncertain:
Decisions needed:
Next measurement window:',
    'SEO simulation QA',
    array['Every major recommendation traces to supplied keyword, page, crawl, SERP, or GSC evidence.','Intent mapping, on-page work, internal links, and technical fixes do not contradict each other.','Recommendations are prioritised by business relevance as well as SEO opportunity.','Implementation status is separated from recommendation and search-engine reprocessing.','No metric, live check, ranking outcome, or source is invented.','The client handoff clearly states evidence, actions, owners, uncertainty, and validation.']::text[]
  )
),
targets as (
  select l.id, ps.*
  from practice_specs ps
  join public.training_courses c on c.slug=ps.course_slug
  join public.training_modules m on m.course_id=c.id
  join public.training_lessons l on l.module_id=m.id and l.slug=ps.lesson_slug
  where l.is_published=true
),
rebuilt as (
  select t.id,
    jsonb_agg(
      case
        when b.block->>'type'='exercise' then jsonb_build_object(
          'type','exercise','title',t.exercise_title,'text',t.exercise_text,'deliverable',t.deliverable
        )
        when b.block->>'type'='template' then jsonb_build_object(
          'type','template','title',t.template_title,'text',t.template_text
        )
        when b.block->>'type'='checklist' then jsonb_build_object(
          'type','checklist','title',t.checklist_title,'items',to_jsonb(t.checklist_items)
        )
        else b.block
      end order by b.ord
    ) as content
  from targets t
  join public.training_lessons l on l.id=t.id
  cross join lateral jsonb_array_elements(l.content) with ordinality b(block,ord)
  group by t.id
)
update public.training_lessons l
set content=r.content,
    content_version=l.content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
from rebuilt r
where l.id=r.id and l.content<>r.content;

update public.training_courses
set content_version=content_version+1,
    reviewed_by='Curriculum QA',
    last_reviewed_at=now(),
    updated_at=now()
where slug in ('customer-support-virtual-assistant','seo-virtual-assistant');

update public.training_assessments a
set instructions='Complete the Northstar Home Co. support-shift simulation as one coherent case-control pack.

You are responsible for the 09:00 queue through the first half of the shift. Use only the supplied evidence and approved policy. Keep replies, internal notes, ticket status, escalation, and handoffs consistent.

Submit:
1. Six-plus-ticket triage board with SLA and priority reasoning.
2. Customer replies for the duplicate charge, late installer, delayed express order, refund exception, and public refund complaint.
3. One consolidated omnichannel case record.
4. Billing handoff for the duplicate-charge case.
5. KB/source-of-truth decision for the stale refund macro.
6. Login troubleshooting and security escalation log.
7. Refund/cancellation policy-exception request.
8. Public complaint/de-escalation record.
9. Backlog recovery board for the known product issue.
10. QA scorecard and coaching note for the supplied completed case.
11. CRM/cross-team handoff for an upgrade opportunity.
12. End-of-shift handoff with every unresolved case assigned to an owner and checkpoint.

Do not approve refunds, credits, account changes, compatibility claims, commercial terms, or policy exceptions outside the documented authority. Do not expose account/payment information in public channels.',
    rubric='[{"id":"triage","label":"Queue triage and SLA judgment","weight":20,"description":"Prioritises by customer consequence, security/payment risk, time sensitivity, and documented SLA rather than tone or arrival order."},{"id":"communication","label":"Customer communication accuracy","weight":20,"description":"Writes clear responses grounded in verified facts, with useful next steps and no unsupported promises."},{"id":"policy","label":"Policy, privacy, and security boundaries","weight":20,"hard_fail":true,"description":"Uses approved policies and protects refund, payment, account-security, privacy, and exception boundaries."},{"id":"casework","label":"Case records and troubleshooting","weight":15,"description":"Maintains usable notes, evidence, troubleshooting steps, tags/statuses, and one source of truth."},{"id":"handoff","label":"Escalation and cross-team handoff","weight":15,"description":"Escalates with the exact decision/action needed and preserves ownership until the next team accepts."},{"id":"recovery","label":"Backlog, QA, and shift continuity","weight":10,"description":"Handles queue spikes, reviews quality with evidence, and leaves a handoff another agent can continue."}]'::jsonb,
    resource_pack='[{"id":"queue","kind":"csv","title":"Northstar live support queue","content":"ticket,received,customer,issue,sla,status\nA,09:00,Ana Cruz,Duplicate card charge,2h,New\nB,09:03,Liam Wong,Installer late for 09:30 booking,1h,New\nC,09:05,Jo Reyes,Compatibility question not in KB,4h,New\nD,09:10,Mika Tan,Refund outside policy,4h,New\nE,09:12,Priya Shah,Password reset from mismatched email,1h,New\nF,09:14,Daniel Lee,Express delivery delayed,4h,New\nG,09:18,Maya Santos,Public complaint about refund delay,2h,New"},{"id":"policies","kind":"document","title":"Northstar support policy excerpts","content":"Refunds: standard window is 30 days unless a manager exception is documented.\nRefund posting: timing depends on payment provider; never promise a fixed posting date.\nAccount security: do not disclose or change account access when identity signals conflict.\nCompatibility: if a model is absent from the approved matrix, escalate to Product.\nInstaller delay: confirm Dispatch status before promising arrival time.\nDuplicate charge: Support verifies transaction evidence; Billing decides void/refund action.\nPublic channels: move account-specific investigation to approved private channels.\nCancellation after cutoff: Support may request an exception but may not waive fees."},{"id":"account","kind":"csv","title":"Order and account evidence","content":"ticket,record,evidence\nA,Order NHC-1009,Two $189 card captures one minute apart\nB,Booking NHC-I442,Installer assigned; no arrival scan at 09:20\nC,Product P-88,Customer asks about model M-201; M-201 absent from matrix\nD,Order NHC-0991,Purchase 37 days ago; no manager exception note\nE,Account 5442,Account email priya@example.com; request came from other address\nF,Order NHC-1842,Carrier delay scan; no new delivery date\nG,Refund RF-772,Approved two business days ago; provider posting time unknown"},{"id":"backlog","kind":"csv","title":"Known-issue backlog snapshot","content":"segment,count\nKnown error-code tickets,72\nAccount access,18\nDuplicate charges,9\nRoutine product questions,31\nDelivery or installer issues,22\nLikely duplicates,28"},{"id":"kb","kind":"document","title":"Knowledge base and macro conflict","content":"Current KB reviewed last month: approved refund posting time depends on payment provider; do not promise a fixed date.\nSaved macro, no review date: \"Approved refunds appear within five business days.\"\nKnown-issue banner is approved for the current product error, but individual security/payment cases still require case-level handling."},{"id":"qa-case","kind":"document","title":"Completed case for QA review","content":"Refund outside policy. Manager approved exception in Slack. Agent issued correct refund. Customer reply said \"we always do this.\" Ticket has no link or note showing approval. Ticket was marked Resolved."},{"id":"sla","kind":"policy","title":"Support SLA and ownership rules","content":"Security and installer-critical cases: first action within 1 hour.\nBilling duplicate-charge cases: 2 hours.\nStandard support/product/refund: 4 hours unless another documented rule applies.\nHandoffs remain owned by Support until the receiving team accepts or the client''s documented workflow transfers ownership automatically."}]'::jsonb,
    updated_at=now()
from public.training_courses c
where a.course_id=c.id and c.slug='customer-support-virtual-assistant' and a.is_published=true;

update public.training_assessments a
set instructions='Complete the BrightPath Accounting SEO workstream simulation as one coherent evidence-based portfolio.

Market: Australia. Business goal: qualified bookkeeping and payroll enquiries. Use only the supplied keyword, page, SERP, crawler, internal-link, Search Console, and implementation evidence.

Submit:
1. Search-visibility diagnostic for the payroll service page.
2. Intent/cannibalization map for bookkeeping queries and URLs.
3. Keyword opportunity matrix with business-fit prioritisation.
4. SERP and competitor-gap research brief.
5. On-page metadata/H1 specification for /services/bookkeeping.
6. Content brief for the bookkeeping service page.
7. Internal-link QA matrix.
8. Technical indexability/redirect issue log.
9. Search Console current-vs-previous analysis.
10. SEO implementation/change-validation log.
11. AI-assisted SEO verification log.
12. Prioritised roadmap and client-ready handoff.

Separate observations from hypotheses, recommendations from implementation, and live implementation from search-engine reprocessing. Do not invent search volume, rankings, traffic, links, live checks, or causal claims.',
    rubric='[{"id":"evidence","label":"SEO evidence discipline","weight":20,"hard_fail":true,"description":"Uses only supplied or verified keyword, page, crawl, SERP, and Search Console evidence and does not invent metrics, live checks, sources, or outcomes."},{"id":"intent","label":"Intent, architecture, and opportunity judgment","weight":20,"description":"Maps demand to the right page types, identifies overlap carefully, and prioritises opportunities by business relevance as well as search demand."},{"id":"content","label":"On-page, content, and internal-link execution","weight":20,"description":"Produces usable metadata, briefs, and internal-link recommendations that match intent and avoid stuffing or filler."},{"id":"technical","label":"Technical SEO triage and QA","weight":15,"description":"Separates status, indexability, canonical, sitemap, redirect, and implementation states and defines exact validation."},{"id":"measurement","label":"Search Console analysis and reporting","weight":15,"description":"Uses matched populations and distinguishes observations, hypotheses, implementation, and reprocessing."},{"id":"handoff","label":"Prioritisation and client handoff","weight":10,"description":"Creates a decision-ready roadmap with owners, dependencies, uncertainty, and measurement windows."}]'::jsonb,
    resource_pack='[{"id":"keywords","kind":"csv","title":"AU keyword export","content":"keyword,volume,kd,intent\nbookkeeping services,2400,42,Commercial\nsmall business bookkeeping,1900,38,Mixed\noutsourced bookkeeping,720,31,Commercial\nbookkeeping checklist,1300,24,Informational\npayroll outsourcing,880,35,Commercial\nwhat does a bookkeeper do,2900,29,Informational\nvirtual CFO services,590,47,Commercial"},{"id":"gsc","kind":"csv","title":"Search Console 28-day comparison","content":"period,page,query,clicks,impressions,ctr,position\ncurrent,/services/bookkeeping,bookkeeping services,42,6200,0.68%,8.4\nprevious,/services/bookkeeping,bookkeeping services,48,5400,0.89%,7.8\ncurrent,/services/bookkeeping,outsourced bookkeeping,16,1600,1.00%,9.2\nprevious,/services/bookkeeping,outsourced bookkeeping,14,1300,1.08%,9.7\ncurrent,/blog/small-business-bookkeeping,small business bookkeeping services,31,5100,0.61%,7.9\nprevious,/blog/small-business-bookkeeping,small business bookkeeping services,28,4100,0.68%,8.1\ncurrent,/services/payroll,payroll outsourcing,18,2400,0.75%,11.2"},{"id":"crawl","kind":"csv","title":"Crawler and indexability extract","content":"url,status,indexability,canonical,sitemap,issue\n/old-bookkeeping,301,Non-indexable,/services/bookkeeping,yes,Redirect chain via /bookkeeping\n/thank-you,200,Noindex,/thank-you,yes,Noindex in sitemap\n/services/bookkeeping,200,Indexable,/services/bookkeeping,yes,Weak internal links\n/blog/small-business-bookkeeping,200,Indexable,/blog/small-business-bookkeeping,yes,Intent overlap\n/services/payroll,200,Indexable,/services/payroll,yes,Generic title/H1"},{"id":"pages","kind":"document","title":"BrightPath page evidence","content":"/services/bookkeeping: commercial service page. Title \"Bookkeeping Services for Small Business\"; meta repetitive; H1 \"Bookkeeping Solutions\". Offers monthly bookkeeping and catch-up work.\n/blog/small-business-bookkeeping: informational guide. H1 \"Small Business Bookkeeping Services\". Covers what bookkeeping is and common tasks.\n/services/payroll: service page. Title \"Business Services | BrightPath\"; H1 \"Payroll Solutions\".\nClient offers bookkeeping and payroll, but not virtual CFO services. Goal is qualified enquiries, not traffic alone."},{"id":"internal-links","kind":"csv","title":"Internal link opportunity file","content":"source,destination,suggested_anchor,note\n/tax-guide,/services/bookkeeping,bookkeeping services,Anchor exists in relevant paragraph\n/blog/small-business-bookkeeping,/services/bookkeeping,bookkeeping support,Anchor exists\n/services/payroll,/services/bookkeeping,bookkeeping services,Anchor not present\n/old-bookkeeping,/services/bookkeeping,bookkeeping services,Source redirects\n/services/bookkeeping,/services/bookkeeping,bookkeeping services,Self-link\n/about,/services/bookkeeping,bookkeeping services,Anchor context unrelated"},{"id":"serp","kind":"document","title":"SERP notes: small business bookkeeping services","content":"Australia search notes, checked for the exercise dataset.\nTop result patterns include service pages with process/pricing/FAQ coverage, one comparison guide linking to a service, and a directory/listicle. Common useful coverage: audience, scope, process, pricing approach, proof, FAQs. BrightPath''s service page is currently thin and lacks process, proof, FAQs, and contextual internal links."},{"id":"implementation","kind":"document","title":"SEO implementation QA claims","content":"Developer says /old-bookkeeping redirect chain fixed, /thank-you removed from sitemap, bookkeeping title updated, and two internal links added.\nValidation snapshot: /old-bookkeeping now redirects directly to /services/bookkeeping; /thank-you still appears in sitemap; bookkeeping title is updated in rendered HTML; one internal link is present and the second is missing."}]'::jsonb,
    updated_at=now()
from public.training_courses c
where a.course_id=c.id and c.slug='seo-virtual-assistant' and a.is_published=true;
