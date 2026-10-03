import Link from "next/link";
import { CheckCircle2, ClipboardCheck, Clock3, MessageCircle, Plus, Sparkles } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createTaskAction, reviewTimeEntryAction, updateTaskStatusAction } from "@/app/actions/workroom";
import { toggleOwnedChecklistAction } from "@/app/actions/workroom-checklist";
import { money } from "@/lib/format";
import { PlacementReviewPanel } from "@/components/placement-review-panel";
import type { PlacementReview } from "@/lib/reviews";
import type { TimeEntryRow, WorkroomChecklistRow, WorkroomRow, WorkroomTaskRow } from "@/lib/workspace-rows";

type ClientWorkroom = WorkroomRow & {
  jobs: { title: string | null; hours_per_week: number | null; min_hourly_rate: number | null; timezone: string | null; overlap_hours: number | null; onboarding_plan: string | null; engagement_length: string | null } | null;
  applications: { profile_snapshot: { full_name?: string | null } | null } | null;
};

function timeStatus(status:string){return status==="approved"?"Approved":status==="changes_requested"?"Changes requested":"Pending review";}
function taskStatus(status:string){return status==="done"?"Done":status==="review"?"Ready for review":status==="in_progress"?"In progress":"To do";}
function taskTone(status:string){return status==="done"?"badge-success":status==="review"?"badge-warning":"";}

