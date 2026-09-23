-- Refresh the published Cliniko course for current front-desk, permissions,
-- patient-form, appointment, and payment workflows. This remains non-clinical
-- administrative training and does not expand a VA's clinical authority.

update public.training_lessons
set
  title = 'Cliniko Practice Workflow, Security Roles, and VA Access Boundaries',
  summary = 'Cliniko separates scheduling, front-desk, finance, practitioner, bookkeeper, and administrator access. A VA should use the lowest role that supports the assigned work and should not receive treatment-note or clinical access for convenience.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Choose a Cliniko security role that matches the delegated workflow",
      "Separate basic patient administration from financial and clinical access",
      "Recognize when a request must go back to the practitioner or practice owner"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Cliniko currently provides Scheduler, Receptionist, Power receptionist, Practitioner, Bookkeeper, and Administrator roles. A booking-only Virtual Assistant may only need Scheduler access, while a broader front-desk role may need Receptionist access for invoices and payments. More access is not automatically better: treatment notes, clinical information, exports, user administration, and business-wide settings should stay restricted to the people who genuinely need them."},
    {"type":"heading","text":"Role boundaries a VA should understand"},
    {"type":"list","items":[
      "Scheduler can manage appointments and basic patient details but does not have routine access to financials, treatment notes, or completed patient forms.",
      "Receptionist adds front-desk functions such as invoices and payments, plus broader administrative reporting and communications access.",
      "Power receptionist adds more settings and administrative capability but is still not a practitioner.",
      "Practitioner access is for people providing care and includes clinical information such as treatment notes.",
      "Bookkeeper is designed around financial information rather than clinical patient work.",
      "Administrator has very broad account authority and should not be the default role for a remote assistant."
    ]},
    {"type":"heading","text":"A practical access workflow"},
    {"type":"steps","items":[
      "List the exact Cliniko tasks the VA is responsible for.",
      "Map each task to the minimum role that permits it.",
      "Use an individual user account rather than shared credentials.",
      "Enable the practice's required account-security controls.",
      "Document which patient, financial, communication, and settings areas are in scope.",
      "Escalate any task that would require broader access than the agreed role.",
      "Review access whenever the VA's responsibilities change."
    ]},
    {"type":"callout","title":"Clinical records stay clinical","text":"Do not edit treatment notes, medical alerts, practitioner documentation, diagnoses, clinical recommendations, or other care decisions unless the person is separately qualified, explicitly authorised, and operating under the clinic's approved clinical process."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Giving Administrator access because it is easier",
      "Using a shared receptionist login",
      "Opening clinical records that are not needed for the task",
      "Changing account-wide settings without approval",
      "Assuming access to a screen means authority to make the decision"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A physiotherapy clinic hires you to manage bookings, reminders, basic patient details, and routine front-desk follow-up. The owner offers Administrator access because it is quicker to set up. Explain which Cliniko role you would ask the clinic to consider, what information you actually need, and what you would leave with the practitioner or owner."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Match access to the job, not convenience.",
      "Use the minimum patient information necessary.",
      "Keep clinical decisions with clinicians.",
      "Escalate when the requested task exceeds the agreed role."
    ]}
  ]$$::jsonb,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'cliniko-practice-workflow-and-va-permissions'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'cliniko-for-virtual-assistants')
  );

update public.training_lessons
set
  title = 'Cliniko Confirmations, Reminders, Secure Forms, and Booking Follow-Up',
  summary = 'Use Cliniko appointment communications and secure patient forms to reduce avoidable front-desk follow-up while keeping practitioner notifications, patient privacy, and clinical interpretation in the right hands.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Support appointment confirmations and reminders from approved templates",
      "Use secure patient-form links as part of the clinic's pre-appointment workflow",
      "Understand which booking notifications go to practitioners rather than administrative staff"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Cliniko can send appointment confirmations and reminders and can include links to secure patient forms. Patients can submit those forms back through Cliniko before the appointment. Cliniko also supports practitioner booking notifications, but those notifications are designed for practitioners rather than ordinary administrative users. A VA should manage the front-desk workflow without treating patient responses as clinical conclusions."},
    {"type":"heading","text":"A practical workflow"},
    {"type":"steps","items":[
      "Confirm the appointment type, practitioner, location, and patient contact details.",
      "Use the clinic's approved confirmation and reminder templates.",
      "Send or monitor the secure patient-form request when the clinic's workflow requires it.",
      "Check whether required administrative information has been received before the appointment.",
      "Do not interpret clinical answers on a patient form; route flagged or sensitive information to the practitioner.",
      "Record non-clinical follow-up and the next administrative action.",
      "Escalate urgent symptoms, safeguarding concerns, complaints, privacy issues, or requests for clinical advice immediately."
    ]},
    {"type":"callout","title":"Forms are not a diagnosis queue","text":"A completed patient form may contain sensitive or clinically important information. The VA can manage whether the form was sent or received, but clinical interpretation belongs with the practitioner."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Copying sensitive form answers into ordinary email or chat",
      "Changing reminder wording without approval",
      "Assuming a missed form means the appointment should be cancelled",
      "Giving clinical advice in response to a patient message",
      "Expecting administrative users to receive practitioner-only booking notifications"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A new patient has booked online and completed a secure form. The form contains an answer that may be clinically important, while the appointment reminder is due today. Explain what you can complete administratively, what you do not interpret, and how you hand the issue to the practitioner."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Use approved patient communications.",
      "Keep secure forms inside approved systems.",
      "Separate receipt of information from clinical interpretation.",
      "Escalate urgent or sensitive issues promptly."
    ]}
  ]$$::jsonb,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'confirmations-sms-and-email-reminders-and-follow-up-messages'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'cliniko-for-virtual-assistants')
  );

