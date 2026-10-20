# Foundations V2 · M03-L01 — Inbox Triage and Ownership

**Complete practical teaching draft for human pilot review** · 150 nominal minutes of learning and practice  
**Skill demonstrated:** turn an inbox into a safe, ordered work queue with ownership, evidence and follow-up  
**Audience:** beginner VA working remotely for an international small business  
**Case:** Harbour Lane Services — completely fictional Sydney-based service company  
**Materials:** [Fictional client operating guide](./CLIENT_OPERATING_GUIDE.md), [offline interactive inbox lab](./practice-inbox-lab.html), [12-message raw inbox CSV](./inbox-case-messages.csv), [fictional source records](./records/bookings.csv), [blank decision tracker](./inbox-triage-blank.csv), [full-size process diagram](./assets/inbox-triage-flow.svg), [mobile process diagram](./assets/inbox-triage-flow-mobile.svg), and [public grading rubric](./ASSESSMENT_RUBRIC_AND_FEEDBACK.md). All materials are synthetic; no paid software or client access required.

> **Important:** This is a training simulation. All names, records, messages and domains are invented. Do not enter real customer information, payment instructions, access credentials or patient records into training files, shared AI tools or personal mailboxes. Draft replies; do not actually send them.

## What you will accomplish

By the end, you will be able to:

- Sort incoming messages by **business impact, timing and authority**, not simply first-in-first-out or sender seniority.
- Recognize an access/security warning, a payment instruction, a near-term booking problem and an ordinary customer request.
- Decide whether to **act, verify, ask for approval, assign, wait, or escalate**, using a short evidence trail.
- Write a message that confirms what is known without inventing a refund, payment, price or appointment outcome.
- Create a handoff that names the owner of each unresolved task and the next check time.

### What you will submit

**Five artifacts**, all using fictional data:

1. A completed [decision tracker](./inbox-triage-blank.csv) for the eight independent messages **M05–M12**, citing actual provided source records, with **hard deadlines separate from next checkpoints**. You may use the [offline interactive lab](./practice-inbox-lab.html) to create and export this CSV.
2. **Two draft customer replies** for any two of M05, M10 and M12. Do not actually send them.
3. **One internal escalation request** identifying a specific decision and authorized owner.
4. **One end-of-shift handoff** summarizing completed, open and blocked work, assigned owners, hard deadlines and next checkpoints.
5. **One short weekly service status report**, prepared by inspecting the [12-row jobs log](./records/weekly-jobs.csv). Report what the log says and which completion claims lack supporting evidence.

You are not being assessed on speed-typing or decorative formatting. You are assessed on whether another teammate can safely continue the work without guessing.

## Suggested learning rhythm

| Section | Nominal minutes | What happens |
| --- | ---: | --- |
| Orientation and source files | 15 | Open the fictional policy, source registers and simulation |
| Decision framework | 15 | Study consequence, authorization and the process diagram |
| Four fully modeled decisions | 25 | Compare messages with evidence and draft proper handoffs |
| Independent lab: M05–M12 | 50 | Inspect records, document facts and uncertainty, export tracker |
| Work products | 30 | Create two replies, one escalation, handoff and mini weekly report |
| Self-review and correction | 15 | Apply the published rubric, identify unsupported claims and revise |
| **Total** | **150** | |

Pause and resume whenever needed. The time budget is an estimate, not an eligibility threshold. A beginner may need a second session.

---

## Your fictional client and operating rules

You have just started an administrative shift at **09:00 AEDT on 4 November 2026**. Harbour Lane Services schedules home-service visits, communicates with customers and coordinates suppliers. Your job is to keep messages moving and make problems visible; **you are not a finance approver, refund approver, security administrator, or marketing publisher**.

Read the **[Harbour Lane operating guide](./CLIENT_OPERATING_GUIDE.md)** before you start. It tells you the agreed roles, deadlines and approval boundaries, and links to the actual fictional system-of-record files. The table below is a reminder, not a replacement for inspecting the evidence. These policies exist for the exercise, not for any real business.

