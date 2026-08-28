import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Clock3, Globe2, WalletCards } from "lucide-react";
import { money, dateShort } from "@/lib/format";
import { matchLabel } from "@/lib/matching";
import { jobPublicHref } from "@/lib/public-routing";
import { uniqueStrings } from "@/lib/collections";

export function JobCard({ job, match }: { job: any; match?: number }) {
  const href = jobPublicHref(job);
  const rate = job.max_hourly_rate ? `${money(job.min_hourly_rate)}–${money(job.max_hourly_rate)}/hr` : `${money(job.min_hourly_rate)}/hr`;
  const categories = uniqueStrings(job.categories).slice(0, 3);
  const skills = uniqueStrings(job.required_skills).slice(0, 3);
  return <article className="job-market-card">
    <div className="job-market-main">
      <div className="job-market-title-row"><div><div className="job-market-company"><span className="job-reviewed-dot"/> {job.company_name || "Confidential client"}{job.published_at ? <span>· Posted {dateShort(job.published_at)}</span> : null}</div><h2><Link href={href}>{job.title}</Link></h2></div>{typeof match === "number" ? <div className="fit-badge"><strong>{matchLabel(match)}</strong><span>{match}%</span></div> : null}</div>
      {job.summary ? <p className="job-market-summary">{job.summary}</p> : null}
      <div className="pill-list job-market-pills">{categories.map((x)=><span className="badge" key={`category:${x.toLowerCase()}`}>{x}</span>)}{skills.map((x)=><span className="job-skill-pill" key={`skill:${x.toLowerCase()}`}>{x}</span>)}</div>
      <div className="job-market-facts"><span><WalletCards size={15}/><strong>{rate}</strong></span><span><Clock3 size={15}/><strong>{job.hours_per_week ? `${job.hours_per_week} hrs/week` : "Flexible hours"}</strong></span><span><Globe2 size={15}/><strong>{job.timezone || "Flexible timezone"}</strong></span>{job.engagement_length ? <span><BriefcaseBusiness size={15}/><strong>{job.engagement_length}</strong></span> : null}</div>
    </div>
    <div className="job-market-side"><span className="badge badge-success">Reviewed role</span><Link className="btn btn-primary" href={href}>View job <ArrowRight size={15}/></Link></div>
  </article>;
}
