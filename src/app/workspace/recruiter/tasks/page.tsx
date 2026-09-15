import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, ListTodo, Plus } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeRecruiterTaskAction, createRecruiterTaskAction, snoozeRecruiterTaskAction } from "@/app/actions/recruiter-ops";

function manilaLabel(value?:string|null){return value?new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Manila"}).format(new Date(value)):"No due time";}
function exactTaskHref(task:any){
  if(task.subject_type==="job"&&task.subject_id)return `/workspace/recruiter/matching/${task.subject_id}`;
  if(task.subject_type==="va"&&task.subject_id)return `/workspace/recruiter/candidates/${task.subject_id}`;
  return task.href||null;
}

export default async function RecruiterTasksPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {userId}=await requireRoleFast("recruiter");
  const admin=createAdminClient();
  const view=["mine","team","done"].includes(String(params.view))?String(params.view):"mine";
  const [{data:people},{data:taskRows,error}]=await Promise.all([
    admin.from("profiles").select("id,full_name,role").in("role",["recruiter","admin"]).eq("account_status","active").order("full_name"),
    (()=>{
      let query:any=admin.from("recruiter_tasks").select("*").order("due_at",{ascending:true,nullsFirst:false}).order("created_at",{ascending:false}).limit(100);
      if(view==="mine") query=query.eq("assignee_id",userId).eq("status","todo");
      if(view==="team") query=query.eq("status","todo");
      if(view==="done") query=query.eq("assignee_id",userId).eq("status","done");
      return query;
    })()
  ]);
  if(error)throw error;
  const peopleMap=new Map((people||[]).map((person:any)=>[person.id,person.full_name||person.role]));
  const rows=taskRows||[];
  const now=Date.now();

  return <div className="dash-page">
    {params.task_saved?<div className="success-banner">Task saved.</div>:null}
    {params.task_error?<div className="alert" role="alert">{params.task_error}</div>:null}
    <div className="dash-header"><div><div className="dash-kicker">Recruiter operations</div><h1>Tasks & Reminders</h1><p>Click a task to go straight to the exact client, role, candidate, interview, or offer that needs action.</p></div><Link className="btn" href="/workspace/recruiter/today"><ListTodo size={16}/> My Day</Link></div>

    <details className="card" open={!rows.length}>
      <summary className="row"><Plus size={16}/><strong>Create task</strong></summary>
      <form action={createRecruiterTaskAction} className="stack" style={{marginTop:16}}>
        <input type="hidden" name="return_to" value={`/workspace/recruiter/tasks?view=${view}`}/>
        <div className="grid-2">
          <div className="field"><label>Task</label><input name="title" required minLength={3} maxLength={180} placeholder="Call ACME about shortlist feedback"/></div>
          <div className="field"><label>Assign to</label><select name="assignee_id" defaultValue={userId}>{(people||[]).map((person:any)=><option value={person.id} key={person.id}>{person.full_name||person.role}</option>)}</select></div>
          <div className="field"><label>Due date & time <span className="muted">(Manila)</span></label><input type="datetime-local" name="due_at"/></div>
          <div className="field"><label>Priority</label><select name="priority" defaultValue="normal"><option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select></div>
          <div className="field"><label>Repeat</label><select name="repeat_rule" defaultValue="none"><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></div>
          <div className="field"><label>Linked page <span className="muted">(optional)</span></label><input name="href" placeholder="/workspace/recruiter/leads?view=attention"/></div>
        </div>
        <div className="field"><label>Notes</label><textarea name="description" maxLength={4000} placeholder="What needs to happen, what to check, or what the client is waiting for."/></div>
        <button className="btn btn-primary" type="submit">Save task</button>
      </form>
    </details>

    <div className="role-filter-tabs" aria-label="Task views">{[["mine","My tasks"],["team","Team tasks"],["done","Completed"]].map(([value,label])=><Link href={`/workspace/recruiter/tasks?view=${value}`} className={view===value?"active":""} key={value}>{label}</Link>)}</div>

    <div className="stack">
      {rows.length?rows.map((task:any)=>{
        const overdue=task.status==="todo"&&task.due_at&&new Date(task.due_at).getTime()<now;
        const own=task.assignee_id===userId;
        const actionHref=exactTaskHref(task);
        const content=<>
          <div className="row wrap"><strong>{task.title}</strong><span className={`badge ${task.priority==="urgent"||task.priority==="high"?"badge-warning":""}`}>{task.priority}</span>{overdue?<span className="badge badge-warning">Overdue</span>:null}{task.repeat_rule!=="none"?<span className="badge">Repeats {task.repeat_rule}</span>:null}{task.status==="done"?<span className="badge badge-success"><CheckCircle2 size={12}/> Done</span>:null}</div>
          {task.description?<p className="muted" style={{margin:"6px 0"}}>{task.description}</p>:null}
          <div className="small muted"><Clock3 size={12}/> {manilaLabel(task.due_at)} · Assigned to {peopleMap.get(task.assignee_id)||"Recruiter"}{actionHref?<> · Click to act <ArrowRight size={12}/></>:null}</div>
        </>;
        return <article className={`card ${overdue?"needs-attention":""}`} key={task.id}>
          <div className="row-between wrap" style={{gap:16}}>
            {actionHref?<Link href={actionHref} style={{display:"block",minWidth:0,flex:"1 1 520px",color:"inherit",textDecoration:"none"}}>{content}</Link>:<div style={{minWidth:0,flex:"1 1 520px"}}>{content}</div>}
            <div className="row wrap">
              {actionHref?<Link className="btn btn-sm btn-primary" href={actionHref}>Act now <ArrowRight size={13}/></Link>:null}
              {task.status==="todo"&&own?<form action={snoozeRecruiterTaskAction} className="row"><input type="hidden" name="task_id" value={task.id}/><select name="minutes" defaultValue="1440" aria-label="Snooze task"><option value="60">1 hour</option><option value="1440">1 day</option><option value="4320">3 days</option></select><button className="btn btn-sm" type="submit">Snooze</button></form>:null}
              {task.status==="todo"&&own?<form action={completeRecruiterTaskAction}><input type="hidden" name="task_id" value={task.id}/><input type="hidden" name="return_to" value={`/workspace/recruiter/tasks?view=${view}`}/><button className="btn btn-sm" type="submit">Done</button></form>:null}
            </div>
          </div>
        </article>;
      }):<div className="card empty">No tasks in this view.</div>}
    </div>
  </div>;
}
