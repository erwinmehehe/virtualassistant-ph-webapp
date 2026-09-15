import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmPlacementOfferAction } from "@/app/actions/recruiter-operations-system";

export default async function ClientOffersPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const query=await searchParams;const {user}=await requireRole("client");const admin=createAdminClient();
  const {data:offers,error}=await admin.from("placement_offers").select("*").eq("client_id",user.id).order("created_at",{ascending:false}).limit(100);if(error)throw error;
  const jobIds=[...new Set((offers||[]).map((row:any)=>row.job_id))];const vaIds=[...new Set((offers||[]).map((row:any)=>row.va_id))];
  const [{data:jobs},{data:profiles}]=await Promise.all([
    jobIds.length?admin.from("jobs").select("id,title,company_name").in("id",jobIds):Promise.resolve({data:[]} as any),
    vaIds.length?admin.from("profiles").select("id,full_name").in("id",vaIds):Promise.resolve({data:[]} as any)
  ]);
  const jobMap=new Map((jobs||[]).map((row:any)=>[row.id,row]));const nameMap=new Map((profiles||[]).map((row:any)=>[row.id,row.full_name||"VA candidate"]));
  return <>
    {query.confirmed?<div className="success-banner">Placement confirmed. The VA is hired and the onboarding workroom is active.</div>:null}
    <div className="page-head"><div><div className="kicker">Final hiring step</div><h1>Placement offers</h1><p>Review recruiter-prepared final terms. The VA accepts first, then you confirm the placement.</p></div><Link className="btn" href="/workspace/client/candidates">Candidates</Link></div>
    <div className="stack">{offers?.length?offers.map((offer:any)=>{const job:any=jobMap.get(offer.job_id)||{};const candidate=nameMap.get(offer.va_id)||"VA candidate";return <section className="card" key={offer.id}><div className="row-between wrap"><div><div className="row wrap"><span className={`badge ${offer.status==="accepted"?"badge-success":""}`}>{String(offer.status).replaceAll("_"," ")}</span></div><h2 style={{margin:"8px 0 4px"}}>{candidate}</h2><p className="small muted">{job.title||"Client role"}{job.company_name?` · ${job.company_name}`:""}</p></div>{offer.status==="accepted"?<CheckCircle2 size={22}/>:<Clock3 size={22}/>}</div><div className="score-grid" style={{marginTop:14}}><div><span>Rate</span><strong>USD {Number(offer.hourly_rate).toFixed(2)}/hr</strong></div><div><span>Hours</span><strong>{offer.weekly_hours}/week</strong></div><div><span>Start</span><strong>{offer.start_date}</strong></div><div><span>Timezone</span><strong>{offer.timezone||"As agreed"}</strong></div><div className="span-2"><span>Schedule</span><strong>{offer.schedule}</strong></div></div>{offer.notes?<div className="review-answer" style={{marginTop:14}}><strong>Recruiter note</strong><p>{offer.notes}</p></div>:null}{offer.status==="pending_va"?<div className="alert" style={{marginTop:14}}>Waiting for the VA to accept these final terms.</div>:null}{offer.status==="pending_client"?<form action={confirmPlacementOfferAction} style={{marginTop:16}}><input type="hidden" name="offer_id" value={offer.id}/><label className="choice"><input type="checkbox" required/><span><strong>I confirm the final rate, schedule, hours, and start date.</strong><small>Confirming marks the candidate hired and activates onboarding.</small></span></label><button className="btn btn-primary" type="submit" style={{marginTop:10}}>Confirm placement</button></form>:null}{offer.status==="accepted"?<div className="success-banner" style={{marginTop:14}}>Placement active. <Link className="text-link" href="/workspace/client/workroom">Open workroom</Link>.</div>:null}</section>}):<div className="empty">No placement offers yet.</div>}</div>
  </>;
}
