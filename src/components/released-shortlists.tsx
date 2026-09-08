import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

type Role = { id: string; title: string };
type Match = { job_id: string };

/** Shows counts only. Private candidate evidence stays behind the existing role access gate. */
export function ReleasedShortlists({ jobs, matches }: { jobs: Role[]; matches: Match[] }) {
  if (!matches.length) return null;
  const counts = new Map<string, number>();
  for (const match of matches) counts.set(match.job_id, (counts.get(match.job_id) || 0) + 1);
  return <section className="card dashboard-section-card" id="curated-matches">
    <div className="dashboard-section-head"><div><div className="kicker">Selected by your recruiting team</div><h2>Your curated shortlists</h2><p>Review the matches prepared for each role. Candidate details follow your agreed access terms.</p></div><Sparkles size={23}/></div>
    <div className="compact-list">{jobs.filter(job => counts.has(job.id)).map(job => <Link key={job.id} href={`/workspace/client/jobs/${job.id}#curated-shortlist`}>
      <span><strong>{job.title}</strong><small>{counts.get(job.id)} matched candidate{counts.get(job.id) === 1 ? "" : "s"} ready to review</small></span>
      <span className="row small">Review shortlist <ArrowRight size={16}/></span>
    </Link>)}</div>
  </section>;
}
