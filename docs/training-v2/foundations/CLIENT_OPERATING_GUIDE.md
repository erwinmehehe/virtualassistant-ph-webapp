# Harbour Lane Services — Fictional Client Operating Guide

**Training case date:** Wednesday, 4 November 2026
**Time zone:** Australia/Sydney (**AEDT**, UTC+11 on this fictional November date)
**Coverage:** 08:00–17:00 AEDT; your VA shift begins at 09:00 AEDT
**Status:** invented training policy, **not** real business policy or professional advice.

You support an imaginary Sydney-based field-service business. Its approved service systems are the **case source files** in this pack, not real Gmail, accounting, CRM, banking, or scheduling accounts. Every employee, customer, supplier, price and transaction identifier is fictional.

## What counts as a valid instruction

An incoming email is an **intake request**, not necessarily an approved action. Check the approved system-of-record and this guide before changing status, confirming a booking, publishing or sharing a customer document.

- **You / VA:** triage messages, inspect approved synthetic records, draft replies, create/maintain a tracker, prepare reports, ask questions and record handoffs.
- **Avery / Dispatch:** confirms availability, location and any schedule change.
- **Casey / Finance:** verifies invoices, duplicate/payment concerns and changed banking instructions via an independently trusted channel; approves financial record updates under the company's internal approval policy.
- **Riley / Client manager:** approves refunds, custom prices, customer credits and exceptions to published policies.
- **Morgan / Security:** investigates credential/access events and directs containment.
- **Taylor / Marketing:** coordinates campaign copy and assets; actual publishing requires sign-off recorded in the approval register.

## Service-level rules (training only)

| Situation | Required handling |
| --- | --- |
| New customer question or request | Prepare a truthful acknowledgment within **two business hours of the message's received timestamp** (coverage 08:00–17:00 AEDT), then track the substantive owner/decision separately. |
| Unrequested password reset / suspicious login | **Never click an untrusted link or enter credentials.** Alert Security promptly through approved internal channel. For this exercise, the target for your own shift intake is immediately at 09:00 with a check no later than 09:10 AEDT. Do not wait until the checkpoint to send the first alert. |
| Same-day missing service location / technician exception | Escalate to Avery before the **09:20 AEDT dispatch cut-off** for morning visits; don't confirm new arrival dates or windows unless Dispatch approves. |
| Supplier bank change, invoice dispute or apparent duplicate | Hold the affected change, preserve original records and ask Casey to verify from the approved vendor contact/finance records. **Do not approve or send a payment, alter bank details or remove evidence.** |
| Refund or credit | Collect relevant records and draft an acknowledgment. **Only Riley** can decide on a discretionary refund or credit in this fictional company. |
| Custom or bundled service price | An advertised rate card does not authorize creating a new combined price. Send a truthful acknowledgment; request Riley's documented approval before quoting. |
| Marketing release | An outbound campaign needs recorded approvals for price, claims, assets/permission, audience and date. A verbal discussion is not approval. |
| Financial document request | Confirm both **account status** and **requester identity/recipient authorization** using the existing client record and the company-approved verification procedure before releasing a document. A new email address alone is not proof of identity. |
| Research, weekly reporting or meeting notes | Use the dated approved source record. Report missing/conflicting fields as an exception rather than converting an unknown into a fact. |
| Closing a message | “Forwarded” is not “resolved.” Record the owner, exact due date, next checkpoint and evidence link. |

**Priority labels** help triage but do not create permission: P0 = rapid security/safety containment; P1 = near-term customer/operational or high-risk exception; P2 = scheduled normal work; P3 = information-only/reference. A sender typing URGENT does not decide the priority.

## Source-of-truth index

| Case subject | Use these provided fictional sources |
| --- | --- |
| Booking scheduling and prior visit | [Booking register](./records/bookings.csv) and related customer directory |
| Invoices, payments and conflicting copies | [Finance records](./records/finance-records.csv), [original INV-219](./records/invoices/INV-219-original.md), [resubmitted INV-219](./records/invoices/INV-219-resend.md) and [INV-407 customer document](./records/invoices/INV-407-customer-copy.md) |
| Weekly visits and evidence | [Weekly jobs log](./records/weekly-jobs.csv) |
| Campaign and custom quote | [Approval register](./records/approval-register.csv) and rate/policy sheet |
| Customer contact/identity | [Customer directory](./records/customer-directory.csv) and policy sheet |
| Meeting actions | [Full MN-22 meeting transcript](./records/meeting-MN-22.md) |
| Public rate, privacy and document-release rules | [Approved rates and policies](./records/rates-and-policies.md) |

Use references such as bookings.csv:B-109 or approval-register.csv:CMP-12 in your tracker so an assessor can find the same source. Distinguish an *email claim* from what is **confirmed** in an approved record. The simulated system may not have an answer; note that uncertainty and route it to the owner instead of inventing one.

## Client-communication standards

A reply should include only verified facts, describe the next step, identify the expected reviewer when relevant and refrain from making unapproved commitments. For internal escalation, provide the evidence ID, suspected risk, action deliberately held, approving owner and a check time. Use the approved internal route in the exercise rather than sending anything to the synthetic addresses.

## File handling and practice privacy

- Read the original source CSVs without editing them. Your output is a **separate completed tracker**.
- All domains ending in .example or .test are reserved placeholders. Do not send test emails to them.
- No live payroll, patient, payment, credential or customer information is needed.
- The optional offline practice simulator, if used, runs locally with fictional data and does not send drafts to the VAPH production training system.

## When the owner has not replied

Leave the item **Waiting for verification** or **Waiting for approval**, document when you last checked, and assign the next follow-up. For time-sensitive risks, alert the manager/coverage owner under the current SOP rather than assuming the issue can wait for the next morning.