| Rule | Harbour Lane instruction |
| --- | --- |
| Work hours | Client support coverage 08:00–17:00 **AEDT**; **your** VA shift begins at 09:00 AEDT, so earlier messages still have live response deadlines. Use the message's explicitly stated zone; do not treat “local time” as self-explanatory. |
| Customer acknowledgements | Draft an acknowledgment within **two business hours** where possible. Acknowledging a request does not mean approving or resolving it. |
| Security issue | If a staff member reports an unrequested reset or suspicious link, **do not click it**. Open an internal security incident, alert the designated security owner promptly (exercise target: within 10 minutes of discovering the report at shift intake), and record the report. |
| Same-day bookings | Missing service addresses, unavailable technicians or timing changes that affect today's appointment must reach the dispatch owner **before 09:20 AEDT** in this scenario. Do not promise a slot until dispatch confirms it. |
| Payment details | **Never change supplier bank details or release a payment based only on an email**. Hold the pending change; finance must verify via the contact channel already recorded in its approved system. |
| Refunds, pricing and credits | The VA may locate policies, gather evidence and draft replies. Only the authorized manager can approve a refund, price or credit. |
| Marketing publication | A campaign cannot be published without approved claim, price, assets, audience and date. Prepare an approval request rather than publishing. |
| Invoice or customer record | Do not merge duplicates, alter paid status or send financial records without verification and approved process. |
| Task tracking | Every non-reference message needs a source ID, next action, named team/role owner, timing and status. “Waiting” without an owner or check date is not complete. |
| Privacy | Use the minimum information necessary. These CSV files contain synthetic records only; never put actual customer data in a practice account. |

**Known roles for this exercise:**

- **You / VA:** intake, research from approved records, draft responses, create tracker and follow up on delegated work.
- **Avery / Dispatch lead:** verifies appointment details and scheduling availability.
- **Casey / Finance owner:** independently verifies banking changes, duplicate invoices and payment authorization.
- **Riley / Client manager:** approves refunds, public prices and customer commitments outside written policy.
- **Morgan / Security owner:** handles credential incidents and investigation.
- **Taylor / Marketing lead:** holds campaign claims and final publishing approval.

**What is *not* known:** every sender's identity, which invoice copy is authoritative, whether a requested appointment change is available, whether a refund is due, or whether a campaign was approved. Unknown facts remain **unverified** until checked.

## A visual overview: from message to tracked work

![Fictional inbox processing flow: capture message, verify evidence, classify impact, check authority, create an owned action and verify handoff.](./assets/inbox-triage-flow.svg)

**On a narrow mobile screen:** use the [same decision process in a readable vertical diagram](./assets/inbox-triage-flow-mobile.svg). Both graphics have descriptive text alternatives. The [offline inbox simulation](./practice-inbox-lab.html) also works in a single-column layout.

**Read the visual from left to right:**

1. **Capture:** keep the message ID, received time, topic and source reference.
2. **Verify:** identify what is actually known and which policy/source controls the decision. Treat unexpected links and change requests as untrusted.
3. **Prioritize:** decide what causes harm if delayed; identify the **time** it matters.
4. **Check authority:** can a VA complete the next step or is explicit approval/owner input needed?
5. **Act safely:** draft, log, assign or escalate; avoid clicking, paying, deleting, publishing or promising outside authority.
6. **Close the loop:** leave status, owner, due/check time and evidence. A message is not “done” merely because it is marked as read.

A key distinction: **priority is how quickly attention is required; authority is who is allowed to decide.** A bank-change request can be high priority because a payment is approaching, while the VA still has no permission to act on the bank data.

## The inbox decision framework

### Step 1 — Open the message without trusting it automatically

Start with message ID, timestamp, subject and the first lines. Do **not** treat the display name or “urgent” in a subject as proof that the request is valid. Determine the action, source, affected person, timing and evidence needed.

**Ask:** What changed? What deadline exists? Where is the correct source of truth? Can a wrong decision create a payment, privacy, security, reputational or customer harm?

### Step 2 — Set priority by consequence, not by loudness

This is a *teaching classification* for this fictional client, not a substitute for the client's own established SLA scheme.

