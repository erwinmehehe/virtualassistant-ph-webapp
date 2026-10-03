import Link from "next/link";
import { JobWizard } from "@/components/job-wizard";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { suggestJobDraft } from "@/lib/job-draft-suggestions";

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
    .select("company_name,timezone,hiring_needs,budget_min,budget_max,can_self_publish_jobs")
    .eq("user_id",user.id)
    .maybeSingle();
  const {data:requested}=params.talent
    ? await supabase.from("public_va_directory").select("user_id,slug,full_name,primary_category").eq("slug",params.talent).maybeSingle()
    : {data:null};

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
        <p>{fromPublicDraft
          ? "Check the role, schedule and budget below. You can edit anything before you submit."
          : company?.can_self_publish_jobs
            ? "Describe the work, set the schedule and budget, then review the public job before it goes live."
            : fromOnboarding
              ? "We used your onboarding answers to prepare a starter brief. Review it, adjust anything you want, then send it to your recruiter."
              : "Start with the work you need handled. We will help turn it into a clear brief your recruiter can actually hire against."}</p>
      </div>
      <div className="client-role-editor-meta" aria-label="Hiring request form details">
        <span><strong>3</strong> short steps</span>
        <span><strong>Auto</strong> saved</span>
        <span><strong>Recruiter</strong> supported</span>
      </div>
    </div>
    {requested?<div className="success-banner client-role-requested-banner"><strong>{requested.full_name}</strong> is attached as your preferred VA. Your recruiter will keep that preference with this role.</div>:null}
    <div className="client-role-wizard-shell"><JobWizard initialData={initialData} initialStep={fromPublicDraft?2:fromOnboarding?2:0} requestedVaId={requested?.user_id} requestedVaName={requested?.full_name} canSelfPublishJobs={Boolean(company?.can_self_publish_jobs)}/></div>
  </div>;
}
