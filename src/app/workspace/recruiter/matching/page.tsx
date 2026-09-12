import Link from "next/link";
import { Search } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessLabel } from "@/lib/candidate-access";
import { dateShort } from "@/lib/format";

function norm(value: unknown) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

export default async function RecruiterMatchingPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireRole("recruiter");
  const params = await searchParams;
  const view = String(params.view || "needs_candidates");
  const q = norm(params.q);
  const admin = createAdminClient();

  const [{ data: jobs }, { data: shortlist }, { data: apps }, { data: access }] = await Promise.all([
    admin
      .from("jobs")
      .select("id,title,company_name,status,categories,created_at,updated_at,client_id,closed_at")
      .order("created_at", { ascending: false })
      .limit(400),
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status"),
    admin.from("applications").select("job_id,status"),
    admin.from("job_candidate_access").select("job_id,access_status")
  ]);

  const shortlistMap = new Map<string, { proposed: number; released: number }>();
  for (const row of shortlist || []) {
    const counts = shortlistMap.get(row.job_id) || { proposed: 0, released: 0 };
    if (row.shortlist_status === "proposed") counts.proposed += 1;
    if (row.shortlist_status === "released") counts.released += 1;
    shortlistMap.set(row.job_id, counts);
  }

  const applicationMap = new Map<string, Record<string, number>>();
  for (const row of apps || []) {
    const counts = applicationMap.get(row.job_id) || {};
    counts[row.status] = (counts[row.status] || 0) + 1;
    applicationMap.set(row.job_id, counts);
  }

  const accessMap = new Map((access || []).map((row: any) => [row.job_id, row.access_status]));
  const staleCutoff = Date.now() - 90 * 86400000;

  // Do not silently deduplicate by client + title. Two active roles can
  // legitimately share the same title, and the old page hid those openings.
  const rows = (jobs || []).filter((job: any) => {
    const shortlistCounts = shortlistMap.get(job.id) || { proposed: 0, released: 0 };
    const applicationCounts = applicationMap.get(job.id) || {};
    const totalApps = Object.values(applicationCounts).reduce((sum, count) => sum + count, 0);
    const hired = (applicationCounts.hired || 0) > 0;
    const active = ["pending", "published"].includes(job.status);
    const stale = active && new Date(job.updated_at || job.created_at).getTime() < staleCutoff;
    let matches = true;

    if (view === "needs_candidates") matches = active && !stale && !hired && shortlistCounts.proposed + shortlistCounts.released + totalApps === 0;
    else if (view === "assigned") matches = active && !hired && shortlistCounts.proposed + shortlistCounts.released > 0;
    else if (view === "waiting_client") matches = active && !hired && (shortlistCounts.released > 0 || (applicationCounts.interview || 0) > 0 || (applicationCounts.offered || 0) > 0);
    else if (view === "applications") matches = active && !hired && totalApps > 0;
    else if (view === "filled") matches = hired;
    else if (view === "closed") matches = job.status === "closed" || stale;
    else if (view === "all") matches = true;
    else matches = active && !stale && !hired;

    if (q) {
      const haystack = [job.title, job.company_name, ...(job.categories || [])].map(norm).join(" ");
      matches = matches && haystack.includes(q);
    }
    return matches;
  });

  const tabs = [
    ["needs_candidates", "Needs candidates"],
    ["assigned", "Candidates assigned"],
    ["waiting_client", "Waiting on client"],
    ["applications", "Applications"],
    ["filled", "Filled"],
    ["closed", "Closed / stale"],
    ["all", "All roles"]
  ] as const;

  return <>
    <div className="page-head">
      <div>
        <div className="kicker">Recruiter role board</div>
        <h1>Role matching</h1>
        <p>Closed, stale, and filled roles are out of the way by default. Every active opening stays visible, even when a client has more than one role with the same title.</p>
      </div>
    </div>

    <section className="matching-board-guide">
      <span>1. Open a role</span>
      <span>2. Review recommended VAs</span>
      <span>3. Release a shortlist</span>
      <span>4. Follow up with the client</span>
    </section>

    <form className="directory-filterbar recruiter-directory-filters" method="get">
      <div className="directory-filter-search">
        <Search size={16} />
        <input name="q" defaultValue={params.q} placeholder="Search role, company, category" />
      </div>
      <select name="view" defaultValue={view}>
        {tabs.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className="btn btn-primary" type="submit">Filter</button>
      <Link className="btn" href="/workspace/recruiter/matching">Reset</Link>
    </form>

    <div className="role-filter-tabs">
      {tabs.map(([value, label]) => (
        <Link key={value} href={`/workspace/recruiter/matching?view=${value}`} className={view === value ? "active" : ""}>{label}</Link>
      ))}
    </div>

    <div className="row-between wrap" style={{ margin: "14px 0" }}>
      <span className="small muted"><strong>{rows.length}</strong> role{rows.length === 1 ? "" : "s"} in this view</span>
    </div>

    <div className="table-wrap responsive-table">
      <table>
        <thead><tr><th>Role</th><th>Queue</th><th>Candidates</th><th>Applications</th><th>Client access</th><th>Submitted</th><th></th></tr></thead>
        <tbody>
          {rows.length ? rows.map((job: any) => {
            const shortlistCounts = shortlistMap.get(job.id) || { proposed: 0, released: 0 };
            const applicationCounts = applicationMap.get(job.id) || {};
            const total = Object.values(applicationCounts).reduce((sum, count) => sum + count, 0);
            const hired = (applicationCounts.hired || 0) > 0;
            const label = job.status === "closed"
              ? "Closed"
              : hired
                ? "Filled"
                : shortlistCounts.released > 0
                  ? "Waiting on client"
                  : shortlistCounts.proposed > 0
                    ? "Candidates assigned"
                    : total > 0
                      ? "Applications"
                      : "Needs candidates";

            return <tr key={job.id}>
              <td data-label="Role">
                <Link className="text-link" href={`/workspace/recruiter/matching/${job.id}`}><strong>{job.title}</strong></Link>
                <div className="small muted">{job.company_name || (job.client_id ? "Client role" : "Lead awaiting signup")}</div>
              </td>
              <td data-label="Queue"><span className={`badge ${label === "Needs candidates" ? "badge-warning" : label === "Filled" ? "badge-success" : ""}`}>{label}</span></td>
              <td data-label="Candidates"><strong>{shortlistCounts.proposed + shortlistCounts.released}</strong><div className="small muted">{shortlistCounts.proposed} internal · {shortlistCounts.released} released</div></td>
              <td data-label="Applications"><strong>{total}</strong><div className="small muted">{applicationCounts.new || 0} new · {applicationCounts.interview || 0} interview · {applicationCounts.offered || 0} offered</div></td>
              <td data-label="Client access"><span className="small">{candidateAccessLabel(accessMap.get(job.id))}</span></td>
              <td data-label="Submitted">{dateShort(job.created_at)}</td>
              <td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/matching/${job.id}`}>{shortlistCounts.proposed + shortlistCounts.released + total ? "Manage role" : "Find Matching VAs"}</Link></td>
            </tr>;
          }) : <tr><td colSpan={7}><div className="empty">No roles in this view.</div></td></tr>}
        </tbody>
      </table>
    </div>
  </>;
}
