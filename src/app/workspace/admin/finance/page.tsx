import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculatePlacementFinance, financeStatusLabel } from "@/lib/agency-finance";
import { money } from "@/lib/format";
import type { PaymentRow, PlacementFinanceProfileRow } from "@/lib/workspace-rows";

type FinanceWorkroomRow = {
  id: string;
  status: string | null;
  placement_stage: string | null;
  agreed_hourly_rate: number | null;
  start_date: string | null;
  health_status: string | null;
  jobs: { title: string | null; recruiter_id: string | null; hours_per_week: number | null } | null;
  client: { full_name: string | null } | null;
  va: { full_name: string | null } | null;
};

const statusClass:Record<string,string>={healthy:"badge-success",watch:"badge-warning",approval_required:"badge-danger",approved_exception:"badge-warning",needs_setup:""};

export default async function AdminFinancePage(){
  await requireRole("admin");
  const admin=createAdminClient();
  const [{data:settings},{data:roomData},{data:profileData},{data:paymentData}]=await Promise.all([
    admin.from("admin_settings").select("finance_min_margin_percent,finance_target_margin_percent,finance_default_payment_cost_percent,finance_default_ops_cost_monthly,finance_invoice_overdue_days").eq("id",1).single(),
    admin.from("workrooms").select("id,status,placement_stage,agreed_hourly_rate,start_date,health_status,jobs(title,recruiter_id,hours_per_week),client:profiles!workrooms_client_id_fkey(full_name),va:profiles!workrooms_va_id_fkey(full_name)").neq("placement_stage","ended").order("created_at",{ascending:false}).limit(250),
    admin.from("placement_finance_profiles").select("*").order("updated_at",{ascending:false}),
    admin.from("payments").select("id,workroom_id,amount_total,currency,status,created_at,paid_at,released_at").order("created_at",{ascending:false}).limit(500)
  ]);

  const minMargin=Number(settings?.finance_min_margin_percent??15);
  const targetMargin=Number(settings?.finance_target_margin_percent??25);
  const overdueDays=Number(settings?.finance_invoice_overdue_days??7);
  const rooms=(roomData||[]) as unknown as FinanceWorkroomRow[];
  const payments=(paymentData||[]) as PaymentRow[];
  const profileMap=new Map(((profileData||[]) as PlacementFinanceProfileRow[]).map((row)=>[row.workroom_id,row]));
  const paymentsByRoom=new Map<string,PaymentRow[]>();
  for(const payment of payments){if(!payment.workroom_id)continue;const current=paymentsByRoom.get(payment.workroom_id)||[];current.push(payment);paymentsByRoom.set(payment.workroom_id,current);}
  const now=Date.now();
  const overdueCutoff=now-overdueDays*86400000;

  const rows=rooms.map((room)=>{
    const profile=profileMap.get(room.id);
    const result=profile?calculatePlacementFinance({
      expectedMonthlyClientRevenue:Number(profile.expected_monthly_client_revenue||0),
      expectedMonthlyVaCompensation:Number(profile.expected_monthly_va_compensation||0),
      paymentCostPercent:Number(profile.payment_cost_percent||0),
      monthlyOpsCost:Number(profile.monthly_ops_cost||0),
      otherMonthlyCost:Number(profile.other_monthly_cost||0),
      minMarginPercent:minMargin,
      targetMarginPercent:targetMargin,
      exceptionStatus:profile.exception_status
    }):calculatePlacementFinance({expectedMonthlyClientRevenue:0,expectedMonthlyVaCompensation:0,paymentCostPercent:0,monthlyOpsCost:0,otherMonthlyCost:0,minMarginPercent:minMargin,targetMarginPercent:targetMargin});
    const roomPayments=paymentsByRoom.get(room.id)||[];
    const awaiting=roomPayments.filter((p)=>p.status==="awaiting_payment");
    const overdue=awaiting.filter((p)=>new Date(p.created_at).getTime()<overdueCutoff);
    const payoutReady=roomPayments.filter((p)=>["paid","release_pending"].includes(p.status));
    const unreconciled=Boolean(profile)&&(!profile?.reconciled_at||new Date(profile?.updated_at||0).getTime()>new Date(profile?.reconciled_at||0).getTime());
    return{room,profile,result,awaiting,overdue,payoutReady,unreconciled};
  });

  const configured=rows.flatMap((row)=>row.profile&&Number(row.profile.expected_monthly_client_revenue||0)>0?[{...row,profile:row.profile}]:[]);
  const expectedMrr=configured.reduce((sum,row)=>sum+Number(row.profile.expected_monthly_client_revenue||0),0);
  const expectedVa=configured.reduce((sum,row)=>sum+Number(row.profile.expected_monthly_va_compensation||0),0);
  const contribution=configured.reduce((sum,row)=>sum+Number(row.result.contribution||0),0);
  const blendedMargin=expectedMrr>0?(contribution/expectedMrr)*100:0;
  const pending=rows.filter((row)=>row.profile?.exception_status==="pending").length;
  const needsSetup=rows.filter((row)=>!row.profile||row.result.status==="needs_setup").length;
  const awaitingTotal=payments.filter((p)=>p.status==="awaiting_payment").reduce((sum,p)=>sum+Number(p.amount_total||0),0);
  const overdueTotal=payments.filter((p)=>p.status==="awaiting_payment"&&new Date(p.created_at).getTime()<overdueCutoff).reduce((sum,p)=>sum+Number(p.amount_total||0),0);
  const payoutReadyTotal=payments.filter((p)=>["paid","release_pending"].includes(p.status)).reduce((sum,p)=>sum+Number(p.amount_total||0),0);

  return <>
    <div className="page-head"><div><div className="kicker">Finance</div><h1>Agency Finance OS</h1><p>One owner workspace for placement economics, collections, invoices, payouts, disputes, reconciliation, and margin guardrails.</p></div><div className="row wrap"><Link className="btn" href="/workspace/admin/payments">Invoices & payouts</Link><Link className="btn" href="/workspace/admin/settings">Finance settings</Link></div></div>

    <div className="grid-4" style={{marginBottom:24}}>
      <div className="card"><span className="small muted">Expected managed MRR</span><strong style={{display:"block",fontSize:28,marginTop:6}}>{money(expectedMrr)}</strong><span className="small muted">{configured.length} configured placement{configured.length===1?"":"s"}</span></div>
      <div className="card"><span className="small muted">Expected contribution</span><strong style={{display:"block",fontSize:28,marginTop:6}}>{money(contribution)}</strong><span className="small muted">{blendedMargin.toFixed(1)}% blended margin</span></div>
      <div className="card"><span className="small muted">Expected VA compensation</span><strong style={{display:"block",fontSize:28,marginTop:6}}>{money(expectedVa)}</strong><span className="small muted">Ongoing monthly model</span></div>
      <div className="card"><span className="small muted">Needs owner attention</span><strong style={{display:"block",fontSize:28,marginTop:6}}>{pending+needsSetup}</strong><span className="small muted">{pending} margin approval · {needsSetup} economics setup</span></div>
    </div>

    <section className="card" style={{marginBottom:24}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Collection & payout control</h2><p className="small muted" style={{margin:"5px 0 0"}}>These figures come from the existing VA-compensation ledger. They are not total agency revenue.</p></div><Link className="btn btn-sm" href="/workspace/admin/payments">Manage invoices & payouts</Link></div><div className="grid-3" style={{marginTop:16}}><div><span className="small muted">VA-comp billing awaiting collection</span><strong style={{display:"block",fontSize:22}}>{money(awaitingTotal)}</strong></div><div><span className="small muted">Overdue {overdueDays}+ days</span><strong style={{display:"block",fontSize:22}}>{money(overdueTotal)}</strong></div><div><span className="small muted">Collected, payout ready</span><strong style={{display:"block",fontSize:22}}>{money(payoutReadyTotal)}</strong></div></div></section>

    <section className="card"><div className="row-between wrap"><div><h2 style={{margin:0}}>Placement economics</h2><p className="small muted" style={{margin:"5px 0 0"}}>Minimum margin {minMargin.toFixed(1)}% · target {targetMargin.toFixed(1)}%. Low-margin work requires an explicit owner exception.</p></div><span className="badge">{rows.length} active placement{rows.length===1?"":"s"}</span></div>
      {rows.length?<div className="stack" style={{marginTop:16}}>{rows.map(({room,profile,result,awaiting,overdue,payoutReady,unreconciled})=><div className="review-answer" key={room.id}><div className="row-between wrap" style={{gap:16}}><div style={{minWidth:220}}><strong>{room.jobs?.title||"Managed placement"}</strong><p className="small muted" style={{margin:"4px 0"}}>{room.client?.full_name||"Client"} → {room.va?.full_name||"VA"}</p><div className="row wrap"><span className={`badge ${statusClass[result.status]||""}`}>{financeStatusLabel(result.status,result.marginPercent)}</span>{profile?.exception_status==="pending"?<span className="badge badge-danger">Approval pending</span>:null}{unreconciled?<span className="badge badge-warning">Reconcile</span>:null}</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(100px,1fr))",gap:18,minWidth:330}}><div><span className="small muted">MRR</span><strong style={{display:"block"}}>{profile?money(Number(profile.expected_monthly_client_revenue||0)):"Not set"}</strong></div><div><span className="small muted">Contribution</span><strong style={{display:"block"}}>{profile?money(result.contribution):"—"}</strong></div><div><span className="small muted">VA-comp ledger</span><strong style={{display:"block"}}>{overdue.length?`${overdue.length} overdue`:payoutReady.length?`${payoutReady.length} payout ready`:awaiting.length?`${awaiting.length} awaiting`:"Clear"}</strong></div></div><div><Link className="btn btn-primary btn-sm" href={`/workspace/admin/finance/${room.id}`}>{profile?"Review economics":"Set economics"}</Link></div></div></div>)}</div>:<div className="empty" style={{marginTop:16}}>No active placements yet.</div>}
    </section>
  </>;
}
