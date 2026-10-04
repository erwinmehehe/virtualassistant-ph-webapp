import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateFocusVerticalAction, updateLeadScoringSettingsAction, updateMarketplaceSettingsAction } from "@/app/actions/settings";
import { MIN_HOURLY_RATE } from "@/lib/constants";
import { normalizeLeadScoringRules } from "@/lib/lead-scoring";

export default async function MarketplaceSettingsPage(){
  await requireRoleFast("admin");
  const admin=createAdminClient();
  const [{data:settings},{data:verticals},{data:agencyPeople}]=await Promise.all([
    admin.from("admin_settings").select("*").eq("id",1).single(),
    admin.from("focus_verticals").select("*").order("sort_order"),
    admin.from("profiles").select("id,full_name,role,account_status").in("role",["admin","recruiter"]).eq("account_status","active").order("full_name")
  ]);
  const leadRules=normalizeLeadScoringRules(settings?.lead_scoring_rules);
  return <>
    <div className="page-head"><div><h1>Agency settings</h1><p>Keep pricing, ownership, finance guardrails, and recruiting defaults in one place so the website and internal workflows stay consistent.</p></div></div>
    <div className="grid-2" style={{alignItems:"start"}}>
      <form action={updateMarketplaceSettingsAction} className="card stack">
        <div><h3 style={{margin:0}}>Commercial defaults</h3><p className="small muted">These values are the source of truth for public pricing copy and internal hiring flows. Change them here instead of hard-coding numbers on individual pages.</p></div>
        <div className="field"><label>Minimum managed placement hourly rate, USD</label><input type="number" min={MIN_HOURLY_RATE} step="0.50" name="min_hourly_rate" defaultValue={Math.max(MIN_HOURLY_RATE, Number(settings?.min_hourly_rate ?? MIN_HOURLY_RATE))}/><span className="field-help">This is the minimum standard rate shown across the service. Specialist roles can be higher.</span></div>
        <div className="field"><label>Default curated placement fee, USD</label><input type="number" min="0" step="50" name="default_placement_fee" defaultValue={settings?.default_placement_fee??0}/></div>
        <div className="field"><label>Default managed service markup, %</label><input type="number" min="0" max="100" step="1" name="default_managed_markup_percent" defaultValue={settings?.default_managed_markup_percent??0}/></div>
        <div className="field"><label>Default Client Success owner</label><select name="client_success_owner_id" defaultValue={settings?.client_success_owner_id||""}><option value="">Choose an owner</option>{(agencyPeople||[]).map((person:any)=><option value={person.id} key={person.id}>{person.full_name||person.role} · {person.role}</option>)}</select><span className="field-help">New placements inherit this owner automatically. This is where Jervis should be assigned once the migration is live.</span></div>

        <div style={{borderTop:"1px solid var(--border)",paddingTop:18,marginTop:4}}><h3 style={{margin:0}}>Finance guardrails</h3><p className="small muted">Agency Finance OS uses these rules for every managed placement. The margin floor is a control, not a suggestion: placements below it require an explicit owner exception.</p></div>
        <div className="grid-2"><div className="field"><label>Minimum acceptable margin, %</label><input type="number" min="0" max="100" step="0.5" name="finance_min_margin_percent" defaultValue={settings?.finance_min_margin_percent??15}/><span className="field-help">Below this level, owner approval is required.</span></div><div className="field"><label>Target margin, %</label><input type="number" min="0" max="100" step="0.5" name="finance_target_margin_percent" defaultValue={settings?.finance_target_margin_percent??25}/><span className="field-help">Placements between the floor and target show as watch.</span></div></div>
        <div className="grid-2"><div className="field"><label>Default payment / FX cost, %</label><input type="number" min="0" max="100" step="0.1" name="finance_default_payment_cost_percent" defaultValue={settings?.finance_default_payment_cost_percent??3}/><span className="field-help">Used when a placement finance profile is first set up.</span></div><div className="field"><label>Default allocated operating cost / month, USD</label><input type="number" min="0" step="1" name="finance_default_ops_cost_monthly" defaultValue={settings?.finance_default_ops_cost_monthly??0}/><span className="field-help">Optional allocation for Client Success, software, or shared operations.</span></div></div>
        <div className="field"><label>Collection overdue threshold, days</label><input type="number" min="1" max="120" step="1" name="finance_invoice_overdue_days" defaultValue={settings?.finance_invoice_overdue_days??7}/><span className="field-help">VA-compensation invoices older than this stay visible as overdue until collected.</span></div>
        <button className="btn btn-primary" type="submit">Save agency defaults</button>
      </form>
      <div className="stack">
        <form action={updateLeadScoringSettingsAction} className="card stack">
          <div><h3 style={{margin:0}}>Lead scoring</h3><p className="small muted">Tune how recruiter CRM prioritizes active hiring leads. Changes apply to board scores, list badges, and score-based ordering without a redeploy.</p></div>
          <div className="grid-2">
            <div className="field"><label>Hot lead threshold</label><input type="number" name="score_hot_threshold" min="1" max="100" defaultValue={leadRules.hotThreshold}/></div>
            <div className="field"><label>Warm lead threshold</label><input type="number" name="score_warm_threshold" min="0" max="99" defaultValue={leadRules.warmThreshold}/></div>
          </div>
          <div><strong className="small">Pipeline stage points</strong><p className="small muted">Later buying stages should generally score higher than early enquiries.</p></div>
          <div className="grid-2">
            {([
              ["new","New"],
              ["contacted","Contacted"],
              ["discovery_booked","Discovery booked"],
              ["qualified","Qualified"],
              ["terms_sent","Proposal / terms sent"],
              ["shortlist_sent","Shortlist sent"],
              ["nurture","Nurture"],
            ] as const).map(([key,label])=><div className="field" key={key}><label>{label}</label><input type="number" name={`score_stage_${key}`} min="0" max="100" defaultValue={leadRules.stagePoints[key]}/></div>)}
          </div>
          <div><strong className="small">Engagement signals</strong></div>
          <div className="grid-2">
            <div className="field"><label>Active today bonus</label><input type="number" name="score_active_today" min="0" max="50" defaultValue={leadRules.activeTodayPoints}/></div>
            <div className="field"><label>Recent ≤3 days bonus</label><input type="number" name="score_recent_3d" min="0" max="50" defaultValue={leadRules.recent3DaysPoints}/></div>
            <div className="field"><label>Recent ≤7 days bonus</label><input type="number" name="score_recent_7d" min="0" max="50" defaultValue={leadRules.recent7DaysPoints}/></div>
            <div className="field"><label>Stale 7+ day penalty</label><input type="number" name="score_stale_7d_penalty" min="0" max="50" defaultValue={leadRules.stale7Penalty}/></div>
            <div className="field"><label>Stale 14+ day penalty</label><input type="number" name="score_stale_14d_penalty" min="0" max="50" defaultValue={leadRules.stale14Penalty}/></div>
            <div className="field"><label>Discovery booked bonus</label><input type="number" name="score_discovery_booked" min="0" max="50" defaultValue={leadRules.discoveryBookedPoints}/></div>
            <div className="field"><label>Discovery completed bonus</label><input type="number" name="score_discovery_completed" min="0" max="50" defaultValue={leadRules.discoveryCompletedPoints}/></div>
            <div className="field"><label>Follow-up due soon bonus</label><input type="number" name="score_followup_due" min="0" max="50" defaultValue={leadRules.followUpDueSoonPoints}/></div>
            <div className="field"><label>Overdue follow-up base bonus</label><input type="number" name="score_followup_overdue_base" min="0" max="50" defaultValue={leadRules.followUpOverdueBasePoints}/></div>
            <div className="field"><label>Overdue follow-up max bonus</label><input type="number" name="score_followup_overdue_max" min="0" max="50" defaultValue={leadRules.followUpOverdueMaxPoints}/></div>
            <div className="field"><label>First response SLA, minutes</label><input type="number" name="score_first_response_minutes" min="1" max="1440" defaultValue={leadRules.firstResponseOverdueMinutes}/></div>
            <div className="field"><label>Missed first-response bonus</label><input type="number" name="score_first_response_points" min="0" max="50" defaultValue={leadRules.firstResponseOverduePoints}/></div>
          </div>
          <div><strong className="small">Budget fit</strong><p className="small muted">Monthly client budget thresholds are estimated from the hiring brief. Agency-value rules are used only when client budget cannot be estimated.</p></div>
          <div className="grid-2">
            <div className="field"><label>Budget low threshold, USD/mo</label><input type="number" name="score_budget_low_threshold" min="0" defaultValue={leadRules.budgetLowThreshold}/></div>
            <div className="field"><label>Budget low points</label><input type="number" name="score_budget_low" min="0" max="50" defaultValue={leadRules.budgetLowPoints}/></div>
            <div className="field"><label>Budget medium threshold, USD/mo</label><input type="number" name="score_budget_medium_threshold" min="0" defaultValue={leadRules.budgetMediumThreshold}/></div>
            <div className="field"><label>Budget medium points</label><input type="number" name="score_budget_medium" min="0" max="50" defaultValue={leadRules.budgetMediumPoints}/></div>
            <div className="field"><label>Budget high threshold, USD/mo</label><input type="number" name="score_budget_high_threshold" min="0" defaultValue={leadRules.budgetHighThreshold}/></div>
            <div className="field"><label>Budget high points</label><input type="number" name="score_budget_high" min="0" max="50" defaultValue={leadRules.budgetHighPoints}/></div>
            <div className="field"><label>Any known budget points</label><input type="number" name="score_budget_any" min="0" max="50" defaultValue={leadRules.budgetAnyPoints}/></div>
          </div>
          <input type="hidden" name="score_agency_medium_threshold" value={leadRules.agencyValueMediumThreshold}/>
          <input type="hidden" name="score_agency_high_threshold" value={leadRules.agencyValueHighThreshold}/>
          <input type="hidden" name="score_agency_any" value={leadRules.agencyValueAnyPoints}/>
          <input type="hidden" name="score_agency_medium" value={leadRules.agencyValueMediumPoints}/>
          <input type="hidden" name="score_agency_high" value={leadRules.agencyValueHighPoints}/>
          <button className="btn btn-primary" type="submit">Save lead scoring</button>
        </form>
        <div className="card"><h3>Focus verticals</h3><p className="small muted">Keep only 2 to 3 active verticals until the vetting tests, talent-pool depth, and recruiter process are consistently strong.</p><div className="stack">{(verticals||[]).map((v:any)=><form action={updateFocusVerticalAction} className="vertical-row" key={v.id}><input type="hidden" name="vertical_id" value={v.id}/><label className="row"><input type="checkbox" name="active" defaultChecked={v.active}/><span><strong>{v.name}</strong><span className="small muted" style={{display:"block"}}>{v.description}</span></span></label><div className="field"><label>Talent pool target</label><input type="number" name="bench_target" min="1" max="25" defaultValue={v.bench_target}/></div><button className="btn btn-sm" type="submit">Save</button></form>)}</div></div>
      </div>
    </div>
  </>;
}
