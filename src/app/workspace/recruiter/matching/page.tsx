import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { candidateAccessLabel } from "@/lib/candidate-access";
import { dateShort } from "@/lib/format";

export default async function RecruiterMatchingPage() {
  await requireRole("recruiter");
  const admin = createAdminClient();
  const [{ data: jobs }, { data: shortlist }, { data: access }] = await Promise.all([
    admin.from("jobs").select("id,title,company_name,status,categories,created_at,client_id").in("status", ["pending", "published"]).order("created_at", { ascending: false }).limit(200),
    admin.from("job_shortlist_candidates").select("job_id,shortlist_status"),
    admin.from("job_candidate_access").select("job_id,access_status")
  ]);
  const shortlistMap = new Map<string, { proposed: number; released: number }>();
  for (const row of shortlist || []) {
    const current = shortlistMap.get(row.job_id) || { proposed: 0, released: 0 };
    if (row.shortlist_status === "proposed") current.proposed += 1;
    if (row.shortlist_status === "released") current.released += 1;
    shortlistMap.set(row.job_id, current);
  }
  const accessMap = new Map<string,string>((access || []).map((row: any) => [String(row.job_id), String(row.access_status)] as [string,string]));

  return <>
    <div className="page-head"><div><h1>Role matching</h1><p>Run pending client roles against the full vetted VA pool before applications arrive, then save or release a curated shortlist.</p></div></div>
    <div className="table-wrap responsive-table"><table>
      <thead><tr><th>Role</th><th>Status</th><th>Category</th><th>Shortlist</th><th>Client access</th><th>Submitted</th><th></th></tr></thead>
      <tbody>{jobs?.length ? jobs.map((job: any) => { const counts = shortlistMap.get(job.id) || { proposed: 0, released: 0 }; return <tr key={job.id}>
        <td data-label="Role"><Link className="text-link" href={`/workspace/recruiter/matching/${job.id}`}><strong>{job.title}</strong></Link><div className="small muted">{job.company_name || (job.client_id ? "Client role" : "Awaiting client signup")}</div></td>
        <td data-label="Status"><span className={`badge ${job.status === "pending" ? "badge-warning" : "badge-success"}`}>{job.status}</span></td>
        <td data-label="Category">{(job.categories || []).slice(0, 2).join(", ") || "Not set"}</td>
        <td data-label="Shortlist"><strong>{counts.released} released</strong><div className="small muted">{counts.proposed} internal</div></td>
        <td data-label="Client access"><span className="small">{candidateAccessLabel(accessMap.get(job.id))}</span></td>
        <td data-label="Submitted">{dateShort(job.created_at)}</td>
        <td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/matching/${job.id}`}>Match pool</Link></td>
      </tr>; }) : <tr><td colSpan={7}><div className="empty">No pending or published roles are ready for matching.</div></td></tr>}</tbody>
    </table></div>
  </>;
}