| Priority | Meaning | Example | First move |
| --- | --- | --- | --- |
| **P0 — urgent containment** | Credible security/privacy or safety concern; harm may continue while waiting | An unrequested reset reported by a team member | Do not use the link; record and alert the security owner immediately |
| **P1 — time-sensitive/risk-boundary** | Same-day customer disruption, finance-change hazard or an approval needed before a near deadline | Missing address before a 10:00 visit; bank details sent before today's payment | Verify source, hold unsafe action, notify authorized owner quickly |
| **P2 — scheduled work** | Real work with time to verify and complete during shift | A weekly report due at 13:00 | Plan, gather evidence, set next checkpoint |
| **P3 — reference/no immediate action** | Information-only material without a tracked dependency | A newsletter unrelated to current client tasks | File per policy; avoid interrupting higher-priority work |

**Priority can change.** A P2 request becomes a P1 exception if the source disappears, a customer deadline approaches or an owner is unavailable. Record the reason rather than silently reordering.

### Step 3 — Separate a message from the work item

A message is not the final tracking system. One email may produce two tasks, or several messages may belong to one case. Before creating duplicates, search for a related ticket, calendar event, invoice ID or open task. Where possible, keep a source reference.

Use these **action states**:

- **New:** requires assessment.
- **Working:** safe action is underway with an owner.
- **Waiting for approval:** no more action until an authorized decision.
- **Waiting for verification:** evidence or identity check is pending.
- **Ready for reply:** draft exists and needs a send/approval check.
- **Resolved:** safe action complete *and* documented; no unresolved dependency.
- **Reference:** no client work required under the stated SOP.

### Step 4 — Keep six decisions distinct

A good VA records: (1) **what we know**, (2) **what is unverified**, (3) **what to do next**, (4) **what the VA must not do**, (5) **who owns the decision**, and (6) **when to check again**.

For a customer rescheduling request, “customer wants another slot” is a fact. “New slot confirmed” is **not** a fact until dispatch verifies availability and the applicable policy permits confirmation.

### Step 5 — Draft only what your authority supports

Good customer acknowledgment pattern:

> “Thanks for letting us know. I’ve passed your request to our scheduling team for confirmation. I’ll update you when the available options have been checked.”

Bad pattern:

> “No problem, your new appointment is confirmed.”

The second statement invents a confirmed booking. The problem is not the friendly tone; it is an unsupported operational commitment.

### Step 6 — Close or hand off with a visible trail

At the end of an action, a teammate should know **which source was checked, what changed, what was intentionally left unchanged, the owner, and the next check time**. If the decision is awaiting Riley, the tracker must say that; it must not show “resolved” merely because the request was forwarded.

---

## Worked demonstration — four messages from the case file

Download or open [inbox-case-messages.csv](./inbox-case-messages.csv). Filter the **stage** column to **DEMO**. For every message, watch the reasoning rather than copying a priority label without understanding it.

### M01 — An unrequested account reset

**Message:** Operations reports an unrequested reset notification for the scheduling account shortly before you begin at 09:00 AEDT. An email contains a reset link.

**Walkthrough:**

1. Capture **M01**, the report time and source. Do not click the embedded link, enter a password, or assume the sender is legitimate.
2. Identify the immediate harm: an access compromise could disrupt scheduling or expose client information.
3. Mark **P0** for rapid containment under this scenario's SOP. Avoid claiming the account *is* compromised; only a suspicious event has been reported.
4. Record what you can do: preserve the report in the internal incident path, alert Morgan via the approved internal channel and document the time. You cannot reset credentials or pronounce the account safe.
5. Set **owner: Morgan / Security**. **Alert Morgan immediately at the 09:00 intake** using the approved internal channel; **09:10 AEDT is a follow-up checkpoint, not permission to delay the initial alert**. If the fictional incident policy sets an earlier deadline, follow that deadline.
6. Status: **Waiting for verification** after the handoff. This is **not resolved** until authorized staff confirm next steps.

**Example internal note:**

> **M01 / Security alert — action needed.** Operations reported an unsolicited password-reset message for the scheduling account. I have not clicked the link or changed access. Please verify through the approved security process. Source: M01; intake 09:00 AEDT; next check 09:10 AEDT. Owner: Morgan.

**What would fail:** “The message is from our supplier, so I'll click to check.” A display name and link do not establish identity.

### M02 — A 10:00 visit with no confirmed address

