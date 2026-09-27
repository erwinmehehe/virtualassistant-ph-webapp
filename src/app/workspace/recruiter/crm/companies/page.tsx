import Link from "next/link";
import { Building2, Search, UsersRound } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCrmCompanyAction } from "@/app/actions/crm";
import styles from "../crm.module.css";

type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  location: string | null;
  owner_id: string | null;
  updated_at: string;
};

type Contact = { id: string; company_id: string | null; lead_id: string | null };

export default async function CrmCompaniesPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  await requireRoleFast("recruiter");
  const params = await searchParams;
  const q = String(params.q || "").trim();
  const admin = createAdminClient();

  let query = admin
    .from("crm_companies")
    .select("id,name,website,industry,location,owner_id,updated_at")
    .order("name")
    .limit(500);
  if (q) query = query.ilike("name", `%${q.replace(/[,%()]/g, " ")}%`);

  const [{ data: companyRows, error }, { data: contactRows, error: contactError }] = await Promise.all([
    query,
    admin.from("crm_contacts").select("id,company_id,lead_id").limit(5000),
  ]);
  if (error) throw error;
  if (contactError) throw contactError;

  const companies = (companyRows || []) as Company[];
  const contacts = (contactRows || []) as Contact[];
  const contactCount = new Map<string,number>();
  const leadCount = new Map<string,number>();
  for (const contact of contacts) {
    if (!contact.company_id) continue;
    contactCount.set(contact.company_id, (contactCount.get(contact.company_id) || 0) + 1);
    if (contact.lead_id) leadCount.set(contact.company_id, (leadCount.get(contact.company_id) || 0) + 1);
  }

  return <div className={styles.page}>
    <header className={styles.header}>
      <div>
        <div className={styles.kicker}>CRM object</div>
        <h1>Companies</h1>
        <p>Employer organizations connected to enquiries, contacts, roles, and hiring activity.</p>
      </div>
      <div className={styles.headerActions}>
        <details className={styles.saveView}>
          <summary className={styles.primaryButton}>+ New company</summary>
          <form action={createCrmCompanyAction} className={styles.form}>
            <input type="hidden" name="return_to" value="/workspace/recruiter/crm/companies"/>
            <label>Name<input name="name" required minLength={2} placeholder="Company name"/></label>
            <label>Website<input name="website" placeholder="https://example.com"/></label>
            <label>Industry<input name="industry" placeholder="Healthcare, trades, SaaS…"/></label>
            <label>Location<input name="location" placeholder="Sydney, NSW"/></label>
            <button type="submit">Create company</button>
          </form>
        </details>
        <Link className={styles.secondaryButton} href="/workspace/recruiter/crm/contacts"><UsersRound size={15}/> Contacts</Link>
        <Link className={styles.secondaryButton} href="/workspace/recruiter/crm">Back to CRM</Link>
      </div>
    </header>

    <nav className={styles.objectBar} aria-label="CRM objects">
      <Link href="/workspace/recruiter/crm">Leads</Link>
      <Link className={styles.objectActive} href="/workspace/recruiter/crm/companies"><Building2 size={15}/> Companies</Link>
      <Link href="/workspace/recruiter/crm/contacts"><UsersRound size={15}/> Contacts</Link>
      <Link href="/workspace/recruiter/crm/automations">Automations</Link>
      <Link href="/workspace/recruiter/crm/import">Import / export</Link>
    </nav>

    <section className={styles.workspace} style={{display:"block",minHeight:520,marginTop:12}}>
      <div className={styles.toolbar}>
        <form method="get" className={styles.searchForm}>
          <div className={styles.searchBox}><Search size={15}/><input name="q" defaultValue={q} placeholder="Search companies"/></div>
          <button type="submit">Search</button>
          {q ? <Link href="/workspace/recruiter/crm/companies">Clear</Link> : null}
        </form>
      </div>
      <div className={styles.viewHeader}><div><h2>Company records</h2><span>{companies.length} compan{companies.length===1?"y":"ies"}</span></div></div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Contacts</th><th>Hiring records</th><th>Website</th></tr></thead>
          <tbody>
            {companies.map(company=><tr key={company.id}>
              <td><Link className={styles.recordLink} href={`/workspace/recruiter/crm/companies/${company.id}`}><span className={styles.avatar}>{company.name.slice(0,1).toUpperCase()}</span><span><strong>{company.name}</strong><small>Employer account</small></span></Link></td>
              <td>{company.industry || <span className={styles.muted}>—</span>}</td>
              <td>{company.location || <span className={styles.muted}>—</span>}</td>
              <td>{contactCount.get(company.id) || 0}</td>
              <td>{leadCount.get(company.id) || 0}</td>
              <td>{company.website ? <a className={styles.inlineLink} href={company.website} target="_blank" rel="noreferrer">Open site</a> : <span className={styles.muted}>—</span>}</td>
            </tr>)}
          </tbody>
        </table>
        {!companies.length ? <div className={styles.empty}>No company records match this view.</div> : null}
      </div>
    </section>
  </div>;
}
