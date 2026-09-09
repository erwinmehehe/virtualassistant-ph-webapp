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
    .select("company_name,timezone,hiring_needs,budget_min,budget_max")
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

  return <>
    <div className="page-head"><div><h1>Start a hiring request</h1><p>{fromOnboarding?"We turned your onboarding answers into a starter brief. Review it, change anything you want, then send it to our recruiting team.":"Tell us what you need. We will turn it into a clear hiring brief, review the commercial terms with you, and recruit the strongest matches."}</p></div></div>
    {requested?<div className="success-banner" style={{marginBottom:18}}>Requested Virtual Assistant preserved: <strong>{requested.full_name}</strong>. This preference will stay attached to the hiring request.</div>:null}
    <JobWizard initialData={initialData} initialStep={fromOnboarding?3:0} requestedVaId={requested?.user_id} requestedVaName={requested?.full_name}/>
  </>;
}