**Message:** Dispatch notices a booked technician visit at 10:00 AEDT with no verified service address.

**Walkthrough:**

1. Find the referenced booking record; do not invent an address from an older customer record.
2. Prioritize **P1**: a service visit is close and may fail without a correct address.
3. Check the dispatch SOP: Avery must resolve the missing detail before 09:20 AEDT.
4. Draft a concise request to Avery with booking reference, missing field, source and deadline. Do not independently promise the customer the technician will arrive.
5. Status: **Waiting for verification**; owner Avery; check at 09:15 AEDT; escalate under the fictional process at 09:20 if unresolved.

**Example dispatch note:**

> **Booking B-104 / 10:00 AEDT:** Service address is not verified in the approved booking record. Please confirm the correct address or advise whether the visit needs replanning. I have not sent a customer confirmation. Source M02; next check 09:15 AEDT.

**What would fail:** Assuming that an address from last month's invoice is correct without verification.

### M03 — Supplier emails new bank details

**Message:** A supplier sends updated banking instructions while Finance has a pending 15:00 AEDT payment.

**Walkthrough:**

1. Capture supplier name and the existing invoice reference without copying bank details into an unsecured note.
2. Mark **P1**, not because “pay immediately” is authorized, but because there is a **potential fraud and payment-control risk** before the payment time.
3. Place the change on hold in the tracker. Do not replace approved bank records, reply to an attacker-controlled address for verification, or authorize a transfer.
4. Assign Casey / Finance for independent verification using a contact method already in the approved vendor record.
5. Status: **Waiting for approval and verification**. Log the next check as 10:00 AEDT; source M03.

**Example Finance escalation:**

> **Possible supplier bank-detail change — verification required (M03).** A message requests updated payment instructions ahead of the 15:00 payment. No bank record or payment has been changed. Please verify using the vendor's previously approved contact details, confirm whether the payment should remain on hold, and record the authorization. Next check: 10:00 AEDT.

**What would fail:** Reading the “new contact number” in the same email and using that number as independent verification. It is not an independent source.

### M04 — A customer asks for a refund

**Message:** A customer asks for a 295 AUD refund due to a late appointment.

**Walkthrough:**

1. Locate the booking and relevant policy before stating what happened or what the customer is owed.
2. Mark **P1** in the worked case because a two-business-hour customer response is due, and a monetary decision is required.
3. Gather the documented appointment time and approved policy. Do not state that a refund is approved.
4. Draft an acknowledgment; route the decision to Riley / Manager with the evidence attached.
5. Record **owner: Riley**, **status: Waiting for approval**, **customer acknowledgment target: 10:22 AEDT** based on 08:22 receipt and the case SOP. Check sooner if the manager is unavailable.

**Example customer draft (not sent):**

> Subject: Your appointment concern  
> Thanks for telling us about the delay. I’m checking the booking details and have asked our manager to review your refund request against our policy. We’ll follow up once that review is complete. I haven't confirmed a refund at this stage.

**What would fail:** “We guarantee a refund today.” The VA does not have that authority or evidence.

### The demonstrated tracker entries

These are **examples** for the four demonstration messages. The independent eight are **not** answered for you.

| ID | Priority | Evidence needed | Safe action | Decision owner | Next check AEDT | Status |
| --- | --- | --- | --- | --- | --- | --- |
| M01 | P0 | Report / approved incident path | Don't click; security escalation | Morgan | 09:10 | Waiting for verification |
| M02 | P1 | Booking B-104 / dispatch SOP | Request confirmed address | Avery | 09:15 | Waiting for verification |
| M03 | P1 | Approved vendor record / payment queue | Hold change; independent callback by Finance | Casey | 10:00 | Waiting for verification and approval |
| M04 | P1 | Booking history / refund policy | Draft acknowledgment; escalate monetary decision | Riley | 09:45 | Waiting for approval |

**Pause and check:** Why can M03 be P1 while your personal next action is “do not change anything”? Because the urgency belongs to **getting authorized verification before a risky event**, not to performing the risky event yourself.

---

## Guided tool demonstration — practice the work, not just read about it

