# Recruiter Hiring Pipeline: Connected Lead-to-Role Workflow

Date: 2026-09-26  
Status: Approved design direction (Option B)  
Repository: erwinmehehe/virtualassistant-ph-webapp

## 1. Problem

The recruiter CRM currently presents employer enquiries as a sales pipeline even though VirtualAssistant.com.ph is primarily operating a recruitment workflow.

The data model is already partially connected:

- `lead_intake.job_id` links a hiring lead to a job/role.
- `jobs.lead_id` links the role back to the source lead.
- Newer website hiring forms already create a pending `jobs` row and attach it to the lead.
- The Role Control Center already contains the useful recruiting workflow: role readiness, matching, shortlist, client handoff, interviews, offers, and placement.

The UI does not make that connection obvious. A linked role is currently represented by a small "Role linked" badge and a buried "View linked role" button. Older/manual leads may have no linked role at all.

The result is a fragmented recruiter experience: recruiters maintain CRM fields in one screen, then have to discover a separate role workspace before actual recruiting begins.

## 2. Goal

Make the recruiter experience recruitment-first:

```
Hiring enquiry
  -> linked role
  -> recruiter reviews role
  -> internal matching starts immediately
  -> recruiter builds shortlist
  -> client review
  -> interview
  -> offer
  -> hire / placement
```

The lead inbox should answer three questions immediately:

1. Who is hiring?
2. What role are they hiring for?
3. What should the recruiter do next?

The Role Control Center remains the source of truth for active recruiting. The CRM becomes a triage and employer-contact layer, not a competing recruiting workspace.

## 3. Non-goals

This redesign will not:

- Create a second CRM subsystem.
- Replace the existing `jobs` or Role Control Center architecture.
- Auto-send or auto-release candidates to clients.
- Treat an automatic match score as a recruiter-approved shortlist.
- Add a new candidate-matching algorithm.
- Change payment, proposal acceptance, or placement state machines.
- Add unrelated product features.
- Require a destructive data migration.

## 4. Core architecture

### 4.1 Lead = intake record

`lead_intake` remains the source for:

- contact identity
- company
- original request
- source attribution
- first response and follow-up
- discovery booking
- lead owner
- sales qualification state
- proposal state
- lost / nurture context

### 4.2 Job = recruiting record

`jobs` remains the source for:

- role title
- responsibilities
- skills and tools
- hours
- budget
- timezone
- start timing
- recruiter assignment
- hiring stage
- matching
- shortlist
- client review
- interviews
- offers
- placement handoff

Once a genuine hiring lead has a role, recruiters should perform recruiting work in the Role Control Center rather than duplicating it in the lead card.

### 4.3 Existing bidirectional link is authoritative

The system will continue to use:

- `lead_intake.job_id`
- `jobs.lead_id`

No replacement relation will be introduced.

## 5. Role creation behavior

### 5.1 New website hiring enquiries

Current successful behavior is preserved.

Service, industry, and full role-brief forms already create a pending role through the lead-to-job helper flow. That role must remain linked immediately.

The redesign must make this existing role visible in the recruiter inbox instead of making it look like the lead is disconnected.

### 5.2 Legacy or manually created hiring leads

Any genuine `client_hiring` lead without `job_id` will show one primary action:

**Create role & start matching**

The action must be idempotent.

Order of operations:

1. Re-read the lead.
2. If `lead_intake.job_id` exists, reuse it.
3. Otherwise check for an existing `jobs.lead_id = lead.id`; reuse and repair the reverse link if present.
4. Otherwise create one pending role from the lead.
5. Copy the best structured values available:
   - client/company
   - service/category
   - hiring message
   - hours
   - budget range
   - timezone
   - start timing
6. Use the existing category, hours, budget, summary, and job-title inference helpers.
7. Set `jobs.recruiter_id` to the acting recruiter only when no recruiter is already assigned.
8. Set `lead_intake.owner_id` to the acting recruiter only when no owner is already assigned.
9. Write recruiter activity documenting that the role was created or recovered from the hiring lead.
10. Redirect directly to:
   `/workspace/recruiter/roles/{jobId}#matching`

Incomplete leads are allowed to create an incomplete pending role. Existing role-readiness gates will identify missing requirements. Recruiters should not be forced to copy the lead manually before they can inspect the candidate pool.

### 5.3 Shared implementation

The existing lead-to-job creation logic in `src/app/actions/leads.ts` must not be copied into a second implementation.

Extract the idempotent conversion logic into a focused shared module, for example:

`src/lib/lead-role.ts`

Public lead actions and recruiter conversion actions should call the same helper.

This keeps the mapping between lead fields and job fields consistent.

## 6. Immediate matching behavior

"Start matching" means opening the existing internal matching workspace immediately after the role exists.

The existing `StaffJobMatching` component already evaluates approved/bench VAs against a job when the Role Control Center is rendered. Therefore the redesign does not need to create fake shortlist rows merely to say matching has started.

Rules:

- Internal matching can be viewed before the client account is linked.
- Internal matching can be viewed before commercial terms are accepted.
- Candidates remain recruiter-only until existing client-release gates pass.
- Match suggestions stay unselected until a recruiter chooses them.
- No automatic match may be represented as a client shortlist.
- Existing role readiness and commercial gates continue to control release.

## 7. Recruiter inbox UI

### 7.1 Rename and reposition

The page should no longer lead with "Sales CRM".

Primary label:

**Hiring Pipeline**

Primary page title:

**Hiring inbox**

Supporting copy should explain that new enquiries become roles and move into matching.

### 7.2 Primary navigation

Reduce the visible mental model.

Primary recruiter workflow navigation:

