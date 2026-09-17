import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInvoiceAction, releasePayoutAction, resolveDisputeReleaseAction, resolveDisputeRefundAction } from "@/app/actions/payments";
import { createApprovedTimeInvoiceAction } from "@/app/actions/approved-time-invoice";
import { money, dateShort } from "@/lib/format";

type PaymentWorkroomRow = { id: string; job_id: string; client_id: string | null; va_id: string | null; agreed_hourly_rate: number | null; jobs: { title: string | null; min_hourly_rate: number | null } | null; client: { full_name: string | null } | null; va: { full_name: string | null } | null };
type ApprovedTimeRow = { id: string; workroom_id: string; work_date: string; hours: number | string; status: string; payment_id: string | null };
type AdminPaymentRow = { id: string; description: string | null; amount_total: number; currency: string | null; status: string; paid_at: string | null; released_at: string | null; created_at: string; client_id: string | null; va_id: string | null; workroom_id: string | null; dispute_reason: string | null; dispute_resolution: string | null; provider_payment_id: string | null; release_note: string | null; profiles_client: { full_name: string | null } | null; profiles_va: { full_name: string | null } | null };
import { isPaymongoConfigured } from "@/lib/paymongo";

const statusLabel:Record<string,string>={draft:"Draft",awaiting_payment:"Awaiting client payment",paid:"Paid, ready to release",disputed:"Disputed, payout frozen",release_pending:"Release pending",released:"Released to VA",failed:"Payment failed",refunded:"Refunded",void:"Void"};

