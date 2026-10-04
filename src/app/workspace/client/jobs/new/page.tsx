import { JobWizard } from "@/components/job-wizard";
import { CheckCircle2, FileText, ShieldCheck, Sparkles } from "lucide-react";
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

  const heroTitle = fromPublicDraft ? "Review and post your job" : "Post a Virtual Assistant job";
  const heroCopy = fromPublicDraft
    ? "Your draft is already saved. Review the posting, make any final edits, then submit it from your client workspace."
    : fromOnboarding
      ? "We turned your hiring answers into a starter posting. Review the role, confirm schedule and pay, then submit it."
      : "Describe the work first. We’ll help shape the title, specialty, skills, schedule, and final job posting.";

  return <div className="client-role-editor client-role-new">
    <section className="client-job-create-hero">
      <div className="client-job-create-copy">
        <span className="client-job-create-eyebrow"><Sparkles size={14}/> Create a role</span>
        <h1>{heroTitle}</h1>
        <p>{heroCopy}</p>
        <div className="client-job-create-proof">
          <span><FileText size={14}/><strong>3 simple steps</strong></span>
          <span><CheckCircle2 size={14}/><strong>Draft autosaves</strong></span>
          <span><ShieldCheck size={14}/><strong>Vetted VAs only</strong></span>
        </div>
      </div>
      <div className="client-job-create-note">
        <span>What happens after you submit?</span>
        <strong>{company?.can_self_publish_jobs ? "Eligible roles can publish directly." : "Your recruiting team reviews the role first."}</strong>
        <p>Applicant contact details stay private and hiring activity stays inside your workspace.</p>
      </div>
    </section>

    {requested?<div className="success-banner client-role-requested-banner">Requested Virtual Assistant preserved: <strong>{requested.full_name}</strong>. This preference will stay attached to the hiring request.</div>:null}

    <div className="client-role-wizard-shell">
      <JobWizard initialData={initialData} initialStep={fromPublicDraft?2:fromOnboarding?2:0} requestedVaId={requested?.user_id} requestedVaName={requested?.full_name} canSelfPublishJobs={Boolean(company?.can_self_publish_jobs)}/>
    </div>
  </div>;
}
