import Link from "next/link";
import { Download, FileUp, Table2 } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { importCrmCsvAction } from "@/app/actions/crm";
import styles from "../crm.module.css";

export default async function CrmImportPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  await requireRoleFast("recruiter");
  const params=await searchParams;
  const imported=Number(params.imported||0);
  const skipped=Number(params.skipped||0);

  return <div className={styles.page}>
    {params.import_error ? <div className="alert" role="alert">{params.import_error}</div> : null}
    {params.imported !== undefined ? <div className="success-banner">Imported {imported} lead{imported===1?"":"s"}. {skipped ? `${skipped} duplicate or invalid row${skipped===1?"":"s"} skipped.` : ""}</div> : null}

    <header className={styles.header}>
      <div>
        <div className={styles.kicker}>CRM data</div>
        <h1>Import &amp; export</h1>
        <p>Bring existing employer relationships into VAPH or export a clean operational copy of the current CRM.</p>
      </div>
      <div className={styles.headerActions}>
        <a className={styles.primaryButton} href="/workspace/recruiter/crm/export"><Download size={15}/> Export CSV</a>
        <Link className={styles.secondaryButton} href="/workspace/recruiter/crm">Back to CRM</Link>
      </div>
    </header>

    <nav className={styles.objectBar} aria-label="CRM objects">
      <Link href="/workspace/recruiter/crm">Leads</Link>
      <Link href="/workspace/recruiter/crm/companies">Companies</Link>
      <Link href="/workspace/recruiter/crm/contacts">Contacts</Link>
      <Link href="/workspace/recruiter/crm/automations">Automations</Link>
      <Link className={styles.objectActive} href="/workspace/recruiter/crm/import"><Table2 size={15}/> Import / export</Link>
    </nav>

    <div className={styles.detailGrid} style={{marginTop:12}}>
      <section className={styles.panel}>
        <div className={styles.panelHead}><h2>Import leads from CSV</h2><FileUp size={15}/></div>
        <div className={styles.panelBody}>
          <form action={importCrmCsvAction} className={styles.form}>
            <label>CSV file<input type="file" name="file" accept=".csv,text/csv" required/></label>
            <button type="submit"><FileUp size={14}/> Import up to 500 rows</button>
          </form>
          <div className={styles.note} style={{marginTop:12}}>
            <strong>Supported columns</strong>
            <div style={{marginTop:5}}>email is required. Optional: name, phone, company, service, hours, budget, timezone, message, crm_stage, estimated_value_usd.</div>
          </div>
          <div className={styles.note} style={{marginTop:8}}>
            Existing hiring leads with the same email are skipped instead of overwritten. Imported records are assigned to the recruiter performing the import.
          </div>
        </div>
      </section>

      <aside className={styles.panel}>
        <div className={styles.panelHead}><h2>Export</h2><Download size={15}/></div>
        <div className={styles.panelBody}>
          <p className={styles.brief}>Export includes the core relationship fields used by the hiring CRM: contact details, company, service, stage, owner, follow-up date, value, linked role, and created date.</p>
          <a className={styles.primaryButton} href="/workspace/recruiter/crm/export" style={{marginTop:12}}><Download size={14}/> Download current CRM CSV</a>
        </div>
      </aside>
    </div>
  </div>;
}
