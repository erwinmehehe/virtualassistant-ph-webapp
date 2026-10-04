import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("payment attribution snapshots the originating lead and collected revenue stays service-role only",async()=>{
  const [migration,quality,loader,dashboard]=await Promise.all([
    read("supabase/migrations/20261004202000_revenue_attribution_and_nurture.sql"),
    read("supabase/migrations/20261004205500_junk_source_quality.sql"),
    read("src/lib/agency-funnel-metrics.ts"),
    read("src/components/agency-funnel-dashboard.tsx"),
  ]);

  assert.match(migration,/payments[\s\S]*lead_id uuid references public\.lead_intake/);
  assert.match(migration,/attribution_snapshot jsonb/);
  assert.match(migration,/payments_attach_lead_attribution/);
  assert.match(migration,/old\.lead_id is not null/);
  assert.match(migration,/old\.attribution_snapshot is not null/);
  assert.match(quality,/agency_revenue_attribution_metrics/);
  assert.match(quality,/collected_revenue_usd/);
  assert.match(quality,/junk_rate/);
  assert.match(quality,/lost_reason_code in \('spam','duplicate'\)/);
  assert.match(quality,/proposal_acceptance_rate/);
  assert.match(quality,/avg_customer_value_usd/);
  assert.match(quality,/top_loss_reason_code/);
  assert.match(quality,/revoke all on function public\.agency_revenue_attribution_metrics\(integer,uuid,text\) from public, anon, authenticated/);
  assert.match(quality,/grant execute on function public\.agency_revenue_attribution_metrics\(integer,uuid,text\) to service_role/);
  assert.match(loader,/AttributionModel = "first_touch" \| "last_touch"/);
  assert.match(dashboard,/Source-quality signals/);
  assert.match(dashboard,/Highest lead → win rate/);
  assert.match(dashboard,/Highest junk rate/);
  assert.match(dashboard,/Most losses/);
});

test("legacy leads receive deterministic first and last touch backfill without session guessing",async()=>{
  const migration=await read("supabase/migrations/20261004205000_backfill_legacy_attribution.sql");
  assert.match(migration,/first_touch_source/);
  assert.match(migration,/last_touch_source/);
  assert.match(migration,/nullif\(l\.attribution ->> 'utm_source',''\)/);
  assert.match(migration,/nullif\(l\.attribution ->> 'referrer_host',''\)/);
  assert.match(migration,/nullif\(l\.source_page,''\)/);
  assert.match(migration,/l\.created_at::text/);
  assert.doesNotMatch(migration,/analytics_events|session_id/);
});

test("long-term nurture is email-only, low priority, opt-out aware, and idempotent",async()=>{
  const [automation,email,unsubscribePage,unsubscribeAction,migration]=await Promise.all([
    read("src/lib/lead-nurture-automation.ts"),
    read("src/lib/email.ts"),
    read("src/app/email/unsubscribe/[token]/page.tsx"),
    read("src/app/actions/nurture.ts"),
    read("supabase/migrations/20261004202000_revenue_attribution_and_nurture.sql"),
  ]);

  assert.match(automation,/type Sequence = "nurture" \| "winback"/);
  assert.match(automation,/plusDays\(now, 14\)/);
  assert.match(automation,/NEXT_DELAY_DAYS = \[30, 60\]/);
  assert.match(automation,/status === "unsubscribed"/);
  assert.match(automation,/paused_reason === "client_replied"/);
  assert.match(email,/sendLeadNurtureEmail/);
  assert.match(email,/priority: "low"/);
  assert.match(email,/lead-nurture-\$\{args\.leadId\}-\$\{args\.sequence\}-\$\{args\.step\}/);
  assert.match(email,/Unsubscribe from this VA hiring sequence/);
  assert.match(unsubscribePage,/Stop automated follow-ups/);
  assert.match(unsubscribeAction,/status: "unsubscribed"/);
  assert.match(unsubscribeAction,/next_send_at: null/);
  assert.match(migration,/lead_nurture_state/);
  assert.match(migration,/enable row level security/);
  assert.match(migration,/recruiter_tasks_open_nurture_review_unique/);
  assert.doesNotMatch(automation,/twilio|whatsapp/i);
  assert.doesNotMatch(email,/twilio|whatsapp/i);
});

test("nurture stops on client reply and follows CRM stage eligibility",async()=>{
  const [webhook,recruiter,close,proposal,maintenance,automations]=await Promise.all([
    read("src/app/api/webhooks/resend/route.ts"),
    read("src/app/actions/recruiter.ts"),
    read("src/app/actions/close-lead.ts"),
    read("src/app/actions/proposals.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/app/workspace/recruiter/crm/automations/page.tsx"),
  ]);

  assert.match(webhook,/paused_reason: "client_replied"/);
  assert.match(webhook,/\.eq\("status", "active"\)/);
  assert.match(recruiter,/syncLeadNurtureState/);
  assert.match(close,/syncLeadNurtureState/);
  assert.match(proposal,/decline nurture setup failed/);
  assert.match(maintenance,/runLeadNurtureAutomation\(20\)/);
  assert.match(maintenance,/leadNurture: nurtureResult/);
  assert.match(automations,/Email nurture/);
  assert.match(automations,/No SMS · hiring follow-ups only/);
});

test("attribution capture stores first and last touch timestamps separately",async()=>{
  const [tracker,fields,leads,migration]=await Promise.all([
    read("src/components/attribution-tracker.tsx"),
    read("src/components/attribution-fields.tsx"),
    read("src/app/actions/leads.ts"),
    read("supabase/migrations/20261004202000_revenue_attribution_and_nurture.sql"),
  ]);

  assert.match(tracker,/FIRST_TOUCH_KEY/);
  assert.match(tracker,/LAST_TOUCH_KEY/);
  assert.match(tracker,/capturedAt/);
  assert.match(fields,/name="first_touch_at"/);
  assert.match(fields,/name="last_touch_source"/);
  assert.match(fields,/name="last_touch_at"/);
  assert.match(leads,/first_touch_at:/);
  assert.match(leads,/last_touch_source:/);
  assert.match(leads,/last_touch_at:/);
  assert.match(migration,/preserve_lead_first_touch_attribution/);
  assert.match(migration,/'first_touch_source'/);
  assert.match(migration,/'first_touch_at'/);
});
