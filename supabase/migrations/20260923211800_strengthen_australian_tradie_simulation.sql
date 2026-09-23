-- Strengthen the Australian trades capstone around the complete customer and job lifecycle.
-- This migration does not publish the course. Review state remains unchanged.

update public.training_courses
set
  summary = 'Administration training for Filipino VAs supporting Australian trades and field-service businesses, covering lead intake, booking, scheduling, quotes, quote follow-up, technicians, suppliers, job completion, invoicing, payment follow-up, customer reviews, and operational handoffs.',
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-trades-administration';

update public.training_lessons
set
  title = 'Australian Tradie Lead-to-Review Work Simulation',
  summary = 'Run a realistic trade-business workflow from a new customer enquiry through qualification, booking, quoting, field completion, invoicing, payment follow-up, review request, and end-of-day handoff.',
  content = $$[
    {
      "type":"heading",
      "text":"What you will practise"
    },
    {
      "type":"list",
      "items":[
        "Capture and qualify a new enquiry without diagnosing the trade problem",
        "Book or dispatch work using the business rules and technician availability",
        "Prepare and follow up a quote without changing scope or price",
        "Track field completion evidence, return visits, parts, and customer questions",
        "Prepare invoicing and payment follow-up from approved evidence",
        "Decide whether a customer is ready for an approved review request",
        "Produce a concise end-of-day handoff with owners, blockers, and next actions"
      ]
    },
    {
      "type":"heading",
      "text":"The workflow"
    },
    {
      "type":"steps",
      "items":[
        "Enquiry: capture the customer, site, contact details, request, access information, photos, and preferred timing. Record the customer description as reported rather than turning it into a diagnosis.",
        "Qualification and triage: apply the client's documented service-area, job-type, urgency, and safety rules. Escalate anything outside those rules.",
        "Booking and dispatch: choose an available slot or technician only within the dispatch rules. Confirm the appointment, access instructions, and any customer preparation.",
        "Quote: prepare the administrative quote from approved scope and pricing inputs. Route technical, pricing, discount, warranty, and margin questions to the authorised person.",
        "Quote follow-up: record sent, viewed, questioned, accepted, declined, or expired status. Follow up on the approved cadence and stop stale reminders when the status changes.",
        "Job delivery: monitor technician notes, forms, photos, parts, return visits, and customer questions. Do not mark the job complete from the calendar alone.",
        "Invoice and payment: invoice only when the business completion criteria are met. Check payment status before reminders and escalate GST, credits, write-offs, coding, or reconciliation exceptions.",
        "Review request: after confirmed completion and according to client policy, request an honest customer review through the approved channel. Do not request a review while a complaint, safety concern, return visit, or unresolved service issue is still open.",
        "Handoff: finish with a short queue of completed work, open exceptions, customer promises, owner decisions needed, and the next action for every unfinished item."
      ]
    },
    {
      "type":"callout",
      "title":"Customer reviews are not reputation manipulation",
      "text":"Use the client's approved review process. Never invent reviews, write a review on the customer's behalf, pressure a customer for a positive rating, hide legitimate complaints, or offer an unapproved incentive for a favourable review."
    },
    {
      "type":"callout",
      "title":"Stay inside the VA role",
      "text":"Do not diagnose faults, decide whether regulated work is safe or compliant, negotiate unauthorised prices, alter technical scope, approve spending, decide tax treatment, write off debt, or promise outcomes that require a licensed trade, finance owner, or business owner."
    },
    {
      "type":"heading",
      "text":"Composite scenario"
    },
    {
      "type":"scenario",
      "title":"Harbourline Electrical & Plumbing",
      "text":"You begin the day with a new leaking-pipe enquiry, a possible electrical safety issue, a customer waiting on a quote, an accepted quote that needs scheduling, a technician note saying a return visit and part are required, a completed job with a billing exception, an overdue invoice, and a completed customer whose job has no open issue. Build the priority queue, customer messages, quote follow-up, dispatch plan, supplier or return-visit action, invoice and payment handoff, review-request decision, and end-of-day update."
    },
    {
      "type":"heading",
      "text":"Your submission should show"
    },
    {
      "type":"list",
      "items":[
        "What you would do now",
        "What you would schedule or follow up",
        "What you would escalate and to whom",
        "What evidence or status you would update in the job system",
        "Which customer is eligible for a review request and why",
        "What remains open at the end of the day"
      ]
    },
    {
      "type":"heading",
      "text":"Quality check"
    },
    {
      "type":"list",
      "items":[
        "No customer request has been turned into a technical diagnosis",
        "Urgent or safety-sensitive items are escalated before routine admin",
        "No quote price, scope, discount, or warranty term was invented",
        "No job is treated as complete without completion evidence",
        "Invoice and payment actions match the current record",
        "No review request is sent while an unresolved issue is open",
        "Every unfinished item has an owner and next action"
      ]
    }
  ]$$::jsonb,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'australian-trades-composite-work-simulation'
  and module_id in (
    select id
    from public.training_modules
    where course_id = (
      select id from public.training_courses where slug = 'australian-trades-administration'
    )
  );

update public.training_assessments
set
  title = 'Australian Tradie Lead-to-Review Final Work Simulation',
  instructions = 'Complete the Australian tradie operations simulation from enquiry to review: capture and qualify the lead, apply urgency and safety escalation rules, prepare the booking or dispatch plan, prepare and follow up the quote, manage an accepted job through field-completion evidence and any return visit or supplier dependency, prepare invoice and payment follow-up, decide whether an honest customer review request is appropriate, and produce the end-of-day handoff. Your response must clearly separate routine VA administration from technical, pricing, safety, spending, tax, accounting, credit, and business-owner decisions. Do not request a review while a complaint, safety concern, return visit, or unresolved service issue remains open.',
  pass_score = 80,
  updated_at = now()
where course_id = (
    select id from public.training_courses where slug = 'australian-trades-administration'
  )
  and assessment_type = 'practical';
