import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, Building2, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCrmCustomFieldAction, setCrmCustomValueAction, updateCrmCompanyAction } from "@/app/actions/crm";
import styles from "../../crm.module.css";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type Contact = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  lead_id: string | null;
};

type Lead = {
  id: string;
  name: string | null;
  email: string;
  service: string | null;
  crm_stage: string | null;
  job_id: string | null;
  created_at: string;
};
type CustomField={id:string;label:string;field_type:string;options:unknown};
type CustomValue={field_id:string;value:unknown};

function fmt(value:string) {
  return new Intl.DateTimeFormat("en-PH",{dateStyle:"medium",timeZone:"Asia/Manila"}).format(new Date(value));
}

export default async function CrmCompanyDetailPage({params,searchParams}:{params:Promise<{companyId:string}>;searchParams:Promise<Record<string,string|undefined>>}) {
  await requireRoleFast("recruiter");
  const { companyId } = await params;
  const query = await searchParams;
  const admin = createAdminClient();

  const [{data:company,error},{data:contacts,error:contactError},{data:leads,error:leadError},{data:fields,error:fieldsError},{data:values,error:valuesError}] = await Promise.all([
    admin.from("crm_companies").select("id,name,website,industry,location,created_at,updated_at").eq("id",companyId).maybeSingle(),
    admin.from("crm_contacts").select("id,full_name,email,phone,title,lead_id").eq("company_id",companyId).order("created_at",{ascending:false}),
    admin.from("lead_intake").select("id,name,email,service,crm_stage,job_id,created_at").eq("crm_company_id",companyId).eq("lead_type","client_hiring").order("created_at",{ascending:false}),
    admin.from("crm_custom_fields").select("id,label,field_type,options").eq("object_type","company").order("created_at",{ascending:true}),
    admin.from("crm_custom_values").select("field_id,value").eq("object_type","company").eq("object_id",companyId),
  ]);
  if(error) throw error;
  if(contactError) throw contactError;
  if(leadError) throw leadError;
  if(fieldsError) throw fieldsError;
  if(valuesError) throw valuesError;
  if(!company) notFound();

  const row=company as Company;
  const contactRows=(contacts||[]) as Contact[];
  const leadRows=(leads||[]) as Lead[];
  const customFields=(fields||[]) as CustomField[];
  const customValueMap=new Map(((values||[]) as CustomValue[]).map(item=>[item.field_id,item.value]));
  const returnTo=`/workspace/recruiter/crm/companies/${companyId}`;

  return <div className={styles.detailPage}>
    {query.company_created ? <div className="success-banner">Company created.</div> : null}
    {query.company_exists ? <div className="success-banner">That company already existed, so I opened its record.</div> : null}
    {query.company_saved ? <div className="success-banner">Company details updated.</div> : null}
    {query.company_error ? <div className="alert" role="alert">{query.company_error}</div> : null}
    {query.field_saved ? <div className="success-banner">Custom field created.</div> : null}
    {query.field_value_saved ? <div className="success-banner">Custom field updated.</div> : null}
    {query.field_error ? <div className="alert" role="alert">{query.field_error}</div> : null}

    <Link className={styles.detailBack} href="/workspace/recruiter/crm/companies"><ArrowLeft size={14}/> Back to companies</Link>
    <header className={styles.detailHeader}>
      <div className={styles.detailIdentity}>
        <span className={styles.detailAvatar}>{row.name.slice(0,1).toUpperCase()}</span>
        <div>
          <div className={styles.kicker}>Company</div>
          <h1>{row.name}</h1>
          <p>{contactRows.length} contact{contactRows.length===1?"":"s"} · {leadRows.length} hiring record{leadRows.length===1?"":"s"}</p>
        </div>
      </div>
      <div className={styles.headerActions}>
        <Link className={styles.secondaryButton} href="/workspace/recruiter/crm/contacts"><UsersRound size={15}/> All contacts</Link>
        <Link className={styles.primaryButton} href="/workspace/recruiter/crm"><BriefcaseBusiness size={15}/> Hiring CRM</Link>
      </div>
    </header>

    <div className={styles.detailGrid}>
      <div className="stack">
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>People</h2><UsersRound size={15}/></div>
          <div className={styles.panelBody}>
            {contactRows.length ? <div className={styles.timeline}>{contactRows.map(contact=><div className={styles.timelineItem} key={contact.id}>
              <span className={styles.timelineDot}/>
              <div>
                <strong>{contact.full_name || contact.email || "Contact"}</strong>
                <p>{[contact.title,contact.email,contact.phone].filter(Boolean).join(" · ") || "No additional contact details"}</p>
                <Link className={styles.inlineLink} href={`/workspace/recruiter/crm/contacts/${contact.id}`}>Open contact record</Link>
                {contact.lead_id ? <> · <Link className={styles.inlineLink} href={`/workspace/recruiter/crm/${contact.lead_id}`}>Relationship</Link></> : null}
              </div>
            </div>)}</div> : <div className={styles.empty}>No contacts linked yet.</div>}
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Hiring history</h2><Building2 size={15}/></div>
          <div className={styles.panelBody}>
            {leadRows.length ? <div className={styles.timeline}>{leadRows.map(lead=><div className={styles.timelineItem} key={lead.id}>
              <span className={styles.timelineDot}/>
              <div>
                <strong>{lead.service || "Virtual Assistant hiring request"}</strong>
                <p>{lead.name || lead.email} · {String(lead.crm_stage||"new").replaceAll("_"," ")} · {fmt(lead.created_at)}</p>
                <Link className={styles.inlineLink} href={`/workspace/recruiter/crm/${lead.id}`}>Open CRM record</Link>
              </div>
            </div>)}</div> : <div className={styles.empty}>No hiring history linked yet.</div>}
          </div>
        </section>
      </div>

      <aside className="stack">
        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Company properties</h2><Building2 size={15}/></div>
          <div className={styles.panelBody}>
            <form action={updateCrmCompanyAction} className={styles.form}>
              <input type="hidden" name="company_id" value={companyId}/>
              <input type="hidden" name="return_to" value={returnTo}/>
              <label>Website<input name="website" defaultValue={row.website||""} placeholder="https://example.com"/></label>
              <label>Industry<input name="industry" defaultValue={row.industry||""} placeholder="Healthcare, trades, SaaS…"/></label>
              <label>Location<input name="location" defaultValue={row.location||""} placeholder="Sydney, NSW"/></label>
              <button type="submit">Save company</button>
            </form>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><h2>Custom fields</h2></div>
          <div className={styles.panelBody}>
            <div className="stack">
              {customFields.map(field=>{
                const current=customValueMap.get(field.id);
                const raw=current==null?"":typeof current==="string"||typeof current==="number"?String(current):current===true?"true":current===false?"false":"";
                const options=Array.isArray(field.options)?field.options.map(String):[];
                return <form action={setCrmCustomValueAction} className={styles.form} key={field.id}>
                  <input type="hidden" name="field_id" value={field.id}/>
                  <input type="hidden" name="object_id" value={companyId}/>
                  <input type="hidden" name="object_type" value="company"/>
                  <input type="hidden" name="return_to" value={returnTo}/>
                  <label>{field.label}
                    {field.field_type==="select"?<select name="value" defaultValue={raw}><option value="">—</option>{options.map(option=><option key={option} value={option}>{option}</option>)}</select>
                    :field.field_type==="boolean"?<select name="value" defaultValue={raw}><option value="">—</option><option value="true">Yes</option><option value="false">No</option></select>
                    :<input name="value" type={field.field_type==="number"?"number":field.field_type==="date"?"date":"text"} defaultValue={raw}/>}
                  </label>
                  <button type="submit">Save {field.label}</button>
                </form>;
              })}
              {!customFields.length?<div className={styles.muted}>No company fields yet.</div>:null}
            </div>
            <details className={styles.saveView} style={{marginTop:12}}>
              <summary>+ Add company field</summary>
              <form action={createCrmCustomFieldAction} className={styles.form}>
                <input type="hidden" name="object_type" value="company"/>
                <input type="hidden" name="return_to" value={returnTo}/>
                <label>Label<input name="label" required minLength={2} placeholder="Account tier"/></label>
                <label>Type<select name="field_type" defaultValue="text"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="boolean">Yes / No</option><option value="select">Select</option></select></label>
                <label>Select options<input name="options" placeholder="A, B, C"/></label>
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
