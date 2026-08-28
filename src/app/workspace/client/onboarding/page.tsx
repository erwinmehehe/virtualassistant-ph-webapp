import { ArrowRight, Building2, DollarSign, Target } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { completeClientOnboardingAction } from "@/app/actions/profile";

export default async function ClientOnboardingPage(){
  const {user,profile}=await requireRole("client");
  const supabase=await createClient();
  const {data:company}=await supabase.from("client_profiles").select("*").eq("user_id",user.id).maybeSingle();
  return <>
    <div className="onboarding-hero card"><span className="badge badge-success">Welcome to your hiring workspace</span><h1>Tell us what you are hiring for.</h1><p>Three quick details turn the workspace into a useful hiring dashboard. You can edit everything later.</p></div>
    <form action={completeClientOnboardingAction} className="client-onboarding-grid">
      <section className="card onboarding-step-card"><div className="onboarding-step-icon"><Building2 size={20}/></div><span className="small muted">Step 1</span><h2>Your company</h2><div className="field"><label>Your name</label><input name="full_name" required minLength={2} maxLength={100} defaultValue={profile.full_name||""}/></div><div className="field"><label>Company name</label><input name="company_name" required minLength={2} maxLength={140} defaultValue={company?.company_name||""}/></div><div className="field"><label>Timezone</label><input name="timezone" required placeholder="Australia/Sydney, US Eastern, GMT+8" defaultValue={company?.timezone||""}/></div></section>
      <section className="card onboarding-step-card"><div className="onboarding-step-icon"><Target size={20}/></div><span className="small muted">Step 2</span><h2>Hiring needs</h2><div className="field"><label>What do you want the VA to own?</label><textarea name="hiring_needs" required minLength={20} maxLength={1200} defaultValue={company?.hiring_needs||company?.hiring_notes||""} placeholder="Example: inbox and calendar management, customer follow-up, weekly reporting..."/></div><div className="field"><label>Company or team location</label><input name="location" defaultValue={company?.location||""} placeholder="Sydney, Australia"/></div></section>
      <section className="card onboarding-step-card"><div className="onboarding-step-icon"><DollarSign size={20}/></div><span className="small muted">Step 3</span><h2>Budget</h2><div className="grid-2"><div className="field"><label>Min USD/hr</label><input type="number" name="budget_min" min="5" step="0.5" required defaultValue={company?.budget_min||5}/></div><div className="field"><label>Max USD/hr</label><input type="number" name="budget_max" min="5" step="0.5" required defaultValue={company?.budget_max||10}/></div></div><p className="small muted">This is planning context, not a public offer. Each job post can use its own rate range.</p></section>
      <div className="card onboarding-finish"><div><strong>Ready to hire?</strong><p className="small muted">Save these details and continue straight into the four-step job-post wizard.</p></div><button className="btn btn-primary btn-lg" type="submit">Post your first job <ArrowRight size={17}/></button></div>
    </form>
  </>;
}
