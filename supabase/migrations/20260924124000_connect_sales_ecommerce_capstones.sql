-- Connect Sales & Lead Generation and E-commerce final assessments to coherent fictional work environments.
-- Data-only curriculum update. Preserve course, lesson, assessment, and learner-progress IDs.

update public.training_assessments a
set
  instructions = $txt$Complete the Harborline Growth Partners sales-support simulation as one coherent portfolio.

Harborline sells outsourced operations support to Australian service businesses with 10–80 staff. You support prospect research, CRM hygiene, outreach operations, reply triage, qualification support, appointment setting, and sales reporting. You do not negotiate pricing, invent fit/intent, override suppression, promise results, or make qualification decisions outside the approved criteria.

Submit:
1. ICP and funnel-stage matrix using the supplied targeting brief.
2. Prospect data-quality audit covering duplicates, stale contacts, suppression, source gaps, and unnecessary personal data.
3. Six-account prospect research sheet using only approved business evidence.
4. CRM dedupe/enrichment plan that preserves history and suppression.
5. Three outreach personalisation briefs using verified context only.
6. Reply-triage and sequence-control board.
7. Qualification/discovery handoff separating confirmed facts from unknowns.
8. Appointment-setting and no-show recovery record.
9. CRM stage/owner/task correction log.
10. Sensitive-reply escalation record for opt-out/data-source, pricing, and technical questions.
11. Funnel and data-quality report with numerator/denominator, trusted vs untrusted metrics, observations, hypotheses, and next investigation.
12. End-of-shift sales-support handoff.

Use only the supplied fictional evidence. A complete CRM row is not automatically qualified, an ICP match is not automatically interested, a booked meeting is not automatically an opportunity, and reply volume is not automatically pipeline quality. Preserve opt-outs and prior history.$txt$,
  resource_pack = jsonb_build_array(
    jsonb_build_object(
      'id','icp','kind','document','title','Harborline ICP and funnel rules',
      'content',$r$Target geography: Australia
Target company type: service businesses
Preferred staff range: 10–80
Preferred industries: trades services, allied professional services, property services, business services
Explicit exclusions: gambling, adult services, direct competitors
Approved fit evidence: current website/business profile, geography, service category, employee-size evidence when available
Approved buying-context examples: announced expansion, hiring operations staff, new location, visible systems/process growth
Do not infer pain, budget, intent, urgency, or decision authority from fit alone.

Funnel:
Prospect = fits research criteria but no engagement required.
Lead = approved record entered into Harborline outreach/inbound process.
Qualified = meets approved fit criteria AND supplied discovery criteria have been confirmed.
Opportunity = salesperson has confirmed a commercial next step.
Customer = agreement/purchase is completed.$r$
    ),
    jsonb_build_object(
      'id','prospects','kind','csv','title','Prospect research and data-quality sample',
      'content',$r$record_id,company,contact,role,source,checked_date,status,suppression,note
P01,Alpha Field Services,Jamie King,Operations Manager,Company site,2026-09-20,New,false,Company fits geography and service category
P02,Alpha Field Services,Jamie King,Operations Manager,Import,2025-11-02,Duplicate,false,Older duplicate
P03,Beacon Co,Lee Tran,Founder,Directory,2026-09-18,New,false,Staff count unverified
P04,CoreBuild,Maria Diaz,General Manager,Conference list,2026-06-01,Do not contact,true,Prior opt-out
P05,Delta Works,Ravi Singh,Assistant,Company site,2026-09-21,New,false,Role likely not decision owner
P06,Evergreen Services,Sam Cole,Operations Lead,LinkedIn,2024-12-10,New,false,Employment may be stale
P07,Fleetwise Group,,Head of Operations role,Company careers page,2026-09-22,New,false,Named contact not verified
P08,Greenstone Property Care,A. Morgan,Director,CRM,2026-09-19,Existing,false,Existing CRM history present
P09,Horizon Trade Services,Chris Yu,Owner,Public website,2026-09-21,New,false,Expansion announcement verified
P10,Ironwood Services,Pat Lee,Manager,Unknown,,Imported,false,No source retained$r$
    ),
    jsonb_build_object(
      'id','crm','kind','csv','title','CRM duplicate and stage extract',
      'content',$r$record_id,company,contact,stage,owner,next_task,suppression,last_activity,issue
C101,Alpha Field Services,Jamie King,New,Erin,Research,false,2026-09-20,Possible duplicate P02
C102,Alpha Field Services,Jamie King,Lead,Erin,Follow up,false,2025-11-02,Older duplicate and stale title
C103,Beacon Co,Lee Tran,Proposal,Sam,,false,2026-09-22,No proposal evidence
C104,Greenstone Property Care,A. Morgan,Qualified,,,false,2026-09-23,No owner or next task
C105,CoreBuild,Maria Diaz,Lead,Erin,Send follow-up,true,2026-06-01,Suppressed but active task exists
C106,Horizon Trade Services,Chris Yu,Closed Lost,Sam,Re-open,false,2026-09-21,Reopened without new engagement$r$
    ),
    jsonb_build_object(
      'id','replies','kind','document','title','Live outreach reply queue',
      'content',$r$1. Horizon Trade Services: "Interested. Can we speak next week?"
2. Fleetwise Group: "Please contact our Head of Operations instead."
3. Delta Works: "Not interested."
4. CoreBuild: "Remove me immediately. Also, where did you get my details?"
5. Beacon Co: "Can you send pricing before I book anything?"
6. Evergreen Services: "I no longer work there."
7. Alpha Field Services: "Happy to chat but I am not the budget owner."
8. Ironwood Services: "What integrations do you guarantee?"$r$
    ),
    jsonb_build_object(
      'id','qualification','kind','document','title','Qualification and booking notes',
      'content',$r$Horizon Trade Services
- Australian service business
- 34 staff from current company profile
- Contact confirmed current operations bottleneck during reply exchange
- Timing: wants to review support options this quarter
- Contact can recommend vendors but is not final budget approver
- Budget not discussed
- Requests discovery call next week
- Sales owner: Sam
- Sam is in Sydney; prospect asks for Tuesday 10:00 but did not state a time zone
- Approved no-show cadence: one same-day rebooking message, one follow-up after 2 business days, then stop unless prospect replies.$r$
    ),
    jsonb_build_object(
      'id','outreach','kind','document','title','Approved outreach claims and boundaries',
      'content',$r$Approved offer: 30-minute discovery call
Approved proof: Harborline supports Australian service businesses with documented operations/admin workflows.
Do not claim guaranteed savings, guaranteed hires, guaranteed response times, or guaranteed integration compatibility.
Do not imply you personally know the prospect.
Do not say you read an article, attended an event, or spoke to a colleague unless that is true and documented.
Pricing exceptions and technical capability commitments require the sales owner.$r$
    ),
    jsonb_build_object(
      'id','metrics','kind','csv','title','Weekly sales-support funnel extract',
      'content',$r$metric,current_week,previous_week
Prospects researched,196,140
Valid business contacts,142,125
Outreach sent,130,93
Replies,8,11
Interested_or_referral_replies,3,4
Meetings booked,4,4
Qualified leads,2,3
Invalid_or_stale_contacts,26,12
Duplicates_found,18,7
Opt_outs,5,2$r$
    ),
    jsonb_build_object(
      'id','rules','kind','policy','title','Harborline sales-support rules',
      'content',$r$Respect suppression and opt-outs immediately.
Record source and checked date when prospect data may need verification.
Do not fabricate contact details, company facts, personalization, intent, pain points, or relationships.
Do not negotiate pricing, make technical guarantees, or promise results.
Qualification must use the approved criteria and verified evidence.
A salesperson owns commercial discovery, negotiation, proposal, and opportunity decisions.
Sensitive complaints about data sourcing or privacy must be escalated with the original message preserved.$r$
    )
  ),
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'sales-lead-generation-virtual-assistant'
  and a.is_published = true;

