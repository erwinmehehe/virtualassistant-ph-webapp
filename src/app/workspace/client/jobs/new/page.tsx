import Link from "next/link";
import { JobWizard } from "@/components/job-wizard";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { suggestJobDraft } from "@/lib/job-draft-suggestions";
import { clientCanSelfPublishJob } from "@/lib/job-publication";

function starterBrief(needs: string) {
  const suggested = suggestJobDraft(needs);
  return {
    title: suggested.title,
    categories: suggested.category,
    summary: needs,
    description: `We need a reliable Virtual Assistant to help with: ${needs}. The right person will communicate clearly, keep work organized, and raise blockers early.`,
    responsibilities: suggested.responsibilities,
    required_skills: suggested.skills,
  };
}

export default async function NewJobPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;
  const {user}=await requireRole("client");
  const supabase=await createClient();
  const {data:company}=await supabase
    .from("client_profiles")
    .select("company_name,timezone,hiring_needs,budget_min,budget_max")
    .eq("user_id",user.id)
    .maybeSingle();
  const {data:requested}=params.talent
    ? await supabase.from("public_va_directory").select("user_id,slug,full_name,primary_category").eq("slug",params.talent).maybeSingle()
    : {data:null};

  const canSelfPublishJobs = clientCanSelfPublishJob({ emailVerified: Boolean(user.email_confirmed_at) });
  const needs=String(company?.hiring_needs||"").trim();
  const starter=needs?starterBrief(needs):{};
  const initialData={
    ...starter,
    company_name:company?.company_name||"",
    timezone:company?.timezone||"",
    categories:requested?.primary_category||(starter as any).categories||"",
    min_hourly_rate:company?.budget_min?String(company.budget_min):undefined,
    max_hourly_rate:company?.budget_max?String(company.budget_max):undefined
  };
  const fromOnboarding=params.onboarded==="1"&&Boolean(needs);
  const fromPublicDraft=params.from_post==="1";

  return <div className="client-role-editor client-role-new">
    <div className="client-role-editor-intro">
      <div>
        <Link className="text-link small" href="/workspace/client/jobs">← Hiring requests</Link>
        <div className="kicker" style={{marginTop:10}}>{fromPublicDraft ? "Final review" : "Post a Virtual Assistant job"}</div>
        <h1>{fromPublicDraft ? "Review and post your job" : "Tell us who you need"}</h1>
        <p className="small muted">Public job listings display your company name. You can control which additional company details appear in <Link className="text-link" href="/workspace/client/company">Company profile</Link>.</p>
        <p>{fromPublicDraft
          ? "Check the role, schedule and budget below. You can edit anything before you submit."
          : canSelfPublishJobs
            ? "Complete your role details and publish immediately. Recruiting and commercial terms are separate."
            : fromOnboarding
              ? "Review the starter brief, then verify your email and publish your completed job."
              : "Describe your role, verify your email, and publish without a recruiter approval step."}</p>
      </div>
      <div className="client-role-editor-meta" aria-label="Hiring request form details">
        <span><strong>3</strong> short steps</span>
        <span><strong>Device</strong> draft</span>
        <span><strong>Recruiter</strong> supported</span>
      </div>
    </div>
    {requested?<div className="success-banner client-role-requested-banner"><strong>{requested.full_name}</strong> is attached as your preferred VA. Your recruiter will keep that preference with this role.</div>:null}
    <div className="client-role-wizard-shell"><JobWizard initialData={initialData} initialStep={fromPublicDraft?2:fromOnboarding?2:0} requestedVaId={requested?.user_id} requestedVaName={requested?.full_name} canSelfPublishJobs={canSelfPublishJobs} draftScope={user.id} importPublicDraft={fromPublicDraft}/></div>
  </div>;
}
