# VAPH Trigger.dev automations

This package contains durable workflows that sit around VAPH. VAPH/Supabase remains the source of truth.

## First workflow: lead SLA

`vaph-lead-sla` is triggered after a new client hiring lead is stored.

- waits 30 minutes
- calls VAPH to check whether real recruiter contact happened
- creates a high-priority recruiter task/notification when contact is missing
- waits another 90 minutes
- escalates the same task to urgent if the lead is still untouched
- exits without action when the lead was contacted, closed, or already has discovery scheduled

No Supabase service key is stored in Trigger.dev. The task only calls the protected VAPH automation callback.

## Discovery outcome

`vaph-discovery-outcome` is queued whenever a discovery call is booked or rescheduled.

- waits until 45 minutes after the scheduled call end
- checks whether the recruiter recorded an outcome
- creates a high-priority outcome task when the call is still unresolved
- escalates the same task to urgent two hours later
- ignores stale runs after a reschedule
- creates an internal recommendation task when the outcome is qualified and no proposal exists
- creates an internal no-show recovery task without automatically emailing the client
- clears the outcome reminder as soon as the recruiter completes Discovery Workspace


## Proposal closing

Two durable tasks work together:

- `vaph-proposal-closing` checks a sent proposal at 24 hours and again at 48 hours
- unopened proposals create a recruiter follow-up task
- proposals that were viewed but have no decision create a warmer decision follow-up task
- the 48-hour checkpoint escalates the same action to urgent
- `vaph-proposal-viewed` starts a separate 4-hour follow-up clock from the first client view
- resends invalidate older runs by comparing the current `sent_at`
- stale view runs exit when the recorded `viewed_at` no longer matches
- changes requested create an urgent revision task immediately
- accepted, declined, expired, or resent proposals clear stale closing work
- the existing 2-day client reminder email remains in maintenance
- legacy recruiter proposal reminders remain active until `TRIGGER_AUTOMATIONS_ACTIVE=1`


## Shortlist and interview conversion

Three durable tasks cover the next conversion stage:

- `vaph-shortlist-review` checks released shortlists at 24 hours and 48 hours
- unresolved client decisions create one recruiter follow-up task that escalates to urgent at 48 hours
- the client also receives an in-app shortlist reminder; no automatic client email is sent by this workflow
- `vaph-interview-scheduling` checks a client-requested interview after 4 hours and again at 24 hours
- scheduling or cancelling the interview clears stale scheduling work
- `vaph-interview-feedback` starts from the scheduled interview time, waits until two hours after the interview ends, and asks for Proceed, Hold, or Pass
- missing feedback escalates to urgent 24 hours after the interview
- reschedules invalidate older feedback runs by comparing the current `scheduled_at`
- Proceed immediately creates a recruiter `Prepare placement offer` task
- creating the placement offer clears the offer-preparation task
- legacy daily shortlist and interview reminders remain active until `TRIGGER_AUTOMATIONS_ACTIVE=1`


1. Create a Trigger.dev project.
2. Set `TRIGGER_PROJECT_REF` locally in this package.
3. Add the same 32+ character `AUTOMATION_CALLBACK_SECRET` to Vercel and Trigger.dev.
4. Add a Trigger-only production API key to Vercel as `TRIGGER_SECRET_KEY`.
5. Set `VAPH_APP_URL=https://virtualassistant.com.ph` in Trigger.dev.
6. From this directory run `npm install`, then `npx trigger.dev@4.6.4 deploy`.
7. Verify the deployed tasks, then set `TRIGGER_AUTOMATIONS_ACTIVE=1` in Vercel.

Until the secrets are configured and activation is explicit, VAPH safely skips queueing the automation and lead capture behaves exactly as before.