update public.training_lessons
set
  title = 'Cliniko Payments, Deposits, Outstanding Invoices, and Finance Handoff',
  summary = 'Cliniko can support online booking deposits or full payment, invoice payment links, and payment requests. A VA can administer approved payment workflows while refunds, write-offs, disputes, and accounting decisions remain controlled.',
  content = $$[
    {"type":"heading","text":"What you will learn"},
    {"type":"list","items":[
      "Understand current Cliniko online-payment and booking-payment workflows",
      "Support approved invoice and outstanding-balance follow-up",
      "Keep refunds, write-offs, disputes, and accounting decisions with the authorised owner"
    ]},
    {"type":"heading","text":"Why this matters"},
    {"type":"paragraph","text":"Cliniko's current online-payment workflow can use Stripe for deposits or full payment during online booking. Practices can also request payment on invoices and send payment links through supported patient communications such as email, SMS, or QR code. These tools make collection easier, but they do not give a VA authority to change fees, approve refunds, write off debt, or decide accounting treatment."},
    {"type":"heading","text":"A practical workflow"},
    {"type":"steps","items":[
      "Confirm the correct patient, appointment, invoice, amount, and payment status.",
      "Check whether the clinic requires a deposit, full payment, or payment after the appointment for that appointment type.",
      "Send the approved invoice or payment request through the clinic's configured Cliniko workflow.",
      "Verify payment status before sending another reminder.",
      "Record patient questions, failed payments, disputes, or duplicate-payment concerns.",
      "Do not issue a refund, write-off, discount, or payment-plan concession outside the clinic's written authority.",
      "Route accounting allocation, tax, insurer, third-party payer, or reconciliation questions to the responsible finance owner."
    ]},
    {"type":"callout","title":"Payment tools do not create commercial authority","text":"Being able to send a payment link or see a refund option does not authorise the VA to change the amount owed, approve a refund, write off a balance, or make accounting decisions."},
    {"type":"heading","text":"Common mistakes"},
    {"type":"list","items":[
      "Chasing an invoice that was already paid",
      "Sending a payment request to the wrong patient",
      "Refunding a cancellation without checking clinic policy",
      "Treating a failed payment as permission to change the booking",
      "Discussing sensitive financial details through an unapproved channel"
    ]},
    {"type":"scenario","title":"Practice scenario","text":"A patient paid a deposit online, later rescheduled, and now asks for a refund. Cliniko shows the payment and invoice, but the clinic's cancellation policy requires owner approval for refunds. Explain the checks, patient communication, and handoff without making the commercial decision yourself."},
    {"type":"heading","text":"Before you move on"},
    {"type":"list","items":[
      "Check payment status before follow-up.",
      "Use the clinic's approved payment channel.",
      "Keep concessions and refunds controlled.",
      "Escalate finance and accounting exceptions."
    ]}
  ]$$::jsonb,
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  is_published = true,
  content_version = content_version + 1,
  updated_at = now()
where slug = 'payments-outstanding-invoices-and-xero-handoff'
  and module_id in (
    select id from public.training_modules
    where course_id = (select id from public.training_courses where slug = 'cliniko-for-virtual-assistants')
  );

update public.training_assessments
set
  instructions = 'Complete a Cliniko front-desk administration simulation covering minimum-necessary user permissions, patient-record administration, appointment scheduling, confirmations and reminders, secure patient-form workflow, invoice preparation, deposits or online payment requests, outstanding balances, and escalation. Show what a VA can handle administratively and what must stay with the practitioner, practice owner, privacy lead, or finance reviewer. Do not provide clinical advice, interpret patient forms clinically, edit treatment notes, approve refunds outside policy, or treat software access as authority.',
  pass_score = 80,
  is_published = true,
  updated_at = now()
where course_id = (
  select id from public.training_courses where slug = 'cliniko-for-virtual-assistants'
);

update public.training_courses
set
  reviewed_by = 'VirtualAssistant.com.ph Editorial Team',
  last_reviewed_at = now(),
  content_version = content_version + 1,
  updated_at = now()
where slug = 'cliniko-for-virtual-assistants'
  and status = 'published';
