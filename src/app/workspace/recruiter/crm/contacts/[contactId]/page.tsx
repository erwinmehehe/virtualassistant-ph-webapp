import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, UserRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCrmCustomFieldAction, setCrmCustomValueAction, updateCrmContactAction } from "@/app/actions/crm";
import styles from "../../crm.module.css";

type Contact = {
  id:string;
  lead_id:string|null;
  client_id:string|null;
  company_id:string|null;
  full_name:string|null;
  email:string|null;
  phone:string|null;
  title:string|null;
  created_at:string;
  updated_at:string;
};

type Company={id:string;name:string};
type Lead={id:string;service:string|null;crm_stage:string|null;job_id:string|null;created_at:string};
type CustomField={id:string;label:string;field_type:string;options:unknown};
type CustomValue={field_id:string;value:unknown};
type EmailEvent={id:string;event_type:string;status:string;automation:string|null;created_at:string};
type Activity={id:string;action:string;description:string|null;created_at:string};

function fmt(value?:string|null,withTime=false){
  if(!value)return "—";
  return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",...(withTime?{timeStyle:"short" as const}:{}),timeZone:"Asia/Manila"}).format(new Date(value));
}

export default async function CrmContactDetailPage({params,searchParams}:{params:Promise<{contactId:string}>;searchParams:Promise<Record<string,string|undefined>>}) {
  await requireRoleFast("recruiter");
  const {contactId}=await params;
  const query=await searchParams;
  const admin=createAdminClient();

  const {data:contact,error}=await admin
    .from("crm_contacts")
    .select("id,lead_id,client_id,company_id,full_name,email,phone,title,created_at,updated_at")
    .eq("id",contactId)
    .maybeSingle();
  if(error)throw error;
  if(!contact)notFound();
  const row=contact as Contact;

  const [companyResult,leadResult,fieldsResult,valuesResult,emailResult,activityResult]=await Promise.all([
    row.company_id?admin.from("crm_companies").select("id,name").eq("id",row.company_id).maybeSingle():Promise.resolve({data:null,error:null}),
    row.lead_id?admin.from("lead_intake").select("id,service,crm_stage,job_id,created_at").eq("id",row.lead_id).maybeSingle():Promise.resolve({data:null,error:null}),
    admin.from("crm_custom_fields").select("id,label,field_type,options").eq("object_type","contact").order("created_at",{ascending:true}),
    admin.from("crm_custom_values").select("field_id,value").eq("object_type","contact").eq("object_id",contactId),
    row.email?admin.from("outbound_email_events").select("id,event_type,status,automation,created_at").eq("recipient",row.email).order("created_at",{ascending:false}).limit(30):Promise.resolve({data:[],error:null}),
    row.lead_id?admin.from("recruiter_activity").select("id,action,description,created_at").eq("subject_type","lead").eq("subject_id",row.lead_id).order("created_at",{ascending:false}).limit(40):Promise.resolve({data:[],error:null}),
  ]);
  for(const result of [companyResult,leadResult,fieldsResult,valuesResult,emailResult,activityResult]) if(result.error) throw result.error;

  const company=companyResult.data as Company|null;
  const lead=leadResult.data as Lead|null;
  const fields=(fieldsResult.data||[]) as CustomField[];
  const valueMap=new Map(((valuesResult.data||[]) as CustomValue[]).map(item=>[item.field_id,item.value]));
  const emails=(emailResult.data||[]) as EmailEvent[];
  const activities=((activityResult.data||[]) as Activity[]).filter(item=>/email|contact|meeting|discovery|follow_up/.test(item.action));
  const returnTo=`/workspace/recruiter/crm/contacts/${contactId}`;
  const initial=(row.full_name||row.email||"?").slice(0,1).toUpperCase();

  return <div className={styles.detailPage}>
    {query.contact_created?<div className="success-banner">Contact created.</div>:null}
    {query.contact_saved?<div className="success-banner">Contact updated.</div>:null}
    {query.contact_error?<div className="alert" role="alert">{query.contact_error}</div>:null}
    {query.field_saved?<div className="success-banner">Custom field created.</div>:null}
    {query.field_value_saved?<div className="success-banner">Custom field updated.</div>:null}
    {query.field_error?<div className="alert" role="alert">{query.field_error}</div>:null}

    <Link className={styles.detailBack} href="/workspace/recruiter/crm/contacts"><ArrowLeft size={14}/> Back to contacts</Link>
    <header className={styles.detailHeader}>
      <div className={styles.detailIdentity}>
        <span className={styles.detailAvatar}>{initial}</span>
        <div>
          <div className={styles.kicker}>Contact</div>
          <h1>{row.full_name||row.email||"CRM contact"}</h1>
          <p>{[row.title,company?.name].filter(Boolean).join(" · ")||"Standalone CRM contact"}</p>
        </div>
      </div>
      <div className={styles.headerActions}>
        {company?<Link className={styles.secondaryButton} href={`/workspace/recruiter/crm/companies/${company.id}`}><Building2 size={15}/> Company</Link>:null}
        {lead?<Link className={styles.primaryButton} href={`/workspace/recruiter/crm/${lead.id}`}><UserRound size={15}/> Relationship</Link>:null}
      </div>
    </header>

    <div className={styles.detailGrid}>
      <div className="stack">
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Communication history</h2><Mail size={15}/></div>
          <div className={styles.panelBody}>
            {emails.length||activities.length?<div className={styles.timeline}>
              {emails.map(item=><div className={styles.timelineItem} key={`email-${item.id}`}><span className={styles.timelineDot}/><div><strong>{item.event_type.replaceAll("_"," ")}</strong><p>Email {item.status}{item.automation?` · ${item.automation}`:""}</p><time>{fmt(item.created_at,true)}</time></div></div>)}
              {activities.map(item=><div className={styles.timelineItem} key={`activity-${item.id}`}><span className={styles.timelineDot}/><div><strong>{item.action.replaceAll("_"," ")}</strong>{item.description?<p>{item.description}</p>:null}<time>{fmt(item.created_at,true)}</time></div></div>)}
            </div>:<div className={styles.empty}>No communication has been logged for this contact yet.</div>}
          </div>
        </section>

        {lead?<section className={styles.panel}>
          <div className={styles.panelHead}><h2>Hiring relationship</h2><UserRound size={15}/></div>
          <div className={styles.panelBody}>
            <Link className={styles.linkedRole} href={`/workspace/recruiter/crm/${lead.id}`}>
              <span><strong>{lead.service||"Virtual Assistant hiring request"}</strong><small>{String(lead.crm_stage||"new").replaceAll("_"," ")} · opened {fmt(lead.created_at)}</small></span>
              <UserRound size={17}/>
            </Link>
          </div>
        </section>:null}
      </div>

      <aside className="stack">
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Contact properties</h2><Phone size={15}/></div>
          <div className={styles.panelBody}>
            <form action={updateCrmContactAction} className={styles.form}>
              <input type="hidden" name="contact_id" value={contactId}/>
              <input type="hidden" name="return_to" value={returnTo}/>
              <label>Name<input name="full_name" defaultValue={row.full_name||""}/></label>
              <label>Title<input name="title" defaultValue={row.title||""}/></label>
              <label>Phone<input name="phone" defaultValue={row.phone||""}/></label>
              <button type="submit">Save contact</button>
            </form>
            <div className={styles.contactList} style={{marginTop:12}}>
              <div><span>Email</span>{row.email?<a href={`mailto:${row.email}`}>{row.email}</a>:<strong>—</strong>}</div>
              <div><span>Client account</span><strong>{row.client_id?"Connected":"Not connected"}</strong></div>
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Custom fields</h2></div>
          <div className={styles.panelBody}>
            <div className="stack">
              {fields.map(field=>{
                const current=valueMap.get(field.id);
                const raw=current==null?"":typeof current==="string"||typeof current==="number"?String(current):current===true?"true":current===false?"false":"";
                const options=Array.isArray(field.options)?field.options.map(String):[];
                return <form action={setCrmCustomValueAction} className={styles.form} key={field.id}>
                  <input type="hidden" name="field_id" value={field.id}/>
                  <input type="hidden" name="object_id" value={contactId}/>
                  <input type="hidden" name="object_type" value="contact"/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <label>{field.label}
                    {field.field_type==="select"?<select name="value" defaultValue={raw}><option value="">—</option>{options.map(option=><option key={option} value={option}>{option}</option>)}</select>
                    :field.field_type==="boolean"?<select name="value" defaultValue={raw}><option value="">—</option><option value="true">Yes</option><option value="false">No</option></select>
                    :<input name="value" type={field.field_type==="number"?"number":field.field_type==="date"?"date":"text"} defaultValue={raw}/>}
                  </label>
                  <button type="submit">Save {field.label}</button>
                </form>;
              })}
              {!fields.length?<div className={styles.muted}>No contact fields yet.</div>:null}
            </div>
            <details className={styles.saveView} style={{marginTop:12}}>
              <summary>+ Add contact field</summary>
              <form action={createCrmCustomFieldAction} className={styles.form}>
                <input type="hidden" name="object_type" value="contact"/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>Label<input name="label" required minLength={2} placeholder="Decision role"/></label>
                <label>Type<select name="field_type" defaultValue="text"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="boolean">Yes / No</option><option value="select">Select</option></select></label>
                <label>Select options<input name="options" placeholder="Decision maker, Champion, User"/></label>
                <button type="submit">Create field</button>
              </form>
            </details>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Record</h2></div>
          <div className={styles.panelBody}>
            <div className={styles.contactList}>
              <div><span>Created</span><strong>{fmt(row.created_at)}</strong></div>
              <div><span>Updated</span><strong>{fmt(row.updated_at)}</strong></div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>;
}
