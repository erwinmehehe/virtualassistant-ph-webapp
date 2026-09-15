import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitExpandedScorecardAction } from "@/app/actions/recruiter-operations-system";
import { dateShort } from "@/lib/format";

const fields = [
  ["communication", "Communication"],
  ["english", "English"],
  ["professionalism", "Professionalism"],
  ["reliability", "Reliability"],
  ["role_skills", "Role expertise"],
  ["tool_fluency", "Tools"],
  ["problem_solving", "Problem solving"],
  ["client_readiness", "Client readiness"],
  ["schedule_reliability", "Schedule reliability"],
  ["work_setup", "Internet / work setup"]
] as const;

function Rating({name,label}:{name:string;label:string}) {
  return <div className="field"><label>{label}</label><select name={name} defaultValue="3" required><option value="1">1 - weak evidence</option><option value="2">2 - below standard</option><option value="3">3 - meets standard</option><option value="4">4 - strong</option><option value="5">5 - excellent</option></select></div>;
}

function screeningLabel(value?: string | null) {
  return ({client_ready:"Client Ready",needs_development:"Needs Development",role_specific:"Role-Specific Only",do_not_present:"Do Not Present"} as Record<string,string>)[value || ""] || value || "Legacy scorecard";
}

export default async function RecruiterScreeningPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}) {
  const {id}=await params; const query=await searchParams; await requireRole("recruiter"); const admin=createAdminClient();
  const [{data:profile},{data:va},{data:vetting},{data:scorecards},{data:intelligence}]=await Promise.all([
    admin.from("profiles").select("id,full_name,last_active_at").eq("id",id).eq("role","va").maybeSingle(),
    admin.from("va_profiles").select("headline,primary_category,skills,tools,industries,years_experience,weekly_hours,schedule,overlap_hours,hourly_rate,availability_status").eq("user_id",id).maybeSingle(),
    admin.from("va_vetting").select("stage,recruiter_interview_at,recruiter_notes,video_url").eq("va_id",id).maybeSingle(),
    admin.from("vetting_scorecards").select("*").eq("va_id",id).order("created_at",{ascending:false}).limit(5),
    admin.rpc("recruiter_candidate_intelligence",{p_va_id:id})
  ]);
  if(!profile)notFound();
  const intel=(intelligence||{}) as any;
  return <>
    {query.saved?<div className="success-banner">Expanded recruiter scorecard saved.</div>:null}
    <div className="page-head"><div><Link className="text-link small" href={`/workspace/recruiter/candidates/${id}`}>← Candidate profile</Link><div className="row wrap" style={{marginTop:8}}><span className="badge"><ShieldCheck size={13}/> Internal screening</span><span className="badge">{vetting?.stage||"profile"}</span></div><h1 style={{marginTop:8}}>{profile.full_name||"VA candidate"}</h1><p>{va?.headline||va?.primary_category||"Virtual Assistant"}</p></div></div>

    <div className="grid-2">
      <section className="card stack">
        <div><div className="row"><Sparkles size={18}/><h2 style={{margin:0}}>Standard recruiter scorecard</h2></div><p className="small muted">Use the same ten factors for every VA. Scores stay internal; clients only see qualitative fit labels and recruiter recommendations.</p></div>
        <form action={submitExpandedScorecardAction} className="stack"><input type="hidden" name="va_id" value={id}/><div className="form-grid">{fields.map(([name,label])=><Rating key={name} name={name} label={label}/>)}</div><div className="field"><label>Screening result</label><select name="screening_result" defaultValue="needs_development" required><option value="client_ready">Client Ready</option><option value="role_specific">Role-Specific Only</option><option value="needs_development">Needs Development</option><option value="do_not_present">Do Not Present</option></select><span className="small muted">This is a human recruiter decision. AI never changes this result automatically.</span></div><div className="field"><label>Recruiter evidence and notes</label><textarea name="notes" minLength={30} required placeholder="Evidence from profile, resume, interview, skills test, communication, schedule, setup, and any concerns that need verification."/></div><button className="btn btn-primary" type="submit">Save screening scorecard</button></form>
      </section>

      <div className="stack">
        <section className="card"><h2>Current evidence</h2><div className="score-grid"><div><span>Category</span><strong>{va?.primary_category||"Not set"}</strong></div><div><span>Experience</span><strong>{va?.years_experience??0} years</strong></div><div><span>Availability</span><strong>{va?.availability_status||"Not set"}</strong></div><div><span>Hours</span><strong>{va?.weekly_hours?`${va.weekly_hours}/week`:"Not set"}</strong></div><div><span>Rate</span><strong>{va?.hourly_rate?`USD ${va.hourly_rate}/hr`:"Not set"}</strong></div><div><span>Overlap</span><strong>{va?.overlap_hours!=null?`${va.overlap_hours} hrs/day`:"Not set"}</strong></div></div><div style={{marginTop:14}}><div className="small muted">Skills</div><p>{(va?.skills||[]).join(", ")||"No skills listed"}</p></div><div><div className="small muted">Tools</div><p>{(va?.tools||[]).join(", ")||"No tools listed"}</p></div></section>
        <section className="card"><h2>Candidate history</h2><div className="score-grid"><div><span>Presented</span><strong>{intel.presented||0}</strong></div><div><span>Interviews</span><strong>{intel.interviews||0}</strong></div><div><span>Passes</span><strong>{intel.passes||0}</strong></div><div><span>Offers</span><strong>{intel.offers||0}</strong></div><div><span>Placements</span><strong>{intel.placements||0}</strong></div></div>{Array.isArray(intel.pass_reasons)&&intel.pass_reasons.length?<div style={{marginTop:14}}><strong>Common pass reasons</strong><div className="stack" style={{marginTop:8}}>{intel.pass_reasons.map((row:any,index:number)=><div className="row-between" key={`${row.reason}-${index}`}><span>{row.reason}</span><span className="badge">{row.count}</span></div>)}</div></div>:<p className="small muted">No client pass history yet.</p>}</section>
        <section className="card"><h2>Previous scorecards</h2>{scorecards?.length?<div className="stack">{scorecards.map((row:any)=><div className="review-answer" key={row.id}><div className="row-between"><strong>{row.total_score}% · {screeningLabel(row.screening_result)}</strong><span className="small muted">{dateShort(row.created_at)}</span></div>{row.notes?<p className="small muted">{row.notes}</p>:null}</div>)}</div>:<p className="small muted">No scorecard history yet.</p>}</section>
      </div>
    </div>
  </>;
}
