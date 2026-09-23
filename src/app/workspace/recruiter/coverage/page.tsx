import Link from "next/link";
import { AlertTriangle, ArrowRight, CircleCheck, Users } from "lucide-react";
import { requireAnyRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { SERVICE_PAGES } from "@/lib/service-pages";
import { PUBLIC_VA_MIN_COMPLETION } from "@/lib/public-visibility";
import type { RecruiterVaDirectoryRow } from "@/lib/workspace-rows";

/**
 * Demand against supply, per specialty.
 *
 * Leads arrive for roles the bench cannot fill, and until now that was only
 * visible by noticing it. This puts the shortfall in one place: what clients
 * are asking for, what is actually presentable, and which requests do not map
 * to any category we recruit for.
 */

const OPEN_LEAD_STAGES = ["new", "contacted", "discovery_booked", "qualified", "terms_sent", "shortlist_sent", "nurture"];
const OPEN_JOB_STATUSES = ["draft", "pending", "published"];

/** Lead `service` holds a service-page name, a category, or free text. */
function toCategory(service: string | null | undefined) {
  const value = String(service || "").trim();
  if (!value) return null;
  const direct = VA_CATEGORIES.find((category) => category.toLowerCase() === value.toLowerCase());
  if (direct) return direct;
  const page = SERVICE_PAGES.find((item) => item.name.toLowerCase() === value.toLowerCase());
  return page?.directoryCategory || null;
}

export default async function RecruiterCoveragePage() {
  await requireAnyRole(["recruiter", "admin"]);
  const admin = createAdminClient();

  const [{ data: leadRows }, { data: jobRows }, { data: vaRows }] = await Promise.all([
    admin.from("lead_intake").select("id,service,crm_stage").eq("lead_type", "client_hiring").in("crm_stage", OPEN_LEAD_STAGES).limit(2000),
    admin.from("jobs").select("id,title,categories,status").in("status", OPEN_JOB_STATUSES).limit(2000),
    admin.from("recruiter_va_directory")
      .select("user_id,primary_category,stage,completion_score,directory_visible,availability_status,account_status")
      .eq("account_status", "active")
      .limit(3000)
  ]);

  const leads = leadRows || [];
  const jobs = jobRows || [];
  const vas = (vaRows || []) as RecruiterVaDirectoryRow[];

  const demand = new Map<string, number>();
  const unmapped = new Map<string, number>();
  for (const lead of leads) {
    const category = toCategory(lead.service);
    if (category) demand.set(category, (demand.get(category) || 0) + 1);
    else if (lead.service) unmapped.set(String(lead.service), (unmapped.get(String(lead.service)) || 0) + 1);
  }
  for (const job of jobs) {
    const categories = Array.isArray(job.categories) ? job.categories.map(String) : [];
    for (const raw of categories) {
      const category = toCategory(raw) || raw;
      if (VA_CATEGORIES.includes(category as (typeof VA_CATEGORIES)[number])) {
        demand.set(category, (demand.get(category) || 0) + 1);
      } else {
        unmapped.set(raw, (unmapped.get(raw) || 0) + 1);
      }
    }
  }

  const rows = VA_CATEGORIES.map((category) => {
    const inCategory = vas.filter((va) => va.primary_category === category);
    const benched = inCategory.filter((va) => ["approved", "bench"].includes(String(va.stage || "")));
    const presentable = benched.filter((va) => Number(va.completion_score || 0) >= PUBLIC_VA_MIN_COMPLETION);
    const available = presentable.filter((va) => va.availability_status === "available");
    const open = demand.get(category) || 0;
    return {
      category,
      open,
      bench: benched.length,
      presentable: presentable.length,
      available: available.length,
      // Three is the number the client-facing match screen tries to show.
      shortfall: Math.max(0, Math.max(open, open > 0 ? 3 : 0) - available.length)
    };
  }).sort((a, b) => b.shortfall - a.shortfall || b.open - a.open);

  const short = rows.filter((row) => row.shortfall > 0);
  const unmappedRows = [...unmapped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);

  return <>
    <div className="page-head">
      <div>
        <div className="kicker">Talent operations</div>
        <h1>Coverage: demand vs bench</h1>
        <p>Open client demand for each specialty against the VAs who could actually be presented today. Recruit against the shortfall column rather than in general.</p>
      </div>
      <Link className="btn" href="/workspace/recruiter/categories">VA categories <ArrowRight size={15}/></Link>
    </div>

    <div className="grid-3" style={{ marginBottom: 20 }}>
      <section className="card">
        <span className="small muted">Open client demand</span>
        <h2 style={{ margin: "4px 0 0" }}>{leads.length + jobs.length}</h2>
        <p className="small muted" style={{ margin: "6px 0 0" }}>{leads.length} live leads · {jobs.length} open roles</p>
      </section>
      <section className="card">
        <span className="small muted">Presentable VAs</span>
        <h2 style={{ margin: "4px 0 0" }}>{rows.reduce((sum, row) => sum + row.available, 0)}</h2>
        <p className="small muted" style={{ margin: "6px 0 0" }}>Benched, {PUBLIC_VA_MIN_COMPLETION}%+ complete and marked available</p>
      </section>
      <section className="card">
        <span className="small muted">Specialties short</span>
        <h2 style={{ margin: "4px 0 0" }}>{short.length} of {rows.length}</h2>
        <p className="small muted" style={{ margin: "6px 0 0" }}>Cannot field three available VAs against live demand</p>
      </section>
    </div>

    <section className="card">
      <h2 style={{ marginTop: 0 }}>Where to recruit next</h2>
      <div className="table-wrap responsive-table">
        <table className="table">
          <thead>
            <tr>
              <th>Specialty</th>
              <th>Open demand</th>
              <th>On bench</th>
              <th>Presentable</th>
              <th>Available now</th>
              <th>Shortfall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.category}>
                <td><strong>{vaCategoryLabel(row.category)}</strong></td>
                <td>{row.open}</td>
                <td>{row.bench}</td>
                <td>{row.presentable}</td>
                <td>{row.available}</td>
                <td>
                  {row.shortfall > 0
                    ? <span className="badge badge-warning"><AlertTriangle size={13}/> need {row.shortfall}</span>
                    : <span className="badge badge-success"><CircleCheck size={13}/> covered</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginBottom: 0 }}>
        Presentable means benched and at least {PUBLIC_VA_MIN_COMPLETION}% complete. A VA on the bench who has not finished their profile cannot be put in front of a client, so the gap between those two columns is reactivation work, not recruitment.
      </p>
    </section>

    {unmappedRows.length ? (
      <section className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}><Users size={18}/> Requests with no matching specialty</h2>
        <p className="small muted">Clients asked for these and they map to none of the {VA_CATEGORIES.length} categories we recruit against, so nobody on the bench is tagged for them. This is where demand is invisible to matching.</p>
        <div className="table-wrap responsive-table">
          <table className="table">
            <thead><tr><th>Requested</th><th>Times asked</th></tr></thead>
            <tbody>
              {unmappedRows.map(([label, count]) => (
                <tr key={label}><td>{label}</td><td>{count}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    ) : null}
  </>;
}
