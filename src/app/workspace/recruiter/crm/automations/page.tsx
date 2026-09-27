import Link from "next/link";
import { Bot, PlayCircle, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LEAD_CRM_STAGES } from "@/lib/lead-crm";
import { createCrmWorkflowAction, deleteCrmWorkflowAction, toggleCrmWorkflowAction } from "@/app/actions/crm";
import styles from "../crm.module.css";

type Workflow = {
  id:string;
  name:string;
  trigger_stage:string;
  action_type:string;
  action_config:Record<string,unknown>|null;
  is_enabled:boolean;
  created_at:string;
};

function actionLabel(workflow:Workflow) {
  const config=workflow.action_config||{};
  if(workflow.action_type==="create_task") {
    return `Create task · ${String(config.title||"Follow up")} · +${Number(config.due_days||0)}d · ${String(config.priority||"normal")}`;
  }
  return `Set follow-up · +${Number(config.days||0)}d`;
}

export default async function CrmAutomationsPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  await requireRoleFast("recruiter");
  const params=await searchParams;
  const {data,error}=await createAdminClient()
    .from("crm_workflows")
    .select("id,name,trigger_stage,action_type,action_config,is_enabled,created_at")
    .order("created_at",{ascending:false});
  if(error) throw error;
  const workflows=(data||[]) as Workflow[];

  return <div className={styles.page}>
    {params.workflow_saved ? <div className="success-banner">Automation created.</div> : null}
    {params.workflow_error ? <div className="alert" role="alert">{params.workflow_error}</div> : null}

    <header className={styles.header}>
      <div>
        <div className={styles.kicker}>CRM automation</div>
        <h1>Workflows</h1>
        <p>Turn stage changes into operational follow-through without adding another external CRM.</p>
      </div>
      <div className={styles.headerActions}>
        <Link className={styles.primaryButton} href="/workspace/recruiter/crm">Back to CRM</Link>
      </div>
    </header>

    <nav className={styles.objectBar} aria-label="CRM objects">
      <Link href="/workspace/recruiter/crm">Leads</Link>
      <Link href="/workspace/recruiter/crm/companies">Companies</Link>
      <Link href="/workspace/recruiter/crm/contacts">Contacts</Link>
      <Link className={styles.objectActive} href="/workspace/recruiter/crm/automations"><Bot size={15}/> Automations</Link>
      <Link href="/workspace/recruiter/crm/import">Import / export</Link>
    </nav>

    <div className={styles.detailGrid} style={{marginTop:12}}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><h2>Active workflows</h2><span className={styles.muted}>{workflows.filter(item=>item.is_enabled).length} enabled</span></div>
        <div className={styles.panelBody}>
          {workflows.length ? <div className={styles.timeline}>{workflows.map(workflow=><div className={styles.timelineItem} key={workflow.id}>
            <span className={styles.timelineDot}/>
            <div>
              <strong>{workflow.name}</strong>
              <p>When stage becomes <b>{LEAD_CRM_STAGES.find(item=>item.value===workflow.trigger_stage)?.label||workflow.trigger_stage}</b> → {actionLabel(workflow)}</p>
              <div className={styles.headerActions} style={{marginTop:8}}>
                <form action={toggleCrmWorkflowAction}>
                  <input type="hidden" name="workflow_id" value={workflow.id}/>
                  <input type="hidden" name="enabled" value={workflow.is_enabled?"false":"true"}/>
                  <button className={styles.secondaryButton} type="submit">
                    {workflow.is_enabled?<><ToggleRight size={14}/> Disable</>:<><ToggleLeft size={14}/> Enable</>}
                  </button>
                </form>
                <form action={deleteCrmWorkflowAction}>
                  <input type="hidden" name="workflow_id" value={workflow.id}/>
                  <button className={styles.secondaryButton} type="submit"><Trash2 size={14}/> Delete</button>
                </form>
              </div>
            </div>
          </div>)}</div> : <div className={styles.empty}>No CRM automations yet. Create the first one on the right.</div>}
        </div>
      </section>

      <aside className={styles.panel}>
        <div className={styles.panelHead}><h2>Create automation</h2><PlayCircle size={15}/></div>
        <div className={styles.panelBody}>
          <form action={createCrmWorkflowAction} className={styles.form}>
            <input type="hidden" name="return_to" value="/workspace/recruiter/crm/automations"/>
            <label>Name<input name="name" required minLength={3} placeholder="Qualified lead follow-up"/></label>
            <label>Trigger stage<select name="trigger_stage" defaultValue="qualified">{LEAD_CRM_STAGES.filter(stage=>stage.value!=="shortlist_sent").map(stage=><option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></label>
            <label>Action<select name="action_type" defaultValue="create_task"><option value="create_task">Create recruiter task</option><option value="set_follow_up">Set next follow-up</option></select></label>
            <label>Days after trigger<input type="number" name="days" min="0" max="30" defaultValue="2"/></label>
            <label>Task title<input name="task_title" defaultValue="Follow up with {{company}}" placeholder="Supports {{company}} and {{name}}"/></label>
            <label>Task priority<select name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <button type="submit"><Bot size={14}/> Create workflow</button>
          </form>
          <p className={styles.muted} style={{fontSize:11,lineHeight:1.5,marginTop:10}}>Automations run only when a lead actually changes stage, so saving the same stage again will not create duplicate tasks.</p>
        </div>
      </aside>
    </div>
  </div>;
}
