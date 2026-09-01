import { JobWizard } from "@/components/job-wizard";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function NewJobPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const params=await searchParams;const {user}=await requireRole("client");const supabase=await createClient();
  const {data:company}=await supabase.from("client_profiles").select("company_name,timezone").eq("user_id",user.id).maybeSingle();
  const {data:requested}=params.talent?await supabase.from("public_va_directory").select("user_id,slug,full_name,primary_category").eq("slug",params.talent).maybeSingle():{data:null};
  const initialData={company_name:company?.company_name||"",timezone:company?.timezone||"",categories:requested?.primary_category||""};
  return <><div className="page-head"><div><h1>Post a Job</h1><p>Tell us what you need in four guided steps. The role goes live as soon as you publish it, so approved VAs can see it and apply, and our recruiting team matches candidates alongside that.</p></div></div>{requested?<div className="success-banner" style={{marginBottom:18}}>Requested VA preserved: <strong>{requested.full_name}</strong>. This preference will stay attached to the job you create.</div>:null}<JobWizard initialData={initialData} requestedVaId={requested?.user_id} requestedVaName={requested?.full_name}/></>}
