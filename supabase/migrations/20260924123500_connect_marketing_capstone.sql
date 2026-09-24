-- Connect the Marketing VA capstone into one evidence-based campaign operations portfolio.
update public.training_assessments a
set
  instructions = $txt$Complete the North & Pine Home Arc Shelving Collection campaign-operations simulation as one coherent portfolio.

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

Use only the supplied fictional evidence. Do not invent approval, customer consent, pricing, claims, attribution, tracking, performance causes, or campaign outcomes. Preserve the boundary between recommendation, approval, scheduled state, live state, and verified post-launch result.$txt$,
  resource_pack = jsonb_build_array(
    jsonb_build_object(
      'id','brief','kind','document','title','Arc campaign brief and decision log',
      'content',$r$Brand: North & Pine Home
Campaign: Arc Shelving Collection
Objective: qualified design-consult bookings
Audience: Australian homeowners and interior designers
Approved offer: free 20-minute storage planning consultation
Primary CTA: Book a planning consultation
Approved launch target: Friday 09:00 AEST, pending final founder confirmation
Approver: founder for claims/offers; marketing lead for execution
Approved facts: modular shelving collection; consultation is free; no guaranteed savings/performance claims.
Open decision: final paid-ad claim approval.
Old email still says Thursday launch; designer chat says Monday.$r$
    ),
    jsonb_build_object(
      'id','production','kind','csv','title','Arc campaign production board',
      'content',$r$asset,status,owner,dependency,issue
Landing page,Ready,Web,None,CTA links to staging
Launch email,Draft,Marketing,Landing page,Old $799 price in footer
Reminder email,Draft,Marketing,Landing page,UTM campaign blank
Instagram carousel,Approved,Design,Final pricing,Slide 4 shows $799
Facebook video,Approved,Design,None,None
Sales one-pager,Review,Sales Ops,Founder approval,No approval recorded
Booking confirmation,Ready,Ops,Booking form,None$r$
    ),
    jsonb_build_object(
      'id','crm','kind','csv','title','Arc CRM segment sample',
      'content',$r$contact_id,state,status,customer_status,email_opt_in,suppression,email
101,NSW,Active,Prospect,true,false,a@example.com
102,VIC,Active,Prospect,true,false,b@example.com
103,NSW,Inactive,Prospect,true,false,c@example.com
104,NSW,Active,Customer,true,false,d@example.com
105,VIC,Active,Prospect,false,true,e@example.com
106,,Active,Prospect,true,false,f@example.com
107,VIC,Active,Prospect,true,false,b@example.com$r$
    ),
    jsonb_build_object(
      'id','email','kind','document','title','Launch email readiness notes',
      'content',$r$Scheduled: Thursday 16:00 AEST
Subject: Meet the Arc Shelving Collection
CTA: Book a planning consultation
Destination: final landing page
Footer price: $799
Approved current price source: $849
UTM source=email
UTM medium=email
UTM campaign is blank
List export includes unsubscribed/suppressed rows unless excluded by final segment
Internal test recipients: qa@northpine.example and marketing@northpine.example$r$
    ),
    jsonb_build_object(
      'id','leads','kind','csv','title','First launch enquiries',
      'content',$r$lead_id,source,enquiry,known_context
L1,Landing page,Booked consultation,Homeowner NSW
L2,Landing page,Booked consultation,Homeowner VIC
L3,Email,Asks current price,Prospect NSW
L4,Landing page,Existing customer asks about damaged item,Existing customer
L5,Facebook,Interior designer asks trade terms,Trade prospect$r$
    ),
    jsonb_build_object(
      'id','performance','kind','csv','title','First-week campaign performance',
      'content',$r$metric,current,previous
Landing page sessions,12000,8900
CTA clicks,410,360
Bookings,96,70
Qualified consultations,41,34
Sales opportunities,14,11
Closed deals,3,2
Email bookings,48,NA
Organic social bookings,18,NA
Paid social bookings,21,NA
Direct/unknown bookings,9,NA$r$
    ),
    jsonb_build_object(
      'id','ai','kind','document','title','AI-assisted draft excerpt',
      'content',$r$Draft generated in approved AI tool:
"Australia's favourite storage brand."
"Save 40% of your time."
Customer quote: "Arc changed our whole home."
CTA rewritten to: "Buy now."
No source in the campaign brief supports the superlative, time-saving claim, or customer quote. Approved CTA is Book a planning consultation.$r$
    )
  ),
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'marketing-virtual-assistant'
  and a.is_published = true;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug = 'marketing-virtual-assistant';
