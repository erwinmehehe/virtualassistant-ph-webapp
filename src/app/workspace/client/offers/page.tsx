import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { JobSummaryRow } from "@/lib/workspace-rows";

type ClientOfferRow = { id: string; job_id: string; va_id: string; status: string; hourly_rate: number | null; weekly_hours: number | null; schedule: string | null; timezone: string | null; start_date: string | null; notes: string | null };
import { confirmPlacementOfferAction } from "@/app/actions/recruiter-operations-system";
import { clientFacingVaName, offerRevealsIdentity } from "@/lib/va-identity";

export default async function ClientOffersPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;const {userId}=await requireRoleFast("client");const admin=createAdminClient();
  const {data:offerData,error}=await admin.from("placement_offers").select("*").eq("client_id",userId).order("created_at",{ascending:false}).limit(100);if(error)throw error;
  const offers=(offerData||[]) as ClientOfferRow[];
  const jobIds=[...new Set(offers.map((row)=>row.job_id))];const vaIds=[...new Set(offers.map((row)=>row.va_id))];
  const [{data:jobs},{data:profiles}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title,company_name").in("id",jobIds):Promise.resolve({data:[]}),
    vaIds.length?admin.from("profiles").select("id,full_name").in("id",vaIds):Promise.resolve({data:[]})
  ]);
  const jobMap=new Map(((jobs||[]) as JobSummaryRow[]).map((row)=>[row.id,row]));const nameMap=new Map(((profiles||[]) as {id:string;full_name:string|null}[]).map((row)=>[row.id,row.full_name||"VA candidate"]));
  return <div className="client-offers-page">
    {query.confirmed?<div className="success-banner">Placement confirmed. The VA is hired and the onboarding workroom is active.</div>:null}
    <div className="page-head client-offers-head"><div><div className="kicker">Final hiring step</div><h1>Placement offers</h1><p>Review recruiter-prepared final terms. The VA accepts first, then you confirm the placement.</p></div><Link className="btn client-offers-back" href="/workspace/client/candidates">Candidates</Link></div>
    <div className="stack client-offers-list">{offers.length?offers.map((offer)=>{const job:Partial<JobSummaryRow>=jobMap.get(offer.job_id)||{};const candidate=clientFacingVaName(nameMap.get(offer.va_id),offerRevealsIdentity(offer.status));return <section className="card client-offer-card" key={offer.id}><div className="row-between wrap client-offer-summary"><div><div className="row wrap"><span className={`badge ${offer.status==="accepted"?"badge-success":""}`}>{String(offer.status).replaceAll("_"," ")}</span></div><h2 style={{margin:"8px 0 4px"}}>{candidate}</h2><p className="small muted">{job.title||"Client role"}{job.company_name?` · ${job.company_name}`:""}</p></div>{offer.status==="accepted"?<CheckCircle2 size={22}/>:<Clock3 size={22}/>}</div><div className="score-grid client-offer-terms" style={{marginTop:14}}><div><span>Rate</span><strong>USD {Number(offer.hourly_rate).toFixed(2)}/hr</strong></div><div><span>Hours</span><strong>{offer.weekly_hours}/week</strong></div><div><span>Start</span><strong>{offer.start_date}</strong></div><div><span>Timezone</span><strong>{offer.timezone||"As agreed"}</strong></div><div className="span-2"><span>Schedule</span><strong>{offer.schedule}</strong></div></div>{offer.notes?<div className="review-answer client-offer-note" style={{marginTop:14}}><strong>Recruiter note</strong><p>{offer.notes}</p></div>:null}{offer.status==="pending_va"?<div className="alert client-offer-waiting" style={{marginTop:14}}>Waiting for the VA to accept these final terms.</div>:null}{offer.status==="pending_client"?<form action={confirmPlacementOfferAction} className="client-offer-confirm" style={{marginTop:16}}><input type="hidden" name="offer_id" value={offer.id}/><label className="choice"><input type="checkbox" required/><span><strong>I confirm the final rate, schedule, hours, and start date.</strong><small>Confirming marks the candidate hired and activates onboarding.</small></span></label><button className="btn btn-primary" type="submit" style={{marginTop:10}}>Confirm placement</button></form>:null}{offer.status==="accepted"?<div className="success-banner client-offer-active" style={{marginTop:14}}>Placement active. <Link className="text-link" href="/workspace/client/workroom">Open workroom</Link>.</div>:null}</section>}):<div className="empty">No placement offers yet.</div>}</div>
  </div>;
}
