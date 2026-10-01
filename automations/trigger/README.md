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


## Activate

1. Create a Trigger.dev project.
2. Set `TRIGGER_PROJECT_REF` locally in this package.
3. Add the same 32+ character `AUTOMATION_CALLBACK_SECRET` to Vercel and Trigger.dev.
4. Add a Trigger-only production API key to Vercel as `TRIGGER_SECRET_KEY`.
5. Set `VAPH_APP_URL=https://virtualassistant.com.ph` in Trigger.dev.
6. From this directory run `npm install`, then `npx trigger.dev@4.6.4 deploy`.

Until both Vercel secrets are configured, VAPH safely skips queueing the automation and lead capture behaves exactly as before.
