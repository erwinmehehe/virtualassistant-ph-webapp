import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateFocusVerticalAction, updateMarketplaceSettingsAction } from "@/app/actions/settings";

export default async function MarketplaceSettingsPage(){
  await requireRoleFast("admin");
  const admin=createAdminClient();
  const [{data:settings},{data:verticals},{data:agencyPeople}]=await Promise.all([
    admin.from("admin_settings").select("*").eq("id",1).single(),
    admin.from("focus_verticals").select("*").order("sort_order"),
    admin.from("profiles").select("id,full_name,role,account_status").in("role",["admin","recruiter"]).eq("account_status","active").order("full_name")
  ]);
  return <>
    <div className="page-head"><div><h1>Agency settings</h1><p>Keep pricing, ownership, finance guardrails, and recruiting defaults in one place so the website and internal workflows stay consistent.</p></div></div>
    <div className="grid-2" style={{alignItems:"start"}}>
      <form action={updateMarketplaceSettingsAction} className="card stack">
        <div><h3 style={{margin:0}}>Commercial defaults</h3><p className="small muted">These values are the source of truth for public pricing copy and internal hiring flows. Change them here instead of hard-coding numbers on individual pages.</p></div>
        <div className="field"><label>Minimum managed placement hourly rate, USD</label><input type="number" min="0" step="0.50" name="min_hourly_rate" defaultValue={settings?.min_hourly_rate??5}/><span className="field-help">This is the minimum standard rate shown across the service. Specialist roles can be higher.</span></div>
        <div className="field"><label>Default curated placement fee, USD</label><input type="number" min="0" step="50" name="default_placement_fee" defaultValue={settings?.default_placement_fee??0}/></div>
        <div className="field"><label>Default managed service markup, %</label><input type="number" min="0" max="100" step="1" name="default_managed_markup_percent" defaultValue={settings?.default_managed_markup_percent??0}/></div>
        <div className="field"><label>Default Client Success owner</label><select name="client_success_owner_id" defaultValue={settings?.client_success_owner_id||""}><option value="">Choose an owner</option>{(agencyPeople||[]).map((person:any)=><option value={person.id} key={person.id}>{person.full_name||person.role} · {person.role}</option>)}</select><span className="field-help">New placements inherit this owner automatically. This is where Jervis should be assigned once the migration is live.</span></div>

        <div style={{borderTop:"1px solid var(--border)",paddingTop:18,marginTop:4}}><h3 style={{margin:0}}>Finance guardrails</h3><p className="small muted">Agency Finance OS uses these rules for every managed placement. The margin floor is a control, not a suggestion: placements below it require an explicit owner exception.</p></div>
        <div className="grid-2"><div className="field"><label>Minimum acceptable margin, %</label><input type="number" min="0" max="100" step="0.5" name="finance_min_margin_percent" defaultValue={settings?.finance_min_margin_percent??15}/><span className="field-help">Below this level, owner approval is required.</span></div><div className="field"><label>Target margin, %</label><input type="number" min="0" max="100" step="0.5" name="finance_target_margin_percent" defaultValue={settings?.finance_target_margin_percent??25}/><span className="field-help">Placements between the floor and target show as watch.</span></div></div>
        <div className="grid-2"><div className="field"><label>Default payment / FX cost, %</label><input type="number" min="0" max="100" step="0.1" name="finance_default_payment_cost_percent" defaultValue={settings?.finance_default_payment_cost_percent??3}/><span className="field-help">Used when a placement finance profile is first set up.</span></div><div className="field"><label>Default allocated operating cost / month, USD</label><input type="number" min="0" step="1" name="finance_default_ops_cost_monthly" defaultValue={settings?.finance_default_ops_cost_monthly??0}/><span className="field-help">Optional allocation for Client Success, software, or shared operations.</span></div></div>
        <div className="field"><label>Collection overdue threshold, days</label><input type="number" min="1" max="120" step="1" name="finance_invoice_overdue_days" defaultValue={settings?.finance_invoice_overdue_days??7}/><span className="field-help">VA-compensation invoices older than this stay visible as overdue until collected.</span></div>
        <button className="btn btn-primary" type="submit">Save agency defaults</button>
      </form>
      <div className="card"><h3>Focus verticals</h3><p className="small muted">Keep only 2 to 3 active verticals until the vetting tests, talent-pool depth, and recruiter process are consistently strong.</p><div className="stack">{(verticals||[]).map((v:any)=><form action={updateFocusVerticalAction} className="vertical-row" key={v.id}><input type="hidden" name="vertical_id" value={v.id}/><label className="row"><input type="checkbox" name="active" defaultChecked={v.active}/><span><strong>{v.name}</strong><span className="small muted" style={{display:"block"}}>{v.description}</span></span></label><div className="field"><label>Talent pool target</label><input type="number" name="bench_target" min="1" max="25" defaultValue={v.bench_target}/></div><button className="btn btn-sm" type="submit">Save</button></form>)}</div></div>
    </div>
  </>;
}