export default async function ClientWorkroomPage(){
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const {data:roomData}=await supabase.from("workrooms").select("*,jobs(title,hours_per_week,min_hourly_rate,timezone,overlap_hours,onboarding_plan,engagement_length),applications(profile_snapshot)").eq("client_id",user.id).order("created_at",{ascending:false});
  const rooms=(roomData||[]) as ClientWorkroom[];
  const ids=rooms.map((r)=>r.id);
  let tasks:WorkroomTaskRow[]=[];let checks:WorkroomChecklistRow[]=[];let time:TimeEntryRow[]=[];let reviews:PlacementReview[]=[];let publicVas:{user_id:string;slug:string|null}[]=[];
  if(ids.length){
    const vaIds=rooms.map((r)=>r.va_id);
    const results=await Promise.all([
      supabase.from("workroom_tasks").select("*").in("workroom_id",ids).order("created_at"),
      supabase.from("workroom_checklist").select("*").in("workroom_id",ids).order("sort_order"),
      supabase.from("time_entries").select("*").in("workroom_id",ids).order("work_date",{ascending:false}),
      supabase.from("reviews").select("*").in("workroom_id",ids),
      supabase.from("public_va_directory").select("user_id,slug").in("user_id",vaIds)
    ]);
    tasks=results[0].data||[];
    checks=results[1].data||[];
    time=results[2].data||[];
    reviews=results[3].data||[];
    publicVas=results[4].data||[];
  }
  const publicVaIds=new Set(publicVas.map((v)=>v.user_id));

  return <div className="client-workroom-page">
    <div className="page-head client-workroom-head">
      <div><div className="kicker">Active placements</div><h1>Workroom</h1><p>See what needs your attention, assign outcomes, approve completed work and review submitted time.</p></div>
    </div>

    {rooms.length?<div className="stack client-workroom-list">{rooms.map((r)=>{
      const roomTasks=tasks.filter((t)=>t.workroom_id===r.id);
      const allChecks=checks.filter((c)=>c.workroom_id===r.id);
      const clientChecks=allChecks.filter((c)=>c.owner_role==="client");
      const vaChecks=allChecks.filter((c)=>c.owner_role==="va");
      const roomTime=time.filter((t)=>t.workroom_id===r.id);
      const total=roomTime.reduce((sum,t)=>sum+Number(t.hours||0),0);
      const approvedHours=roomTime.filter((t)=>t.status==="approved").reduce((sum,t)=>sum+Number(t.hours||0),0);
      const pendingChecks=clientChecks.filter((c)=>!c.completed_at);
      const pendingTime=roomTime.filter((t)=>t.status==="pending");
      const reviewTasks=roomTasks.filter((t)=>t.status==="review");
      const attentionCount=pendingChecks.length+pendingTime.length+reviewTasks.length;
      const vaName=r.applications?.profile_snapshot?.full_name||"Virtual Assistant";

      return <article className="client-workroom-card" key={r.id}>
        <header className="client-workroom-summary">
          <div>
            <div className="row wrap"><span className="badge badge-success">{r.status}</span><span className="small muted">Working with {vaName}</span></div>
            <h2>{r.jobs?.title||"Active placement"}</h2>
            <p>{r.jobs?.hours_per_week?`${r.jobs.hours_per_week} hrs/week`:"Flexible hours"} · {money(r.agreed_hourly_rate||r.jobs?.min_hourly_rate)}/hr</p>
          </div>
          <Link className="btn client-workroom-support" href="/workspace/client/messages"><MessageCircle size={15}/> Message recruiter</Link>
        </header>

        <section className={`client-workroom-attention ${attentionCount?"needs-attention":"all-clear"}`}>
          <div className="client-workroom-attention-icon">{attentionCount?<Sparkles size={20}/>:<CheckCircle2 size={20}/>}</div>
          <div>
            <span className="small">{attentionCount?"Needs your attention":"You’re caught up"}</span>
            <h3>{attentionCount?`${attentionCount} action${attentionCount===1?"":"s"} waiting`:"Nothing requires a decision right now"}</h3>
            <p>{attentionCount?"Handle only the items that belong to you. The VA manages execution until work is submitted for review.":"You can assign new work or message your recruiter if priorities change."}</p>
          </div>
          {attentionCount?<div className="client-workroom-attention-links">
            {reviewTasks.length?<a className="btn btn-sm btn-primary" href={`#tasks-${r.id}`}><ClipboardCheck size={14}/>{reviewTasks.length} task{reviewTasks.length===1?"":"s"} to review</a>:null}
            {pendingTime.length?<a className="btn btn-sm" href={`#time-${r.id}`}><Clock3 size={14}/>{pendingTime.length} time entr{pendingTime.length===1?"y":"ies"}</a>:null}
            {pendingChecks.length?<a className="btn btn-sm" href={`#onboarding-${r.id}`}>{pendingChecks.length} setup item{pendingChecks.length===1?"":"s"}</a>:null}
          </div>:null}
        </section>

        <div className="client-workroom-overview">
          <section className="client-workroom-terms">
            <div className="client-workroom-section-head"><div><span className="small muted">Placement terms</span><h3>Confirmed setup</h3></div></div>
            <div className="client-workroom-term-grid">
              <div><span>Rate</span><strong>{money(r.agreed_hourly_rate||r.jobs?.min_hourly_rate)}/hr</strong></div>
              <div><span>Start</span><strong>{r.start_date||"Not recorded"}</strong></div>
              <div><span>Schedule</span><strong>{r.agreed_schedule||"Not recorded"}</strong></div>
            </div>
          </section>
          <section className="client-workroom-stats" aria-label="Placement time summary">
            <div><span>Expected</span><strong>{r.jobs?.hours_per_week?`${r.jobs.hours_per_week}/week`:"Flexible"}</strong></div>
            <div><span>Approved</span><strong>{approvedHours.toFixed(2)} hrs</strong></div>
            <div><span>Submitted</span><strong>{total.toFixed(2)} hrs</strong></div>
          </section>
        </div>

        <div className="client-workroom-main-grid">
          <section className="card client-workroom-onboarding" id={`onboarding-${r.id}`}>
            <div className="client-workroom-section-head"><div><h3>Your setup actions</h3><p>Only complete client-owned onboarding items here.</p></div><span className="badge">{clientChecks.filter((c)=>c.completed_at).length}/{clientChecks.length} complete</span></div>
            <div className="checklist">{clientChecks.length?clientChecks.map((c)=><form action={toggleOwnedChecklistAction} className="check-item" key={c.id}>
              <div className={`check-icon ${c.completed_at?"done":""}`}>{c.completed_at?"✓":""}</div>
              <div><strong className="small">{c.title}</strong></div>
              <input type="hidden" name="checklist_id" value={c.id}/>
              <input type="hidden" name="done" value={c.completed_at?"1":"0"}/>
              <button className="btn btn-sm" type="submit">{c.completed_at?"Reopen":"Complete"}</button>
            </form>):<div className="small muted">No client setup actions are waiting.</div>}</div>
            {vaChecks.length?<div className="client-workroom-va-progress"><strong>VA setup: {vaChecks.filter((c)=>c.completed_at).length}/{vaChecks.length}</strong><span>You can see progress, but the VA owns these items.</span></div>:null}
            {r.jobs?.onboarding_plan?<p className="small muted client-workroom-plan"><strong>Plan:</strong> {r.jobs.onboarding_plan}</p>:null}
          </section>

          <section className="card client-workroom-tasks" id={`tasks-${r.id}`}>
            <div className="client-workroom-section-head">
              <div><h3>Assigned work</h3><p>The VA owns task progress. You accept work only after it is submitted for review.</p></div>
              <span className="badge">{roomTasks.filter((t)=>t.status==="done").length}/{roomTasks.length} done</span>
            </div>

            <details className="client-workroom-assign">
              <summary className="btn btn-sm"><Plus size={14}/> Assign a new task</summary>
              <form action={createTaskAction} className="stack client-workroom-task-form">
                <input type="hidden" name="workroom_id" value={r.id}/>
                <div className="field"><label>Task</label><input name="title" required placeholder="Prepare weekly lead report"/></div>
                <div className="field"><label>What does done look like?</label><textarea name="description" placeholder="Describe the outcome, required context and anything the VA should include."/></div>
                <div className="field"><label>Due date <span className="muted">(optional)</span></label><input type="date" name="due_date"/></div>
                <button className="btn btn-primary" type="submit">Assign task</button>
              </form>
            </details>

            {roomTasks.length?<div className="client-workroom-task-list">{roomTasks.map((t)=><div className="client-workroom-task-row" key={t.id}>
              <div className="client-workroom-task-copy"><strong>{t.title}</strong>{t.description?<p>{t.description}</p>:null}<span>Due {t.due_date||"anytime"}</span></div>
              <div className="client-workroom-task-status"><span className={`badge ${taskTone(t.status)}`}>{taskStatus(t.status)}</span>{t.status==="review"?<form action={updateTaskStatusAction}><input type="hidden" name="task_id" value={t.id}/><input type="hidden" name="status" value="done"/><button className="btn btn-sm btn-primary" type="submit">Accept as done</button></form>:null}</div>
            </div>)}</div>:<div className="empty client-workroom-task-empty">No assigned work yet. Add a task when you have a clear outcome for the VA.</div>}
          </section>
        </div>

        {roomTime.length?<section className="card client-workroom-time" id={`time-${r.id}`}>
          <div className="client-workroom-section-head"><div><h3>Time review</h3><p>Approve accurate entries or request a specific correction. Approved time becomes eligible for invoicing.</p></div>{pendingTime.length?<span className="badge badge-warning">{pendingTime.length} waiting</span>:<span className="badge badge-success">Up to date</span>}</div>
          <div className="client-workroom-time-list">{roomTime.slice(0,20).map((t)=><div className="client-workroom-time-row" key={t.id}>
            <div><strong>{Number(t.hours).toFixed(2)} hrs</strong><span>{t.work_date}</span></div>
            <p>{t.note||"No work note"}</p>
            <div><span className={`badge ${t.status==="approved"?"badge-success":t.status==="changes_requested"?"badge-warning":""}`}>{timeStatus(t.status)}</span>{t.client_note?<small>{t.client_note}</small>:null}</div>
            <div>{t.status==="approved"?<span className="small muted">Approved</span>:t.status==="changes_requested"?<span className="small muted">Waiting for VA correction</span>:<details className="time-review client-workroom-time-review"><summary className="btn btn-sm">Review</summary><form action={reviewTimeEntryAction} className="stack time-review-panel client-workroom-time-review-panel"><input type="hidden" name="time_entry_id" value={t.id}/><div className="field"><label>Correction note</label><textarea name="client_note" maxLength={500} placeholder="Required only when requesting changes"/></div><div className="row wrap"><button className="btn btn-sm btn-primary" name="decision" value="approve">Approve</button><button className="btn btn-sm" name="decision" value="changes">Request changes</button></div></form></details>}</div>
          </div>)}</div>
        </section>:null}

        <PlacementReviewPanel workroomId={r.id} viewerRole="client" counterpartyLabel={vaName} ownReview={reviews.find((review)=>review.workroom_id===r.id&&review.reviewer_id===user.id)||null} receivedReview={reviews.find((review)=>review.workroom_id===r.id&&review.reviewer_id===r.va_id)||null} vaProfileIsPublic={publicVaIds.has(r.va_id||"")}/>
      </article>;
    })}</div>:<div className="card empty client-workroom-empty">No active placements yet. A workroom opens after final terms are accepted by the VA and confirmed by you.</div>}
  </div>;
}
