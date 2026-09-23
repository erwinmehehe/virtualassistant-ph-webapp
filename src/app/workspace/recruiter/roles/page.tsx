import Link from "next/link";
import { AlertTriangle, BriefcaseBusiness, Clock3, Tags, UsersRound } from "lucide-react";
import { RecruiterViewPreference } from "@/components/recruiter-view-preference";
import { requireRoleFast } from "@/lib/auth";
import { elapsedLabel } from "@/lib/format";
import { publicationBlocker } from "@/lib/job-publication";
import { VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { autoCategorizeUncategorizedVasAction } from "@/app/actions/va-categories";
import { getRecruiterRolesSummary, type RecruiterRoleSummaryJob } from "@/lib/recruiter-roles-summary";

type RoleListRow = RecruiterRoleSummaryJob;

const ROLE_VIEWS = [
  ["active", "All active"],
  ["needs_details", "Needs role details"],
  ["needs_candidates", "Needs candidates"],
  ["waiting_client", "Waiting on client"],
  ["interviewing", "Interviewing"],
  ["intervention", "Needs intervention"],
  ["stale", "Stale 72h+"],
  ["replacement", "Needs replacements"],
  ["ready_offer", "Ready for offer"],
  ["history", "History"]
] as const;

const STAGES:Record<string,string>={intake:"Intake",ready_to_recruit:"Ready to Recruit",sourcing:"Sourcing",internal_review:"Internal Review",client_review:"Client Review",interviewing:"Interviewing",selected:"Selected",offer:"Offer",pre_start:"Pre-start",filled:"Filled",closed:"Closed"};
const SLA:Record<string,number>={intake:8,ready_to_recruit:2,sourcing:24,internal_review:24,client_review:48,interviewing:72,selected:2,offer:24,pre_start:72};
const age=(value?:string|null)=>elapsedLabel(value,{suffix:" in stage"});
function slaState(stage:string,entered?:string|null){const hours=SLA[stage];if(!hours||!entered)return null;const elapsed=(Date.now()-new Date(entered).getTime())/3600000;const left=hours-elapsed;return {late:left<0,label:left<0?`${Math.ceil(Math.abs(left))}h past target`:`${Math.ceil(left)}h to target`};}

export default async function RecruiterRolesPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("recruiter");
  const {data,error}=await getRecruiterRolesSummary(userId);
  if(error)throw error;
  const jobs=data.jobs;
  const talent=data.talent;
  const open=jobs.filter((j)=>!["filled","closed"].includes(j.hiring_stage));
  const history=jobs.filter((j)=>["filled","closed"].includes(j.hiring_stage));
  const requestedView=String(params.view||"active");
  const sort=String(params.sort||"urgent");
  const roleFlags=(job:RoleListRow)=>{
    const stageStarted=job.hiring_stage_entered_at?new Date(job.hiring_stage_entered_at).getTime():new Date(job.created_at).getTime();
    const cutoff=Date.now()-72*3600000;
    const stale=Date.now()-stageStarted>=72*3600000;
    const jobOldEnough=new Date(job.created_at).getTime()<=cutoff;
    const noCandidates=jobOldEnough&&job.active_shortlist_count===0&&job.active_interview_count===0&&job.active_offer_count===0;
    const clientOverdue=Boolean(job.oldest_unanswered_released_at&&new Date(job.oldest_unanswered_released_at).getTime()<=cutoff);
    const intervention=noCandidates||clientOverdue||job.interview_overdue||job.offer_overdue;
    const publication=publicationBlocker(job,{commercial_status:job.commercial_status});
    return {
      needs_details:publication.key==="needs_role_details",
      needs_candidates:["ready_to_recruit","sourcing","internal_review"].includes(job.hiring_stage)&&job.active_shortlist_count===0,
      waiting_client:job.unanswered_released_count>0,
      interviewing:job.hiring_stage==="interviewing"||job.active_interview_count>0,
      intervention,
      stale,
      replacement:job.released_count>0&&job.released_pass_count===job.released_count,
      ready_offer:job.hiring_stage==="selected"&&job.active_offer_count===0
    };
  };
  const viewCounts=new Map<string,number>([
    ["active",open.length],
    ["history",history.length],
    ...(["needs_details","needs_candidates","waiting_client","interviewing","intervention","stale","replacement","ready_offer"] as const).map((key)=>[key,open.filter((job)=>roleFlags(job)[key]).length] as [string,number])
  ]);
  const visibleJobs=requestedView==="history"?[...history]:requestedView==="active"?[...open]:open.filter((job)=>(roleFlags(job) as Record<string,boolean>)[requestedView]);
  visibleJobs.sort((a,b)=>{
    const aTime=new Date(a.hiring_stage_entered_at||a.created_at).getTime();
    const bTime=new Date(b.hiring_stage_entered_at||b.created_at).getTime();
    if(sort==="oldest")return aTime-bTime;
    if(sort==="newest")return bTime-aTime;
    if(sort==="start")return String(a.target_start_date||"9999").localeCompare(String(b.target_start_date||"9999"));
    if(sort==="stage")return String(a.hiring_stage).localeCompare(String(b.hiring_stage));
    const aSla=slaState(a.hiring_stage,a.hiring_stage_entered_at);
    const bSla=slaState(b.hiring_stage,b.hiring_stage_entered_at);
    return Number(Boolean(bSla?.late))-Number(Boolean(aSla?.late))||aTime-bTime;
  });
  const clientWaiting=viewCounts.get("waiting_client")||0;
  const interviewing=viewCounts.get("interviewing")||0;
  const recruiting=open.filter((j)=>["ready_to_recruit","sourcing","internal_review"].includes(j.hiring_stage)).length;
  const uncategorized=talent.uncategorized_count;
  const notStarted=talent.not_started_count;
  const supplyCounts=new Map<string,number>(Object.entries(talent.supply_by_category).map(([category,total])=>[category,Number(total)]));
  const demandCounts=new Map<string,number>();
  for(const job of open){for(const category of job.categories||[]){demandCounts.set(category,(demandCounts.get(category)||0)+1);}}
  const coverageRows=VA_CATEGORIES.map((category)=>{
    const supply=supplyCounts.get(category)||0;
    const demand=demandCounts.get(category)||0;
    const state=demand===0?"No open demand":supply===0?"No talent":supply<demand*3?"Thin coverage":"Healthy";
    return {category,supply,demand,state};
  }).sort((a,b)=>b.demand-a.demand||a.supply-b.supply||vaCategoryLabel(a.category).localeCompare(vaCategoryLabel(b.category)));

  return <>
    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}
    <RecruiterViewPreference storageKey="recruiter-role-view-v1" view={params.view} sort={params.sort} />
    {params.categorized != null ? <div className="success-banner" role="status">Auto-categorized {Number(params.categorized) || 0} VA profile{Number(params.categorized) === 1 ? "" : "s"}.{Number(params.skipped) ? ` ${Number(params.skipped)} still need manual review.` : ""}</div> : null}
    <div className="page-head"><div><div className="kicker">Recruitment operations</div><h1>Roles</h1><p>Manage every hiring pipeline, then check whether your active roles have enough matching talent supply.</p></div><div className="row wrap"><Link className="btn" href="#talent-coverage"><Tags size={15}/> Talent coverage</Link></div></div>
    <div className="grid-4">
      <Link prefetch={false} className="card" href="/workspace/recruiter/roles?view=needs_details&sort=urgent"><span className="small muted">Needs role details</span><strong style={{display:"block",fontSize:28}}>{viewCounts.get("needs_details")||0}</strong><span className="small muted">Incomplete briefs blocking a healthy workflow</span></Link>
      <Link prefetch={false} className="card" href="/workspace/recruiter/roles?view=waiting_client&sort=urgent"><span className="small muted">Waiting on client</span><strong style={{display:"block",fontSize:28}}>{clientWaiting}</strong><span className="small muted">Released candidates need a decision</span></Link>
      <Link prefetch={false} className="card" href="/workspace/recruiter/roles?view=intervention&sort=urgent"><span className="small muted">Needs intervention</span><strong style={{display:"block",fontSize:28}}>{viewCounts.get("intervention")||0}</strong><span className="small muted">Overdue candidate, client, interview, or offer work</span></Link>
      <Link prefetch={false} className="card" href="/workspace/recruiter/roles?view=needs_candidates&sort=urgent"><span className="small muted">Needs candidates</span><strong style={{display:"block",fontSize:28}}>{viewCounts.get("needs_candidates")||0}</strong><span className="small muted">Roles with no active shortlist</span></Link>
    </div>
    <p className="small muted" style={{margin:"10px 0 0"}}>{open.length} active roles · {recruiting} recruiting · {interviewing} interviewing</p>
    <section className="card" style={{marginTop:18}}><div className="row-between wrap"><div><h2 style={{margin:0}}>Hiring pipeline</h2><p className="small muted" style={{margin:"5px 0 0"}}>Use saved queues to jump straight to the roles that need recruiter action.</p></div><BriefcaseBusiness size={20}/></div>
      <div className="recruiter-role-viewbar">
        <div className="saved-view-list">
          {ROLE_VIEWS.map(([value,label])=><Link key={value} className={requestedView===value?"saved-view active":"saved-view"} href={`/workspace/recruiter/roles?view=${value}&sort=${sort}`}><span>{label}</span><strong>{viewCounts.get(value)||0}</strong></Link>)}
        </div>
        <form className="role-sort-form" method="get">
          <input type="hidden" name="view" value={requestedView}/>
          <label><span>Sort</span><select name="sort" defaultValue={sort}><option value="urgent">Urgent first</option><option value="oldest">Oldest unresolved</option><option value="newest">Newest</option><option value="start">Target start</option><option value="stage">Hiring stage</option></select></label>
          <button className="btn btn-sm" type="submit">Apply</button>
        </form>
      </div>
      {visibleJobs.length?<div className="stack" style={{marginTop:14}}>{visibleJobs.map((job)=>{const sla=slaState(job.hiring_stage,job.hiring_stage_entered_at);const publication=publicationBlocker(job,{commercial_status:job.commercial_status});return <Link prefetch={false} href={`/workspace/recruiter/roles/${job.id}`} className="card" key={job.id}><div className="row-between wrap"><div><div className="row wrap"><span className="badge">{STAGES[job.hiring_stage]||job.hiring_stage}</span><span className={`badge ${publication.key==="published"?"badge-success":publication.key==="waiting_client_approval"?"badge-warning":""}`}>{publication.label}</span>{sla?<span className={`badge ${sla.late?"badge-danger":""}`}><Clock3 size={12}/>{sla.label}</span>:null}</div><h3 style={{margin:"8px 0 3px"}}>{job.title}</h3><p className="small muted" style={{margin:0}}>{job.company_name||"Client"} · {age(job.hiring_stage_entered_at)}</p></div><strong>{publication.key==="needs_role_details"?"Complete role →":"Open control center →"}</strong></div><div className="row wrap" style={{marginTop:12}}><span className="small muted">{job.proposed_count} internal</span><span className="small muted">{job.released_count} client-visible</span><span className="small muted">{job.active_interview_count} interviews</span><span className="small muted">{job.active_offer_count} offers</span>{job.placement_created?<span className="badge badge-success">Placement created</span>:null}</div></Link>})}</div>:<div className="empty">{requestedView==="history"?"No filled or closed roles yet.":"No roles match this saved view."}</div>}
    </section>

    <section className="role-talent-coverage" id="talent-coverage">
      <div className="role-talent-coverage-head">
        <div><div className="kicker">Talent supply</div><h2>Talent coverage</h2><p>Categories now live where recruiters use them: beside role demand. Focus on specialties with open roles and thin VA supply.</p></div>
        <div className="row wrap"><form action={autoCategorizeUncategorizedVasAction}><button className="btn" type="submit" disabled={!uncategorized}>Auto-categorize {uncategorized || ""}</button></form><Link className="btn btn-primary" href="/workspace/recruiter/talent">Open Talent</Link></div>
      </div>
      <div className="role-coverage-summary">
        <div><UsersRound size={17}/><span><strong>{talent.active_count}</strong><small>Active VAs</small></span></div>
        <div><Tags size={17}/><span><strong>{uncategorized}</strong><small>Uncategorized</small></span></div>
        <div><AlertTriangle size={17}/><span><strong>{notStarted}</strong><small>Profiles not started</small></span></div>
        <div><BriefcaseBusiness size={17}/><span><strong>{open.length}</strong><small>Open roles</small></span></div>
      </div>
      <div className="role-coverage-table-wrap">
        <table className="role-coverage-table">
          <thead><tr><th>Specialty</th><th>Active VAs</th><th>Open roles</th><th>Coverage</th><th></th></tr></thead>
          <tbody>{coverageRows.map((row)=><tr key={row.category}>
            <td><strong>{vaCategoryLabel(row.category)}</strong><small>{row.category}</small></td>
            <td>{row.supply}</td>
            <td>{row.demand}</td>
            <td><span className={"coverage-state "+(row.state==="Healthy"?"healthy":row.state==="Thin coverage"?"thin":row.state==="No talent"?"risk":"quiet")}>{row.state}</span></td>
            <td><Link className="text-link" href={"/workspace/recruiter/talent?category="+encodeURIComponent(row.category)+"&sort=recent"}>{row.state==="No talent" ? `Source for ${row.demand} role${row.demand===1?"":"s"}` : row.state==="Thin coverage" ? "Review thin pool" : row.demand ? "Review matching pool" : "Browse specialty"}</Link></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="role-coverage-note"><span>Onboarding rescue is now handled in Talent, not in a separate Categories dashboard.</span><Link href="/workspace/recruiter/talent?view=all&sort=recent">Review all VA accounts →</Link></div>
    </section>
  </>;
}