The original [fictional inbox simulator](./practice-inbox-lab.html) is a downloadable HTML page that works in a modern browser **without a login or network request**. It is a deliberately simplified training environment, **not** an authentic Gmail, Outlook or CRM screen. Learners can open messages, inspect system-of-record excerpts, make decisions in labeled fields and export their own CSV file. It checks that fields have been completed, **not** that the choices are correct.

### Walk through one complete action (M02 — already demonstrated)

1. Download the linked HTML file and open it in your browser. No accounts or real customer data are needed. Read the case date: **4 November 2026, AEDT**.
2. In the left inbox, select **M02 — the unverified technician-visit address**. Read the entire message before selecting a priority.
3. In the source panel, choose **Booking register**. Locate **B-104**, then compare the booking's address status, dispatch owner and meeting time to the email claim. Name what the record still does not establish.
4. In the **Instructor demonstration** section, read why this is a P1 operational issue and reveal the modeled safe action. Note that 09:20 AEDT is a **dispatch deadline**, while 09:15 AEDT is an earlier **follow-up checkpoint**.
5. Open the [blank decision tracker CSV](./inbox-triage-blank.csv) in Sheets or Excel. As a **separate trial row**, enter M02, its source file/reference, safe action, approval, owner and the two separate time fields. Do **not** replace one with the other. Compare against the demonstration table above.
6. Return to the inbox and repeat for **M01, M03 and M04**. Notice that the safest action can be a documented hold or escalation, **not** a rushed reply.
7. Check what your colleague could do next using only your record. If your note lacks an owner, an approval boundary or evidence, refine it before moving on.

### Independent practice with the simulator

1. Choose **M05**, then inspect the relevant source records in the right-hand panel before filling anything in.
2. Select a priority and write **verified facts**, **unverified facts**, **specific file/record IDs**, **next safe action**, **approval/owner**, **actual deadline**, **next follow-up checkpoint**, **status** and **handoff evidence**.
3. Select another message. The current answers are retained **only in the current open tab**; refreshing or closing will lose them.
4. Complete M05–M12. The button **Check required fields** identifies missing form fields only. Do not interpret “complete” as a passed skill assessment.
5. Choose **Export all eight practice records as CSV** and keep the download somewhere you control. Use the [transparent marking rubric](./ASSESSMENT_RUBRIC_AND_FEEDBACK.md) to self-review, but wait for actual human review before claiming proficiency.

### Investigate the original source documents, too

The simulator contains excerpts for ease of practice. The authoritative **full fictional training files** are linked below. They contain detail that a real VA would need to reconcile across systems:

- [Booking records](./records/bookings.csv) and [customer directory](./records/customer-directory.csv).
- [Supplier invoice, ledger and payment register](./records/finance-records.csv).
- [Weekly jobs tracker](./records/weekly-jobs.csv).
- [Price and campaign approval register](./records/approval-register.csv) plus the [approved rate and identity policy](./records/rates-and-policies.md).
- [Full supplier meeting notes](./records/meeting-MN-22.md).

**An actual task uses evidence.** For instance, M02 cannot be resolved by paraphrasing the message. The learner must read bookings.csv:B-104, recognize that its service address is unverified, ask Avery for the missing decision and leave that item open until Dispatch confirms it.

### Alternative: train directly in a free spreadsheet

If offline HTML is unavailable, open the two CSVs in Google Sheets, Excel or an accessible spreadsheet application. Preserve the inbox source sheet and use the blank tracker as the work product. Filter to stage PRACTICE, then inspect the linked evidence files. Each tracker row must include a specific source ID and separate hard deadline and follow-up time.

**Software mapping:** Gmail may use labels, stars, drafts and snooze; Outlook may use flags, categories and follow-up tasks. Those labels do **not** replace an owned task record or proof that an external action was approved. Later production modules should add current permissioned test-account screencasts with captions and transcripts. No branded interface screenshot is claimed to have been created here.

---

## Independent simulation — now you make the decisions

Select **M05–M12** in the [offline practice inbox](./practice-inbox-lab.html) or filter the [raw message CSV](./inbox-case-messages.csv) to PRACTICE. **The case CSV has no answer or priority column.** Investigate the fictional client records rather than guessing; a real-world case may remain pending until an authorized person verifies it.

### Your assignment