export default async function AdminPaymentsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  await requireRole("admin");
  const admin=createAdminClient();
  const [{data:paymentData},{data:workroomData},{data:timeEntryData}]=await Promise.all([
    admin.from("payments").select("id,description,amount_total,currency,status,paid_at,released_at,created_at,client_id,va_id,workroom_id,dispute_reason,dispute_resolution,provider_payment_id,release_note,profiles_client:profiles!payments_client_id_fkey(full_name),profiles_va:profiles!payments_va_id_fkey(full_name)").order("created_at",{ascending:false}).limit(100),
    admin.from("workrooms").select("id,job_id,client_id,va_id,agreed_hourly_rate,jobs(title,min_hourly_rate),client:profiles!workrooms_client_id_fkey(full_name),va:profiles!workrooms_va_id_fkey(full_name)").eq("status","active").order("created_at",{ascending:false}).limit(50),
    admin.from("time_entries").select("id,workroom_id,work_date,hours,status,payment_id").eq("status","approved").is("payment_id",null).order("work_date",{ascending:true})
  ]);
  const paymongoConfigured=isPaymongoConfigured();
  const payments=(paymentData||[]) as unknown as AdminPaymentRow[];
  const workrooms=(workroomData||[]) as unknown as PaymentWorkroomRow[];
  const timeByRoom=new Map<string,ApprovedTimeRow[]>();
  for(const entry of (timeEntryData||[]) as ApprovedTimeRow[]){const current=timeByRoom.get(entry.workroom_id)||[];current.push(entry);timeByRoom.set(entry.workroom_id,current);}
  const ready=workrooms.map((room)=>{const entries=timeByRoom.get(room.id)||[];const hours=entries.reduce((sum,row)=>sum+Number(row.hours||0),0);const rate=Number(room.agreed_hourly_rate||room.jobs?.min_hourly_rate||0);return{room,entries,hours,rate,amount:hours*rate};}).filter((row)=>row.hours>0&&row.rate>0);

  return <>
    {params.time_invoice?<div className="success-banner">Invoice created from approved, uninvoiced VA time.</div>:null}
    <div className="page-head"><div><div className="kicker">Finance · invoices & payouts</div><h1>Payments</h1><p>Bill approved work, collect client payment, release VA compensation, and resolve disputes from the Finance OS.</p></div><Link className="btn" href="/workspace/admin/finance">Back to Finance</Link></div>
    {!paymongoConfigured?<div className="alert" style={{marginBottom:20}}>PayMongo is not configured yet (<code>PAYMONGO_SECRET_KEY</code> is empty). Invoices can be created, but clients cannot pay until it is configured.</div>:null}

    <section className="card" style={{marginBottom:24}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Approved work ready to invoice</h2><p className="small muted">The system calculates approved, uninvoiced hours × the confirmed workroom rate. Admin still confirms before the invoice is created.</p></div><span className={`badge ${ready.length?"badge-warning":"badge-success"}`}>{ready.length} ready</span></div>
      {ready.length?<div className="stack" style={{marginTop:16}}>{ready.map(({room,entries,hours,rate,amount})=>{const first=entries[0]?.work_date;const last=entries[entries.length-1]?.work_date;const description=`Approved VA time${first?` · ${first}${last&&last!==first?` to ${last}`:""}`:""}`;return <div className="review-answer" key={room.id}><div className="row-between wrap"><div><strong>{room.jobs?.title||"Active placement"}</strong><p className="small muted" style={{margin:"4px 0"}}>{room.client?.full_name||"Client"} → {room.va?.full_name||"VA"}</p><span className="small muted">{hours.toFixed(2)} approved hrs × {money(rate)}/hr</span></div><div style={{textAlign:"right"}}><strong style={{fontSize:22}}>{money(amount)}</strong><form action={createApprovedTimeInvoiceAction} style={{marginTop:8}}><input type="hidden" name="workroom_id" value={room.id}/><input type="hidden" name="description" value={description}/><button className="btn btn-primary btn-sm" type="submit">Create calculated invoice</button></form></div></div></div>})}</div>:<div className="empty" style={{marginTop:14}}>No approved, uninvoiced time is waiting. This is the desired state.</div>}
    </section>

    <details className="card" style={{marginBottom:24}}><summary style={{cursor:"pointer"}}><strong>Manual adjustment invoice</strong> <span className="small muted">Use only when approved time is not the source of the charge.</span></summary><div style={{marginTop:16}}>{workrooms.length?<form action={createInvoiceAction} className="stack"><div className="field"><label>Workroom</label><select name="workroom_id" required>{workrooms.map((w)=><option key={w.id} value={w.id}>{w.jobs?.title||"Role"} — {w.client?.full_name||"Client"} / {w.va?.full_name||"VA"}</option>)}</select></div><div className="field"><label>Description</label><input name="description" required minLength={3} placeholder="Manual adjustment or non-time compensation"/></div><div className="field"><label>VA compensation amount, USD</label><input type="number" name="amount_total" min="0.01" step="0.01" required/><span className="small muted">Use the calculated approved-time flow above for normal hourly work.</span></div><button className="btn" type="submit">Create manual invoice</button></form>:<p className="muted">No active workrooms.</p>}</div></details>

    <div className="stack">{payments.length?payments.map((p)=>{const payout=Number(p.amount_total);return <div className="card" key={p.id}><div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${p.status==="released"?"badge-success":p.status==="paid"?"badge-warning":p.status==="disputed"?"badge-danger":""}`}>{statusLabel[p.status]||p.status}</span><span className="small muted">{dateShort(p.created_at)}</span></div><h3 style={{margin:"8px 0 3px"}}>{p.description}</h3><div className="small muted">{p.profiles_client?.full_name||"Client"} → {p.profiles_va?.full_name||"VA"}</div></div><div style={{textAlign:"right"}}><strong>{money(p.amount_total)}</strong><div className="small muted">VA payout: {money(payout)} · no platform deduction</div></div></div>
      {p.status==="paid"?<form action={releasePayoutAction} className="row wrap" style={{marginTop:12}}><input type="hidden" name="payment_id" value={p.id}/><input name="release_note" placeholder="GCash / Wise / bank reference" style={{flex:1,minWidth:220}}/><button className="btn btn-primary btn-sm" type="submit">Mark released to VA</button></form>:null}
      {p.status==="disputed"?<div style={{marginTop:12}}>{p.dispute_reason?<div className="alert" style={{marginBottom:10}}><strong>Client says:</strong> {p.dispute_reason}</div>:null}<div className="row wrap" style={{gap:16}}><form action={resolveDisputeReleaseAction} className="row wrap"><input type="hidden" name="payment_id" value={p.id}/><input name="resolution_note" placeholder="Resolution note"/><button className="btn btn-primary btn-sm" type="submit">Release after review</button></form><form action={resolveDisputeRefundAction} className="row wrap"><input type="hidden" name="payment_id" value={p.id}/><input name="resolution_note" placeholder="Refund note"/><button className="btn btn-sm" type="submit" disabled={!p.provider_payment_id}>Refund client</button></form></div></div>:null}
      {p.status==="released"&&p.release_note?<div className="small muted" style={{marginTop:8}}>Payout reference: {p.release_note}</div>:null}{p.dispute_resolution?<div className="small muted" style={{marginTop:8}}>Dispute resolution: {p.dispute_resolution}</div>:null}
    </div>}):<div className="card empty">No invoices yet.</div>}</div>
  </>;
}