update public.training_assessments a
set
  instructions = $txt$Complete the Marlow Home multi-channel store-operations simulation as one coherent portfolio.

Marlow Home sells furniture and homewares through its direct store and one marketplace. You support product data, listing QA, order exceptions, fulfilment communication, returns administration, customer-service records, inventory monitoring, promotion QA, marketplace handoffs, and daily reporting. You do not invent stock, override fraud review, approve unauthorized refunds, change commercial policy, or make unsupported delivery/pricing promises.

Submit:
1. Store-system and order-flow map showing source systems and owners.
2. Product/SKU source record resolving the duplicate-SKU problem before any catalog change.
3. Product-page QA sheet for the supplied listing defects.
4. Bulk catalog change plan with rollback and sample validation.
5. Prioritized order-exception queue.
6. Delivered-not-received investigation record.
7. Return/refund decision sheet including the out-of-policy escalation.
8. Omnichannel customer-case record consolidating duplicate support conversations.
9. Inventory discrepancy report using ERP/warehouse/marketplace evidence.
10. Promotion launch QA with a clear go/no-go decision.
11. Marketplace/store operations handoff with data-quality caveats.
12. End-of-shift control-desk summary.

Use only the supplied fictional evidence. Keep product-data truth, customer communication, inventory integrity, policy boundaries, promotion safety, and marketplace-specific state explicit. A cached marketplace count is not the inventory source of truth, a carrier "delivered" scan does not prove what happened at the doorstep, and revenue growth does not prove store operations are healthy.$txt$,
  resource_pack = jsonb_build_array(
    jsonb_build_object(
      'id','systems','kind','document','title','Marlow Home store systems and authority',
      'content',$r$Direct store: customer-facing catalog, checkout, order status
ERP: approved inventory source of truth
Warehouse portal: physical count and fulfilment status
Help desk: customer conversations and support history
Marketplace: separate cached listing/inventory state
Carrier portal: shipment events

VA may: prepare/QA product changes, process routine policy-based admin, investigate records, communicate verified status, maintain exception queues.
VA may not: invent stock, force fraud-review orders, approve out-of-policy refunds, alter commercial policy, authorize purchasing, or promise unsupported delivery outcomes.$r$
    ),
    jsonb_build_object(
      'id','catalog','kind','csv','title','Catalog and listing QA extract',
      'content',$r$sku,title,price,erp_inventory,store_inventory,marketplace_inventory,url,issue
LAMP-BLK,Black Lamp,89,0,14,0,/lamp-black,Duplicate SKU exists
LAMP-BLK,Matte Black Lamp,89,14,14,0,/black-lamp,Duplicate SKU exists
RUG-200,Rug 200cm,149,6,6,6,/rug-200,None
DESK-WHT,White Desk,399,2,2,2,/desk-white,Marketplace title missing finish
CHAIR-OAK,Oak Chair,249,8,8,3,/chair-oak,Marketplace count stale
SHELF-ARC,Arc Shelf,179,12,12,12,/shelf-arc,Product page uses old dimensions$r$
    ),
    jsonb_build_object(
      'id','orders','kind','csv','title','Order exception queue',
      'content',$r$order,sku,status,issue,customer_contact
#4102,LAMP-BLK,Paid,ERP shows zero on one duplicate SKU,true
#4103,CHAIR-OAK,Shipped,Customer requests address change,true
#4104,RUG-200,Delivered,Customer says not received,true
#4105,DESK-WHT,Paid,Platform fraud review,false
#4106,SHELF-ARC,Paid,Warehouse delayed 3 days,true
#4107,CHAIR-OAK,Delivered,Customer requests return outside standard window,true$r$
    ),
    jsonb_build_object(
      'id','support','kind','document','title','Customer and support history',
      'content',$r$Order #4104
Email: customer says parcel is not at front door and asks for replacement.
Marketplace message: same customer says carrier marked delivered but parcel is missing.
Carrier scan: Delivered 14:07, no photo in supplied evidence.
Approved process: confirm address/order, check carrier evidence, ask customer to check safe locations/neighbours where appropriate, open carrier investigation if unresolved. Do not accuse customer or guarantee replacement before policy/owner decision.

Order #4107
Customer says previous agent "said an exception would be fine."
No approval note exists in the help desk.
Standard return window has expired.$r$
    ),
    jsonb_build_object(
      'id','inventory','kind','csv','title','Inventory and warehouse evidence',
      'content',$r$sku,erp_count,warehouse_count,marketplace_count,last_erp_update,last_warehouse_count
LAMP-BLK,14,14,0,2026-09-24 08:10,2026-09-24 07:55
RUG-200,6,6,6,2026-09-24 08:10,2026-09-24 07:50
DESK-WHT,2,2,2,2026-09-24 08:10,2026-09-24 07:52
CHAIR-OAK,8,5,3,2026-09-24 08:10,2026-09-24 08:02
SHELF-ARC,12,12,12,2026-09-24 08:10,2026-09-24 07:58$r$
    ),
    jsonb_build_object(
      'id','promotion','kind','document','title','Weekend promotion brief and QA cases',
      'content',$r$Promotion: Home Refresh Weekend
Approved discount: 15% off eligible furniture
Start: Friday 18:00 AEST
End: Sunday 23:59 AEST
Excluded: Arc Collection, gift cards, clearance
Stacking: cannot combine with other discount codes
Test defect: Arc Shelf is receiving 15% discount in staging.
Test defect: an existing 10% welcome code stacks with the promotion.
Customer-facing email says "15% off everything" even though exclusions exist.$r$
    ),
    jsonb_build_object(
      'id','policy','kind','policy','title','Store exception policy',
      'content',$r$Address changes after shipment require the carrier workflow and are not guaranteed.
Refunds outside standard policy require manager approval.
Fraud-review orders must not be manually forced through.
Inventory source of truth is ERP; discrepancies with warehouse or marketplace must be investigated.
Delivered-not-received cases follow evidence-based carrier/customer investigation.
Pricing and promotions must match approved eligibility, exclusions, dates, and stacking rules.
Marketplace status may lag direct-store/ERP state; do not overwrite source data merely to make systems agree.$r$
    ),
    jsonb_build_object(
      'id','report','kind','csv','title','Daily store operations metrics',
      'content',$r$metric,today,previous_comparable_day
Orders,184,161
Revenue,42800,37100
Refund_value,4200,2100
Orders_awaiting_fulfilment,27,15
Shipping_exceptions,11,6
Support_open_cases,38,23
Low_stock_SKUs,9,5
Inventory_discrepancies,6,2
Marketplace_sync_issues,4,1$r$
    )
  ),
  updated_at = now()
from public.training_courses c
where a.course_id = c.id
  and c.slug = 'ecommerce-virtual-assistant'
  and a.is_published = true;

update public.training_courses
set
  content_version = content_version + 1,
  reviewed_by = 'Curriculum QA',
  last_reviewed_at = now(),
  updated_at = now()
where slug in (
  'sales-lead-generation-virtual-assistant',
  'ecommerce-virtual-assistant'
);