- **Hiring inbox** -> current lead intake / attention work
- **Active roles** -> `/workspace/recruiter/roles`
- **Client review** -> role workflow filtered or focused on client-review work
- **Placements** -> `/workspace/recruiter/placements`
- **Closed** -> archived/lost lead history

The existing granular CRM views may remain available through secondary filters when useful, but should no longer dominate the main navigation.

### 7.3 Lead card information hierarchy

Each lead card should prioritize:

#### Header
- contact/client name
- company
- received age
- owner
- attention/SLA warning when relevant

#### Hiring need
- role title/category
- hours
- budget
- timezone
- start timing
- concise original request

#### Role bridge
If linked:

- linked role title
- role status / hiring stage
- role readiness state
- recruiter assignment if useful
- primary CTA: **Open role & match**

If not linked:

- status: **No role yet**
- explanation: "Create the recruiting role from this enquiry."
- primary CTA: **Create role & start matching**

#### Client communication
The immediate reply action remains visible when first response is due.

#### Secondary CRM details
Move these into a lower-priority or collapsible section:

- manual CRM stage
- estimated agency value
- lost reason
- detailed follow-up controls
- activity log
- discovery history
- proposal history
- private notes

The recruiter should not have to scan these fields to discover whether a role exists.

## 8. Next-action logic

Every open lead should surface one clear next action.

Priority order:

1. First response overdue -> **Reply to client**
2. No role -> **Create role & start matching**
3. Linked role has missing readiness fields -> **Complete role brief**
4. Role exists and internal matching is available -> **Review matches**
5. Discovery is scheduled -> **Open / complete discovery**
6. Client shortlist has been released -> route recruiter to the Role Control Center client-review section
7. Lead is nurture -> show nurture follow-up
8. Closed/lost -> no recruiting CTA

This does not need a new workflow engine. The UI can derive the next action from existing lead, job, and shortlist state.

## 9. Data loading

For the visible lead page only, load linked role context in a batched query using the visible `job_id` values.

Required role fields should be limited to what the inbox needs, such as:

- id
- title
- status
- hiring_stage
- recruiter_id
- summary
- responsibilities
- required_skills
- hours_per_week
- min_hourly_rate
- max_hourly_rate
- timezone
- start_timing

Do not run the full candidate matching algorithm for every lead card.

The exact candidate pool belongs on the Role Control Center where `StaffJobMatching` already performs that work.

Optional shortlist counts may be fetched in batch if inexpensive, but they are not required for the first release of this redesign.

## 10. Error handling

### Role conversion failure

If the role cannot be created:

- keep the lead intact
- do not partially detach or overwrite an existing role
- return the recruiter to the same inbox state
- show a specific error
- write no misleading success activity

### Concurrent role creation

Two requests must not create two roles for one lead.

The existing idempotency strategy must be preserved:

- check `lead_intake.job_id`
- check `jobs.lead_id`
- reuse the winner of a concurrent creation when possible

If database uniqueness enforcement exists for this relationship, use it. Do not rely only on frontend button disabling.

### Existing ownership

Never overwrite an existing recruiter/owner assignment merely because another recruiter clicks through the role.

## 11. Visual design direction

Keep the existing VAPH visual system but simplify hierarchy.

- White cards, restrained borders, clear spacing.
- Indigo primary action.
- Emerald only for genuinely successful/ready states.
- Amber for SLA/readiness attention.
- Avoid badge overload.
- One dominant CTA per lead.
- Desktop card should read left-to-right as Client -> Hiring need -> Role/action.
- Mobile should stack in that same order.
- Secondary controls should not compete with the primary hiring action.

No decorative redesign should delay the workflow connection.

## 12. Files expected to change

Likely implementation surface:

- `src/app/workspace/recruiter/leads/page.tsx`
- `src/app/workspace/recruiter/leads/leads.module.css`
- `src/app/actions/leads.ts`
- a focused shared helper such as `src/lib/lead-role.ts`
- a recruiter server action file for "Create role & start matching"
- relevant recruiter navigation/layout if labels need updating
- tests covering lead-role linking and CRM hierarchy

The Role Control Center and `StaffJobMatching` should be reused rather than rebuilt.

## 13. Testing requirements

Implementation must use test-first development.

Required regression coverage:

1. New public hiring leads still create exactly one linked pending role.
2. A legacy hiring lead with no role can create a role from the recruiter inbox.
3. Repeating the action reuses the same role.
4. If a `jobs.lead_id` row already exists but `lead_intake.job_id` is missing, the relation is repaired rather than duplicated.
5. Existing recruiter assignment is preserved.
6. Existing lead owner is preserved.
7. The recruiter action redirects to `/workspace/recruiter/roles/{id}#matching`.
8. The inbox prominently renders **Open role & match** for linked roles.
9. The inbox prominently renders **Create role & start matching** for unlinked hiring leads.
10. Manual CRM controls are visually secondary to hiring need and role state.
11. Existing direct reply, discovery, proposal, close-lead, and no-show recovery flows remain functional.
12. Mobile layout preserves the Client -> Hiring need -> Role/action order.

Run the targeted recruiter/lead tests first, then the full repository test suite before merge.

## 14. Success criteria

This redesign is successful when a recruiter can:

1. Open the Hiring inbox.
2. Understand the employer and role without expanding a large CRM form.
3. See immediately whether a recruiting role exists.
4. Create/recover the role in one action when needed.
5. Open the role directly at matching.
6. Review candidates without waiting for proposal acceptance.
7. Keep candidates internal until the existing release gates are satisfied.
8. Return to the CRM only for employer communication, qualification, nurture, or closure.

The product should feel like one continuous hiring workflow rather than a sales CRM sitting beside a recruiting application.
