import Link from "next/link";
import { Building2, Search, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCrmContactAction, updateCrmContactAction } from "@/app/actions/crm";
import styles from "../crm.module.css";

type Contact = {
  id: string;
  lead_id: string | null;
  company_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  updated_at: string;
};

type Company = { id: string; name: string };

export default async function CrmContactsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  await requireRoleFast("recruiter");
  const params = await searchParams;
  const q = String(params.q || "").trim();
  const admin = createAdminClient();

  let contactQuery = admin
    .from("crm_contacts")
    .select("id,lead_id,company_id,full_name,email,phone,title,updated_at")
    .order("updated_at",{ascending:false})
    .limit(500);
  if(q) {
    const safe=q.replace(/[,%()]/g," ");
    contactQuery=contactQuery.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
  }

  const [{data:contacts,error},{data:companies,error:companyError}] = await Promise.all([
    contactQuery,
    admin.from("crm_companies").select("id,name").limit(1000),
  ]);
  if(error) throw error;
  if(companyError) throw companyError;

  const companyMap=new Map(((companies||[]) as Company[]).map(company=>[company.id,company.name]));
  const rows=(contacts||[]) as Contact[];

  return <div className={styles.page}>
    <header className={styles.header}>
      <div>
        <div className={styles.kicker}>CRM object</div>
        <h1>Contacts</h1>
        <p>People connected to employer accounts and hiring relationships.</p>
      </div>
      <div className={styles.headerActions}>
        <details className={styles.saveView}>
          <summary className={styles.primaryButton}>+ New contact</summary>
          <form action={createCrmContactAction} className={styles.form}>
            <input type="hidden" name="return_to" value="/workspace/recruiter/crm/contacts"/>
            <label>Name<input name="full_name" placeholder="Client name"/></label>
            <label>Email<input name="email" type="email" placeholder="client@example.com"/></label>
            <label>Company<select name="company_id" defaultValue=""><option value="">No company</option>{((companies||[]) as Company[]).map(company=><option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
            <label>Title<input name="title" placeholder="Founder, Operations Manager…"/></label>
            <label>Phone<input name="phone"/></label>
            <button type="submit">Create contact</button>
          </form>
        </details>
        <Link className={styles.secondaryButton} href="/workspace/recruiter/crm/companies"><Building2 size={15}/> Companies</Link>
        <Link className={styles.secondaryButton} href="/workspace/recruiter/crm">Back to CRM</Link>
      </div>
    </header>

    <nav className={styles.objectBar} aria-label="CRM objects">
      <Link href="/workspace/recruiter/crm">Leads</Link>
      <Link href="/workspace/recruiter/crm/companies"><Building2 size={15}/> Companies</Link>
      <Link className={styles.objectActive} href="/workspace/recruiter/crm/contacts"><UsersRound size={15}/> Contacts</Link>
      <Link href="/workspace/recruiter/crm/automations">Automations</Link>
      <Link href="/workspace/recruiter/crm/import">Import / export</Link>
    </nav>

    <section className={styles.workspace} style={{display:"block",minHeight:520,marginTop:12}}>
      <div className={styles.toolbar}>
        <form method="get" className={styles.searchForm}>
          <div className={styles.searchBox}><Search size={15}/><input name="q" defaultValue={q} placeholder="Search contacts"/></div>
          <button type="submit">Search</button>
          {q ? <Link href="/workspace/recruiter/crm/contacts">Clear</Link> : null}
        </form>
      </div>
      <div className={styles.viewHeader}><div><h2>Contact records</h2><span>{rows.length} contact{rows.length===1?"":"s"}</span></div></div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Contact</th><th>Company</th><th>Title</th><th>Phone</th><th>Relationship</th><th>Quick edit</th></tr></thead>
          <tbody>
            {rows.map(contact=><tr key={contact.id}>
              <td>
                <Link className={styles.recordLink} href={`/workspace/recruiter/crm/contacts/${contact.id}`}>
                  <span className={styles.avatar}>{(contact.full_name||contact.email||"?").slice(0,1).toUpperCase()}</span>
                  <span><strong>{contact.full_name||contact.email||"Contact"}</strong><small>{contact.email||"No email"}</small></span>
                </Link>
              </td>
              <td>{contact.company_id ? <Link className={styles.inlineLink} href={`/workspace/recruiter/crm/companies/${contact.company_id}`}>{companyMap.get(contact.company_id)||"Company"}</Link> : <span className={styles.muted}>—</span>}</td>
              <td>{contact.title||<span className={styles.muted}>—</span>}</td>
              <td>{contact.phone||<span className={styles.muted}>—</span>}</td>
              <td>{contact.lead_id ? "Hiring lead" : "Contact only"}</td>
              <td>
                <details>
                  <summary className={styles.inlineLink}>Edit</summary>
                  <form action={updateCrmContactAction} className={styles.form} style={{marginTop:8,minWidth:220}}>
                    <input type="hidden" name="contact_id" value={contact.id}/>
                    <input type="hidden" name="return_to" value="/workspace/recruiter/crm/contacts"/>
                    <label>Name<input name="full_name" defaultValue={contact.full_name||""}/></label>
                    <label>Title<input name="title" defaultValue={contact.title||""}/></label>
                    <label>Phone<input name="phone" defaultValue={contact.phone||""}/></label>
                    <button type="submit">Save contact</button>
                  </form>
                </details>
              </td>
            </tr>)}
          </tbody>
        </table>
        {!rows.length ? <div className={styles.empty}>No contacts match this view.</div> : null}
      </div>
    </section>
  </div>;
}
