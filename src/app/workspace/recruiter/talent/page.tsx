import Link from "next/link";
import { Search, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVaCompletion } from "@/lib/profile-completeness";
import { dateShort } from "@/lib/format";
import { vettingStatusLabel } from "@/lib/vetting";

export default async function RecruiterTalentDirectory({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  await requireRole("recruiter");
  const params = await searchParams;
  const q = String(params.q || "").trim().toLowerCase();
  const stage = String(params.stage || "").trim();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: vas }, { data: vettingRows }] = await Promise.all([
    admin.from("profiles").select("id,full_name,avatar_url,created_at,account_status").eq("role","va").order("created_at",{ascending:false}).limit(500),
    admin.from("va_profiles").select("user_id,headline,primary_category,categories,skills,years_experience,weekly_hours,hourly_rate,availability_status,directory_visible,resume_path,slug").limit(500),
    admin.from("va_vetting").select("va_id,stage,recruiter_id,updated_at").limit(500)
  ]);

  const vaMap = new Map((vas || []).map((row:any) => [row.user_id,row]));
  const vettingMap = new Map((vettingRows || []).map((row:any) => [row.va_id,row]));
  const rows = (profiles || []).map((profile:any) => ({ profile, va: vaMap.get(profile.id) as any, vetting: vettingMap.get(profile.id) as any }))
    .filter(({profile,va,vetting}) => {
      if (!va) return false;
      if (stage && String(vetting?.stage || "profile") !== stage) return false;
      if (!q) return true;
      const haystack = [profile.full_name,va.headline,va.primary_category,...(va.categories||[]),...(va.skills||[])].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });

  const stages = ["profile","test","video","recruiter_review","finalist","approved","bench","rejected"];
  return <>
    <div className="page-head"><div><h1>VA directory</h1><p>Recruiter-only access to every VA account, including profiles that are not yet in the vetting queue or are already approved.</p></div></div>
    <form className="directory-filterbar recruiter-directory-filters" method="get">
      <div className="directory-filter-search"><Search size={16}/><input name="q" defaultValue={params.q} placeholder="Search name, skill, or category" aria-label="Search VA directory"/></div>
      <select name="stage" defaultValue={stage} aria-label="Vetting stage"><option value="">All stages</option>{stages.map((value)=><option value={value} key={value}>{vettingStatusLabel(value)}</option>)}</select>
      <button className="btn btn-primary" type="submit">Filter</button>
      <Link className="btn" href="/workspace/recruiter/talent">Reset</Link>
    </form>
    <div className="row-between wrap" style={{margin:"14px 0"}}><span className="small muted">{rows.length} VA profile{rows.length===1?"":"s"}</span><span className="small muted"><ShieldCheck size={14} style={{verticalAlign:"-2px"}}/> Recruiter-only private workspace</span></div>
    <div className="table-wrap responsive-table"><table><thead><tr><th>VA</th><th>Stage</th><th>Profile</th><th>Experience</th><th>Availability</th><th>Visibility</th><th>Joined</th><th></th></tr></thead><tbody>
      {rows.length ? rows.map(({profile,va,vetting}:any) => {
        const completion=getVaCompletion(va).score;
        return <tr key={profile.id}>
          <td data-label="VA"><strong>{profile.full_name||"VA account"}</strong><div className="small muted">{va.headline||va.primary_category||"Virtual Assistant"}</div></td>
          <td data-label="Stage"><span className="badge">{vettingStatusLabel(vetting?.stage||"profile")}</span></td>
          <td data-label="Profile">{completion}%</td>
          <td data-label="Experience">{va.years_experience != null ? `${va.years_experience} yrs` : "Not set"}</td>
          <td data-label="Availability">{va.weekly_hours?`${va.weekly_hours} hrs/week`:va.availability_status||"Not set"}</td>
          <td data-label="Visibility">{va.directory_visible?<span className="badge badge-success">Public</span>:<span className="badge">Private</span>}</td>
          <td data-label="Joined">{dateShort(profile.created_at)}</td>
          <td data-label="Action"><Link className="btn btn-sm btn-primary" href={`/workspace/recruiter/candidates/${profile.id}`}>View profile</Link></td>
        </tr>;
      }) : <tr><td colSpan={8}><div className="empty">No VA profiles match those filters.</div></td></tr>}
    </tbody></table></div>
  </>;
}
