import Link from "next/link";
import { CheckCircle2, EyeOff } from "lucide-react";
import { getVaCompletion } from "@/lib/profile-completeness";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";

export function ProfileCompleteness({ profile, avatarUrl }: { profile: any; avatarUrl?: string | null }) {
  const result = getVaCompletion(profile, avatarUrl);
  const next = result.items.find((x) => !x.done);
  const publicEligible = Number(profile?.years_experience || 0) >= PUBLIC_VA_MIN_EXPERIENCE;
  return <div className="card profile-strength-card">
    <div className="row-between"><div><span className="small muted">Profile strength</span><strong className="profile-strength-score">{result.score}%</strong></div><span className="badge">{result.items.filter((x) => x.done).length}/{result.items.length} complete</span></div>
    <div className="progress profile-strength-progress"><span style={{width:`${result.score}%`}}/></div>
    <div className={`profile-eligibility ${publicEligible ? "eligible" : ""}`}>{publicEligible ? <CheckCircle2 size={15}/> : <EyeOff size={15}/>}<span>{publicEligible ? "Meets the 2+ years public-directory experience requirement." : "Public discovery requires at least 2 years of experience."}</span></div>
    {next ? <Link className="btn btn-sm" href={next.href}>Next: {next.label}</Link> : <Link className="btn btn-sm" href="/workspace/va/profile/preview">Preview profile</Link>}
  </div>;
}
