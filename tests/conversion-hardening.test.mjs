import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("proposal response and delivered-send finalization are database-atomic",async()=>{
  const [actions,migration]=await Promise.all([
    read("src/app/actions/proposals.ts"),
    read("supabase/migrations/20261004143000_conversion_hardening.sql"),
  ]);

  assert.match(actions,/respond_to_lead_proposal_atomic/);
  assert.match(actions,/finalize_lead_proposal_send_atomic/);
  assert.doesNotMatch(
    actions.slice(actions.indexOf("export async function respondToLeadProposalAction"),actions.indexOf("type AtomicAcceptanceResult")),
    /from\("lead_proposals"\)\.update/
  );
  assert.match(migration,/for update/);
  assert.match(migration,/proposal_changes_requested/);
  assert.match(migration,/proposal_declined/);
  assert.match(migration,/crm_stage = 'terms_sent'/);
  assert.match(migration,/grant execute on function public\.respond_to_lead_proposal_atomic/);
  assert.match(migration,/grant execute on function public\.finalize_lead_proposal_send_atomic/);
});

test("client handoff uses exact service-role identity lookup instead of paginated Auth enumeration",async()=>{
  const [handoff,migration]=await Promise.all([
    read("src/lib/client-handoff.ts"),
    read("supabase/migrations/20261004143000_conversion_hardening.sql"),
  ]);

  assert.match(handoff,/find_auth_user_id_by_email/);
  assert.match(handoff,/identity_lookup_error/);
  assert.doesNotMatch(handoff,/listUsers/);
  assert.match(migration,/from auth\.users/);
  assert.match(migration,/lower\(u\.email\) = lower\(btrim\(p_email\)\)/);
  assert.match(migration,/grant execute on function public\.find_auth_user_id_by_email\(text\) to service_role/);
});

test("hiring forms persist first-touch marketing attribution through to customer reporting",async()=>{
  const [fields,forms,leads,metrics,dashboard,migration]=await Promise.all([
    read("src/components/attribution-fields.tsx"),
    read("src/components/hiring-brief-form.tsx"),
    read("src/app/actions/leads.ts"),
    read("src/lib/agency-funnel-metrics.ts"),
    read("src/components/agency-funnel-dashboard.tsx"),
    read("supabase/migrations/20261004143000_conversion_hardening.sql"),
  ]);

  for(const key of ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","referrer","landing_page","first_touch_source"]){
    assert.match(fields,new RegExp(`name="${key}"`));
  }
  assert.match(forms,/AttributionFields sourcePath=\{sourcePath\}/);
  assert.match(leads,/attribution: leadAttribution\(formData, sourcePath\)/);
  assert.match(metrics,/getAgencyAttributionMetrics/);
  assert.match(dashboard,/Lead source → customer/);
  assert.match(dashboard,/won value/);
  assert.match(migration,/agency_attribution_metrics/);
  assert.match(migration,/won_value_usd/);
});

test("upload transport limit safely exceeds the advertised 10 MB attachment limit",async()=>{
  const [config,leads]=await Promise.all([
    read("next.config.ts"),
    read("src/app/actions/leads.ts"),
  ]);
  assert.match(config,/bodySizeLimit: "12mb"/);
  assert.match(leads,/attachment\.size > 10 \* 1024 \* 1024/);
});

test("operational email routing has no hard-coded personal Gmail fallback",async()=>{
  const [email,env]=await Promise.all([
    read("src/lib/email.ts"),
    read(".env.example"),
  ]);
  assert.doesNotMatch(email,/@gmail\.com/i);
  assert.doesNotMatch(env,/@gmail\.com/i);
  assert.match(email,/process\.env\.BOOKING_TEAM_EMAILS/);
  assert.match(email,/process\.env\.PRIVATE_INTERNAL_EMAILS/);
  assert.match(env,/BOOKING_TEAM_EMAILS=/);
  assert.match(env,/PRIVATE_INTERNAL_EMAILS=/);
});

test("client proposal labels talent examples as non-reserved public-pool context",async()=>{
  const page=await read("src/app/proposal/[token]/page.tsx");
  assert.match(page,/public_va_directory/);
  assert.match(page,/Examples from our approved talent pool/);
  assert.match(page,/not a reserved shortlist/);
  assert.match(page,/PublicAvatar/);
});