1. **Read all eight messages first.** Don't start sending or closing tasks based only on the subject.
2. For each, choose **P0/P1/P2/P3** based on the supplied SOP, time and consequence. Explain *why* in the “impact_or_risk” column.
3. For every actionable message, **open the supporting fictional source files** and record at least one **verified fact with a file and record ID**. List unresolved questions and conflicts separately. “I would verify it” is not a substitute for reading the evidence provided.
4. Choose one **next safe action**, and record what is on hold pending verification or approval. Do not treat forwarding a message as completed work.
5. Name the **specific authorized owner**, a **hard deadline** (full date and AEDT, or NONE), a **separate follow-up checkpoint**, and the current status. For a reference-only message, explain why no action is due.
6. Look for conflicts across related records and preserve them rather than silently changing the source files. Explain the source that makes each conclusion defensible.
7. Prepare **two draft customer replies** (choose two of M05, M10, M12). Include what can safely be stated today and who will own the next verified action.
8. Write **one internal escalation** that asks for a *specific decision* and names the authorized approver and timing.
9. Write an **end-of-shift handoff**: done with evidence, open, blocked, owner and next checkpoint. Include every unresolved high-priority issue and the coverage route if it cannot wait.
10. From [weekly-jobs.csv](./records/weekly-jobs.csv), prepare a **short source-based service summary**. Distinguish the number of jobs *marked* complete from those with actual recorded completion evidence; identify records needing owner review instead of falsely reporting closure.

### Non-answer coaching prompts — use when stuck

- Which **specific source record** establishes the fact you wrote down? Give its filename and ID.
- Which **decision belongs to an authorized owner**, rather than to you as a VA?
- What is the difference between the item's **business deadline** and the next time you personally check it?
- If your colleague reads only your tracker, can they determine the current state and what remains unverified?
- Which statuses, facts or dates in the available records might have changed since the message was sent?

### Template: safe reply draft

**To:** [fictional recipient]  
**Subject:** [topic/reference]  
**Verified:** [one sentence stating only known facts]  
**Next step:** [safe action, owner and what is being checked]  
**Follow-up:** [agreed update timing, only if support policy allows]  
**Not promised:** [internal self-check: what you intentionally did not claim]

### Template: internal escalation

**Issue / message ID:**  
**Customer or workflow impact:**  
**Verified facts and source:**  
**Unknown / conflicting information:**  
**Temporary safe action already taken:**  
**Decision or approval requested from:**  
**Exact timing / deadline (AEDT):**  
**Next owner and checkpoint:**  

### Template: end-of-shift handoff

**Completed with evidence:** [ID, action, evidence reference]  
**Open and being worked:** [ID, status, owner]  
**Blocked / awaiting decision:** [ID, exact decision and approving role]  
**Time-sensitive next checkpoints:** [ID, date/time AEDT, next owner]  
**Tomorrow-first priorities:** [IDs and why]  

If an issue is serious and open at shift end, don't simply leave it for “tomorrow”: use the escalation/coverage path specified in the scenario.

---

## What good work looks like (quality criteria, not hidden answers)

Your completed tracker should let an assessor follow the chain:

**Message Mxx → observed issue → trusted source to check → consequence → priority → safe action → owner → deadline/checkpoint → status → evidence.**

Good entries are concrete enough to audit.

**Too vague (already demonstrated M02):** “Urgent — email dispatch — done.”

**Stronger version of that *demonstration*:** “M02 / bookings.csv:B-104: 10:00 AEDT technician visit has no verified service address. Dispatch cut-off is 09:20 AEDT. Ask Avery to verify address and confirm routing; do not notify the customer that arrival is certain. Next checkpoint 09:15 AEDT. Status: Waiting for verification.”

*Notice:* only a modeled instructor case is shown here. The correct next actions for independent M05–M12 are intentionally **not** provided in a public answer sheet.

**Common failure patterns to correct:**

- *Most recent first* — ignores consequence and deadlines.
- *All urgent messages marked P0* — loses ability to distinguish immediate containment from normal customer work.
- *“Forwarded, done”* — leaves no confirmation, owner or follow-up.
- *Sentiment as evidence* — angry wording is not proof that a refund is due.
- *Copying bank changes from email* — unsafe; independent verification required.
- *A guessed time zone* — “tomorrow at 11” needs a date and named zone.
- *Deleting uncertain duplicates* — breaks auditability and may lose records.
- *Inventing a quick answer* — creates a promise without confirmation.

