import { JobWizard } from "@/components/job-wizard";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function starterBrief(needs: string) {
  const words = needs.toLowerCase();
  const ecommerce = /shopify|ecommerce|e-commerce|product|orders|inventory/.test(words);
  const support = /support|customer|email|inbox|tickets/.test(words);
  const admin = /calendar|admin|assistant|schedule|follow-up|follow up/.test(words);
  const category = ecommerce ? "Ecommerce" : support ? "Customer Support" : admin ? "Administrative Support" : "General Virtual Assistance";
  const skills = ecommerce
    ? "Ecommerce operations, Customer service, Data entry"
    : support
      ? "Customer service, Written communication, Problem solving"
      : admin
        ? "Administrative support, Calendar management, Inbox management"
        : "Administrative support, Communication, Research";
  const responsibilities = ecommerce
    ? "Maintain product listings\nRespond to customer questions\nKeep orders and inventory information current"
    : support
      ? "Respond to customer messages\nResolve routine requests and escalate exceptions\nKeep support records current"
      : admin
        ? "Manage calendars and scheduling\nOrganize inboxes and follow-ups\nPrepare weekly updates"
        : "Complete recurring administrative tasks\nMaintain accurate records\nEscalate questions and blockers";
  return {
    title: `${category} VA`,
    categories: category,
    summary: needs,
    description: `We need a reliable Virtual Assistant to help with: ${needs}. The right person will communicate clearly, keep work organized, and raise blockers early.`,
    responsibilities,
    required_skills: skills
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
    <div className="page-head client-role-editor-head"><div><h1>{fromPublicDraft ? "Review and post your job" : "Post a Virtual Assistant job"}</h1><p>{fromPublicDraft ? "Your public draft is saved on this device. Check the preview, make any final edits, then submit the role." : company?.can_self_publish_jobs ? "Your account can publish complete curated-placement roles directly to the public jobs directory. Managed-service roles still go through team review." : fromOnboarding?"We turned your onboarding answers into a starter job posting. Review it, change anything you want, then submit it to our recruiting team for publication review.":"Create your job posting with the role, hours, pay, timezone, and skills you need. We will review the posting and move it through the appropriate recruiting and publication flow."}</p></div></div>
    {requested?<div className="success-banner client-role-requested-banner" style={{marginBottom:18}}>Requested Virtual Assistant preserved: <strong>{requested.full_name}</strong>. This preference will stay attached to the hiring request.</div>:null}
    <div className="client-role-wizard-shell"><JobWizard initialData={initialData} initialStep={fromPublicDraft?2:fromOnboarding?2:0} requestedVaId={requested?.user_id} requestedVaName={requested?.full_name} canSelfPublishJobs={Boolean(company?.can_self_publish_jobs)}/></div>
  </div>;
}
