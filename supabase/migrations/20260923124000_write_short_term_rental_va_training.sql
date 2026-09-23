-- Write the existing Airbnb / Short-Term Rental Virtual Assistant course.
-- Platform details change over time; course remains draft until human review.

update public.training_courses
set
  summary = 'A practical short-term-rental operations course for Virtual Assistants covering reservations, calendars, guest messaging, turnover, maintenance, rates, reviews, vendor coordination, multi-property handoffs, and owner reporting.',
  estimated_minutes = 300,
  status = 'draft',
  published_at = null,
  last_reviewed_at = null,
  reviewed_by = null,
  trademark_disclaimer = 'VirtualAssistant.com.ph is not affiliated with or endorsed by Airbnb. Airbnb is a trademark of its respective owner. Platform features, permissions, and policies can change, so learners should follow the property owner’s approved workflow and current platform guidance.',
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '20000000-0000-4000-8000-000000000015';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Understand the full guest journey before managing individual tasks"},{"type":"paragraph","text":"Short-term rental operations move through a repeatable lifecycle: inquiry, booking, pre-arrival preparation, check-in, stay support, checkout, turnover, review, and owner reporting. A strong VA knows which stage a reservation is in, what should happen next, and which team or vendor owns each action."},{"type":"heading","text":"Typical booking lifecycle"},{"type":"steps","items":["Inquiry or booking request","Reservation confirmed","Guest details and special requests reviewed","Pre-arrival instructions prepared","Property readiness confirmed","Check-in supported","In-stay issues handled","Checkout completed","Turnover and inspection completed","Review and follow-up recorded"]},{"type":"heading","text":"Channel awareness matters"},{"type":"paragraph","text":"A property may receive reservations from Airbnb, another booking platform, a direct-booking site, or an internal property-management system. Follow the client’s source-of-truth rules. Do not treat every channel as if it has identical cancellation, payment, messaging, or modification workflows."},{"type":"list","items":["Know which system owns the reservation record.","Know which channel owns guest communication.","Know which platform or system controls changes and cancellations.","Know where fees, payouts, and reservation status are verified.","Know what the VA may change directly and what requires owner approval."]},{"type":"callout","title":"Do not move a guest off-platform casually","text":"Use the client’s approved communication and payment workflow. Platform policies and protections can depend on where the reservation and communication occur."},{"type":"scenario","title":"One guest, three systems","text":"A guest booked through a platform, the property uses a separate property-management system, and cleaning is tracked in a vendor app. Map which facts must stay consistent across the three systems and which one is the source of truth for reservation dates."},{"type":"heading","text":"Key takeaway"},{"type":"paragraph","text":"Your first job is to keep the reservation state accurate. Every message, turnover, maintenance task, and owner report depends on the correct booking record."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000011';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Guests need one reliable version of the property"},{"type":"paragraph","text":"Listing copy, house rules, check-in instructions, amenity notes, parking guidance, pet rules, occupancy limits, and checkout expectations can appear in several places. The VA should know which record is authoritative and prevent conflicting instructions."},{"type":"heading","text":"Maintain a listing facts sheet"},{"type":"list","items":["Property name and address handling rules","Maximum occupancy","Bed setup","Check-in and checkout windows","Parking instructions","Wi-Fi details","Pet policy","Smoking policy","Quiet hours","Key amenities","Known limitations","Emergency contact process"]},{"type":"heading","text":"House rules are operational controls"},{"type":"paragraph","text":"Do not rewrite house rules casually or promise exceptions without approval. Rules can affect neighbours, building requirements, insurance, cleaning, safety, and owner expectations."},{"type":"steps","items":["Check the current approved rule.","Compare the guest request with the rule.","Identify whether an exception is allowed.","Escalate any exception that needs owner approval.","Record the approved outcome in the reservation."]},{"type":"callout","title":"Never invent an amenity","text":"If the guest asks whether the property has a cot, lift, air-conditioning, parking clearance, accessibility feature, or appliance that is not verified, check before answering."},{"type":"scenario","title":"Conflicting check-in instructions","text":"The listing says check-in is 3 PM, the automated message says 2 PM, and the cleaner’s checklist assumes 3 PM. Explain how you determine the correct time and prevent the inconsistency from affecting future guests."},{"type":"heading","text":"Version control"},{"type":"paragraph","text":"When an owner changes a rule or property detail, update the approved source first, then every dependent template or system. Keep a short record of what changed and when."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000012';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Reservation administration protects the stay from avoidable surprises"},{"type":"paragraph","text":"After booking, verify the reservation details that affect operations. The goal is not to collect unnecessary personal information. The goal is to make sure the property, guest count, dates, timing, and approved special requests match what the team expects."},{"type":"heading","text":"Reservation checklist"},{"type":"list","items":["Property and channel","Arrival and departure dates","Guest count","Primary guest contact","Arrival timing when operationally needed","Approved special requests","Pet or parking details when relevant","Accessibility or setup requests","Payment or reservation status only from the approved system","Internal notes and required vendor tasks"]},{"type":"heading","text":"Handle guest data carefully"},{"type":"paragraph","text":"Use only the information needed for the stay and only in approved systems. Do not copy identification documents, phone numbers, payment details, or private messages into personal notes or unapproved tools."},{"type":"callout","title":"Reservation details are not permission to overshare","text":"Cleaners, contractors, and neighbours usually need only the information required for their task, not the guest’s full reservation history."},{"type":"scenario","title":"Early arrival request","text":"A guest asks for a 10 AM check-in. The prior guest leaves at 11 AM and the cleaner has a three-hour turnover window. Prepare the internal decision note and the guest response before the owner or operations lead decides whether an exception is possible."},{"type":"heading","text":"Modification discipline"},{"type":"list","items":["Confirm the requested change.","Check property availability.","Check vendor or turnover impact.","Check the correct platform or system workflow.","Do not promise a change before it is approved and recorded.","Update all dependent calendars and tasks after confirmation."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000021';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Double bookings are a systems problem, not only a calendar problem"},{"type":"paragraph","text":"When a property appears on several channels, availability must stay synchronised. A VA should understand which calendar or property-management system is authoritative, how blocks are created, and what manual actions can accidentally reopen unavailable dates."},{"type":"heading","text":"Calendar controls"},{"type":"list","items":["Single source of truth for availability","Channel sync status","Owner blocks","Maintenance blocks","Turnover buffers","Minimum or maximum stay rules","Same-day booking rules","Check-in restrictions","Manual holds with expiry or owner"]},{"type":"heading","text":"Before changing availability"},{"type":"steps","items":["Confirm the correct property.","Check existing reservations and owner blocks.","Check maintenance or vendor work.","Check adjacent-night restrictions or turnover needs.","Make the change in the source-of-truth system.","Verify the change reached connected channels when the workflow requires it."]},{"type":"callout","title":"Never open dates because a calendar looks empty in one channel","text":"The booking may exist elsewhere or the property may be intentionally blocked for maintenance, owner use, or operational reasons."},{"type":"scenario","title":"Calendar conflict","text":"A direct-booking enquiry arrives for dates that appear free on the website but blocked in the property-management system. Explain which record you trust first, what you investigate, and what you say to the guest before availability is confirmed."},{"type":"heading","text":"If a conflict happens"},{"type":"paragraph","text":"Do not cancel, move, or rehouse a guest without authority. Preserve the booking evidence, alert the responsible owner immediately, and prepare verified options and operational impact."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000022';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Guest messaging should reduce uncertainty at each stage"},{"type":"paragraph","text":"Guests usually need different information before arrival, at check-in, during the stay, and before checkout. Good messaging is timely, accurate, easy to scan, and specific to the booked property."},{"type":"heading","text":"Pre-arrival communication may include"},{"type":"list","items":["Confirmed dates and guest count","Check-in window","Directions or parking","Access instructions sent at the approved time","House rules that matter operationally","What to bring or prepare","How to contact the host team","Approved local guidance"]},{"type":"heading","text":"Check-in message quality"},{"type":"steps","items":["Confirm the property.","Use the correct access method.","Check that codes or keys are active when applicable.","Avoid sending sensitive access information earlier than the client’s process allows.","Make troubleshooting steps easy to follow.","Include the correct support route."]},{"type":"heading","text":"During the stay"},{"type":"paragraph","text":"Reply from the reservation context. A guest asking about heating, Wi-Fi, parking, noise, or an appliance needs property-specific information, not a generic template."},{"type":"callout","title":"Scheduled messages still need ownership","text":"Automation can send useful routine information, but someone must maintain templates when access methods, rules, or property details change."},{"type":"scenario","title":"Late-night access issue","text":"A guest says the access code is not working at 10:30 PM. Build the response sequence: identity/reservation check, approved troubleshooting, backup access path, vendor or owner escalation, and what not to disclose."},{"type":"heading","text":"After checkout"},{"type":"list","items":["Thank the guest when appropriate.","Confirm any checkout issue that needs follow-up.","Do not discuss damage conclusions before evidence is reviewed.","Record lost-property reports.","Trigger turnover and inspection tasks."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000031';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Complaints need calm triage and clear authority"},{"type":"paragraph","text":"A guest complaint may involve inconvenience, a property defect, cleanliness, noise, access, safety, refund expectations, or a neighbour issue. The VA should identify severity, verify facts, take approved actions, and escalate decisions that affect money, safety, or liability."},{"type":"heading","text":"Triage questions"},{"type":"list","items":["Is anyone unsafe or unable to access the property?","Is essential service affected?","Can the issue be solved remotely?","Does a vendor need to attend?","Is another guest or neighbour involved?","Is the guest requesting compensation, cancellation, or relocation?","What evidence is available?"]},{"type":"heading","text":"Immediate escalation examples"},{"type":"list","items":["Fire, gas, electrical, flooding, or serious safety concern","Guest cannot safely enter or remain in the property","Security or unauthorised-entry concern","Serious neighbour or police involvement","Major property damage","Refund or relocation decision outside the VA’s authority","Threats, legal claims, or platform escalation requiring owner review"]},{"type":"callout","title":"Do not argue about blame while the issue is active","text":"Stabilise the situation, preserve evidence, and route the decision. Responsibility and compensation can be reviewed after the immediate operational problem is controlled."},{"type":"scenario","title":"No hot water","text":"A guest reports no hot water at 7 AM and asks for a full refund. Prepare the first response, maintenance escalation, evidence record, and owner decision request without promising compensation."},{"type":"heading","text":"Complaint record"},{"type":"list","items":["Guest report","Timestamp","Evidence","Actions taken","Vendor contacted","Owner notified","Guest updates","Commercial request","Decision owner","Resolution"]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000032';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Turnover is the bridge between two reservations"},{"type":"paragraph","text":"A property can be booked correctly and still fail if cleaning, linen, supplies, access, or inspection are not ready before the next guest. Turnover work should be visible, timed, and checked against the next arrival."},{"type":"heading","text":"Turnover checklist categories"},{"type":"list","items":["Checkout confirmed","Cleaning assigned","Linen and towels","Consumables","Waste removal","Beds and room setup","Damage or missing-item inspection","Maintenance observations","Access reset","Final readiness confirmation"]},{"type":"heading","text":"Tie turnover to the reservation calendar"},{"type":"steps","items":["Confirm checkout time.","Confirm next check-in time.","Assign the cleaner or vendor.","Share only the information they need.","Track completion.","Review photos or checklist when the client requires it.","Escalate anything that threatens readiness.","Record property-ready status."]},{"type":"callout","title":"Cleaned does not always mean ready","text":"A property can be clean but still have a dead lock battery, missing keys, no towels, broken Wi-Fi, or unresolved damage."},{"type":"scenario","title":"Back-to-back stay","text":"One guest checks out at 10 AM and the next arrives at 3 PM. At noon the cleaner reports the prior guest left excessive rubbish and a damaged lamp. Build the turnover escalation and guest-readiness decision path."},{"type":"heading","text":"Supply controls"},{"type":"paragraph","text":"Use par levels or minimum stock rules for recurring supplies when the client has them. Do not wait until a cleaner reports zero stock on a same-day turnover."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000041';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Maintenance requests need severity and ownership"},{"type":"paragraph","text":"Not every maintenance issue is an emergency, but every issue needs a visible status. The VA should triage the problem, collect useful evidence, route it to the right vendor or owner, and keep the guest informed without pretending to diagnose beyond the approved process."},{"type":"heading","text":"Possible severity levels"},{"type":"list","items":["Emergency: immediate risk to people or major property damage.","Urgent: materially affects the stay and needs prompt action.","Routine: should be repaired but does not prevent safe use.","Monitor: observation that may need future maintenance."]},{"type":"heading","text":"Maintenance ticket"},{"type":"list","items":["Property","Issue","Guest impact","Photos or evidence","Time reported","Troubleshooting already attempted","Vendor owner","Access instructions","Target response","Guest update time","Resolution evidence"]},{"type":"callout","title":"Do not send a contractor into an occupied property without the approved access process","text":"Guest privacy, notice, keys, building access, and vendor identity need to follow the client’s rules."},{"type":"scenario","title":"Water leak","text":"A guest reports water under the kitchen sink. It is spreading but there is no electrical contact. Build the immediate response, remote instructions you can safely give if approved, vendor escalation, owner notification, and documentation."},{"type":"heading","text":"Emergency routing"},{"type":"paragraph","text":"Know the property-specific emergency process. If there is immediate danger, follow the client’s emergency instructions and direct the guest to appropriate local emergency help when required. Do not rely on a generic checklist when local conditions differ."},{"type":"heading","text":"After repair"},{"type":"list","items":["Confirm guest impact is resolved.","Collect vendor evidence.","Record cost or invoice for owner review.","Update maintenance history.","Check whether future preventive work is needed.","Close only when the property is operational again."]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000042';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Rates and discounts are commercial decisions"},{"type":"paragraph","text":"A VA may maintain approved rates, minimum stays, discounts, fees, and promotions when the owner has defined the rules. Do not invent pricing strategy, waive charges, or offer compensation outside your authority."},{"type":"heading","text":"Common commercial inputs"},{"type":"list","items":["Base nightly rate","Weekend or seasonal rules","Minimum stay","Length-of-stay discounts","Last-minute rules","Cleaning fee","Pet fee","Extra guest fee","Owner-approved promotion","Manual exception threshold"]},{"type":"heading","text":"Before changing a rate"},{"type":"steps","items":["Confirm the property and date range.","Check existing reservations.","Check the approved pricing rule.","Identify whether the change is manual or system-driven.","Confirm owner approval when outside the rule.","Record the change and reason.","Verify connected channels when needed."]},{"type":"callout","title":"Never promise a refund or discount before approval","text":"Guest satisfaction is important, but commercial concessions affect the owner and may also need to follow platform-specific workflows."},{"type":"scenario","title":"Guest asks for 30% off","text":"A guest wants a large discount for a seven-night stay during a high-demand period. The owner has authorised up to 10% for longer stays. Draft the reply and escalation note without negotiating beyond the approved limit."},{"type":"heading","text":"Fee disputes"},{"type":"paragraph","text":"If a guest disputes a fee, preserve the reservation terms and evidence, explain only the approved policy, and route exceptions to the owner or authorised manager."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000051';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Reviews and records should reflect verified experience"},{"type":"paragraph","text":"Post-stay work can include review reminders, owner summaries, guest history, damage notes, lost property, vendor costs, and repeat-guest information. Keep the record factual and separate private operational notes from anything public."},{"type":"heading","text":"Review support"},{"type":"list","items":["Follow the client’s approved review workflow.","Do not fabricate a review.","Do not retaliate or threaten over a negative review.","Keep private incident notes separate from public wording.","Escalate sensitive review disputes to the owner."]},{"type":"heading","text":"Owner reporting"},{"type":"list","items":["Occupancy or booking summary","Upcoming arrivals and departures","Outstanding guest issues","Maintenance status","Turnover exceptions","Owner decisions needed","Commercial exceptions","Vendor follow-ups","Review or reputation issues"]},{"type":"callout","title":"A review score is not the whole operational story","text":"A five-star stay can still reveal maintenance or process issues, and a low rating can reflect a single exception. Report the underlying operational facts."},{"type":"scenario","title":"Negative review after a resolved issue","text":"A guest received a quick repair during the stay but later leaves a negative review about the original problem. Prepare the owner summary: verified timeline, resolution, guest communication, and what process improvement may reduce recurrence."},{"type":"heading","text":"Guest records"},{"type":"paragraph","text":"Keep only the guest information the client’s system and process require. Do not create informal blacklists or personal commentary that is unrelated to legitimate operational needs."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000052';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Multi-property work depends on disciplined handoffs"},{"type":"paragraph","text":"When one VA supports several properties, the main risk is mixing instructions, vendors, access details, or guest context. Every task and message should clearly identify the property and reservation."},{"type":"heading","text":"Property operations sheet"},{"type":"list","items":["Property identifier","Approved guest contact route","Cleaner","Maintenance vendors","Emergency contact","Access process","Parking","Key house rules","Turnover duration","Supply rules","Owner escalation contact","Known property-specific issues"]},{"type":"heading","text":"Vendor handoff"},{"type":"steps","items":["Name the property.","State the task and urgency.","Share only necessary guest/access details.","Confirm arrival window.","Record acceptance.","Track completion.","Collect evidence or invoice.","Update the property record."]},{"type":"callout","title":"Never assume two properties use the same rule","text":"Even properties owned by the same client may have different cleaners, access systems, parking, building rules, pricing authority, or emergency contacts."},{"type":"scenario","title":"Three-property shift handoff","text":"At shift end, Property A has an unresolved Wi-Fi ticket, Property B has a 10 AM early-arrival request pending owner approval, and Property C has a cleaner running late for a 3 PM check-in. Write the handoff so the next VA can act immediately."},{"type":"heading","text":"Shift-change standard"},{"type":"list","items":["Open guest issues","Arrival risks","Vendor ETA","Owner decisions pending","Maintenance status","Calendar conflict","Next checkpoint","Exact reservation or task link"]}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000061';

update public.training_lessons
set
  content = '[{"type":"heading","text":"Final composite short-term rental simulation"},{"type":"paragraph","text":"This simulation combines reservations, calendars, guest messaging, turnover, maintenance, rates, vendors, reviews, and owner reporting. The company is fictional and built from common short-term rental operating patterns rather than any single host or property."},{"type":"scenario","title":"Coastline Stays","text":"Coastline Stays manages four apartments. Property A has a guest checking out at 10 AM and another arriving at 3 PM; the cleaner reports a damaged bedside lamp. Property B has a guest locked out at 9:40 PM. Property C receives a request for a 25% discount on an eight-night stay while the approved long-stay discount is 10%. Property D shows open dates on one channel but is blocked for owner use in the property-management system. A guest from last week has also posted a negative review after a maintenance issue that was repaired during the stay."},{"type":"heading","text":"Part 1: Prioritise"},{"type":"steps","items":["Rank the active issues by operational consequence.","Identify which actions can proceed under normal VA authority.","Identify which items need owner approval.","State the next checkpoint for every unresolved issue."]},{"type":"heading","text":"Part 2: Communicate"},{"type":"list","items":["Draft the lockout response.","Prepare the early turnover/damage escalation.","Draft the discount response without exceeding authority.","Explain what to say before confirming availability for Property D.","Prepare the owner summary for the negative review."]},{"type":"heading","text":"Part 3: Record and hand off"},{"type":"steps","items":["Update the reservation and task records.","Create vendor actions.","Record commercial decisions needed.","Protect guest information.","Write the shift handoff.","Identify one process improvement from the day."]},{"type":"callout","title":"Assessment standard","text":"A strong answer protects guest safety, reservation accuracy, commercial authority, and property readiness. It does not invent availability, promise refunds or discounts, expose access information carelessly, or hide unresolved turnover and maintenance risks."}]'::jsonb,
  is_published = false,
  last_reviewed_at = null,
  reviewed_by = null,
  content_version = greatest(content_version, 1),
  updated_at = now()
where id = '22000015-0000-4000-8000-000000000062';

update public.training_assessments
set
  instructions = 'Complete the Coastline Stays composite short-term-rental operations simulation. Prioritise reservation and guest issues, resolve calendar and turnover risks, prepare maintenance and vendor actions, handle commercial requests within approval boundaries, protect guest data, and produce a clear owner and shift handoff. The assessment tests short-term-rental operational judgment and work output rather than platform trivia.',
  is_published = false,
  updated_at = now()
where id = '23000000-0000-4000-8000-000000000015';