### Quality-assurance checklist

- [ ] Every practice message has one status and a consequence-based priority.
- [ ] The tracker records the **source ID**, not just a summary.
- [ ] Each actionable item has one owning role or person and a next check time.
- [ ] Approval boundaries for pricing, publication, payments, refunds and personal data are explicit.
- [ ] Any duplicate evidence has been documented rather than guessed or deleted.
- [ ] Both drafted replies use verified facts, with no fabricated booking, price or refund outcome.
- [ ] The escalation includes the **decision required**, not a generic “please advise”.
- [ ] Handoff separates complete, open and blocked work.
- [ ] Dates/times use AEDT in this case, not an unlabeled “local.”
- [ ] No synthetic answer has been presented as a real-world client communication.

## Short learning check (practice, not final assessment)

Answer *before* reading the explanation.

**Question: The supplier's email contains a phone number for verifying a new bank account. What should you do?**  
**Practice answer:** Do not use the number in the change email as the sole verification source. Hold the change, tell Casey and verify using previously approved vendor contact information. **Why:** a fraudulent email can also contain a fraudulent callback number.

**Question: Your worked example M02 is waiting for Dispatch, but its 09:20 deadline is approaching. What should the tracker show?**  
**Practice answer:** List Avery as decision owner, 09:20 AEDT as the actual dispatch deadline, an earlier follow-up checkpoint, bookings.csv:B-104 as evidence and a waiting status until verification. **Why:** a reminder alone does not establish that a deadline was met.

**Question: A request was forwarded to a manager, who has not replied. Is it finished?**  
**Practice answer:** No. Record “waiting for approval”, the approving owner and the next checkpoint. **Why:** forwarded work still carries customer or operational risk.

## Assessor rubric and resubmission

The **[criterion-by-criterion 100-point rubric](./ASSESSMENT_RUBRIC_AND_FEEDBACK.md)** defines scoring anchors, critical safety errors, required submissions, feedback wording and a fair correction pathway. Review the **five actual artifacts**, not reading time, minimum character count or a quiz answer pattern.

**Proposed pilot threshold:** 80/100, all five deliverables present, no unresolved critical safety error and a human review. The offline lab's required-field check is **not a pass** and this draft **does not issue a production V2 certificate**.

The repository is public. The learner-facing rubric is public, but **independent case answer keys must be kept in restricted assessor storage**, not in this course folder or its Git history. Where different decisions are equally defensible, reviewers should mark the evidence and reasoning rather than requiring one exact private answer string.

## Instructor delivery and pilot notes

This lesson now has a **self-contained offline fictional inbox interface, a source evidence pack, a written walkthrough, case CSVs, two accessible diagrams and a proposed criterion-based rubric**. It is still **a pilot**, not a verified production course. Before publishing, the team must:

- Add **current, permissioned Gmail and Outlook test-account walkthroughs** (including video captions or text alternatives) if the final course claims real software proficiency; the original simulation does not substitute for third-party software training.
- Review the scenario and rubric with a working VA, a client-service lead and a data-security reviewer.
- Test screen readers, keyboard navigation, CSV import on mobile, color-independent diagram labels and print/export alternatives.
- Ensure learner drafts are stored only in a deliberately designed training submission system with clear retention and review rules; the existing 80-character practical-note form is not an adequate replacement for this lesson's artifacts.
- Pilot with novices and revise the exercise duration, confusing terms and assessor anchors before authoring every remaining V2 lesson.

**Completion standard:** the learner has produced safe, traceable, correctable work. Merely opening this lesson, reading the examples or filling the minimum character count is **not** proof of job readiness.

---

## Recap: how an experienced VA thinks

The job isn't to clear every unread message as fast as possible. The job is to **prevent important work from falling through the cracks without creating unauthorized commitments**.

A reliable VA can explain what is urgent, which source supports the action, who is permitted to decide, what remains open and exactly when the next person needs to act. That is the competency this lesson teaches and measures.

