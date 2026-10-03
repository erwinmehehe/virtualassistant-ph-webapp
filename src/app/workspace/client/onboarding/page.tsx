import { ArrowRight, Building2, CheckCircle2, DollarSign, Target } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { completeClientOnboardingAction } from "@/app/actions/profile";
import { MIN_HOURLY_RATE } from "@/lib/constants";

export default async function ClientOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; budget_error?: string; budget_min?: string; budget_max?: string }> }){
  const params=await searchParams;
  const {user,profile}=await requireRole("client");
  const supabase=await createClient();
  const {data:company}=await supabase.from("client_profiles").select("*").eq("user_id",user.id).maybeSingle();
  const budgetError=params.budget_error === "invalid_range";
  const submittedBudgetMin=Number(params.budget_min);
  const submittedBudgetMax=Number(params.budget_max);
  const companyBudgetMin=Math.max(Number(company?.budget_min)||MIN_HOURLY_RATE,MIN_HOURLY_RATE);
  const companyBudgetMax=Math.max(Number(company?.budget_max)||10,companyBudgetMin);
  const budgetMinDefault=params.budget_min?.trim() && Number.isFinite(submittedBudgetMin) ? submittedBudgetMin : companyBudgetMin;
  const budgetMaxDefault=params.budget_max?.trim() && Number.isFinite(submittedBudgetMax) ? submittedBudgetMax : companyBudgetMax;

  return <div className="client-onboarding-page">
    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

    <header className="client-onboarding-hero">
      <div>
        <div className="kicker">Client setup</div>
        <h1>Tell us what you need. We’ll prepare the hiring brief.</h1>
        <p>This is a quick setup, not a second job-post form. Give us the outcome, your working timezone and a planning budget. You can refine everything on the next screen.</p>
      </div>
      <div className="client-onboarding-outcomes" aria-label="What happens next">
        <span><CheckCircle2 size={15}/> Brief prepared</span>
        <span><CheckCircle2 size={15}/> Recruiter screens</span>
        <span><CheckCircle2 size={15}/> You choose</span>
      </div>
    </header>

    <form action={completeClientOnboardingAction} className="client-onboarding-form client-onboarding-layout">
      <section className="card client-onboarding-step client-onboarding-main">
        <div className="client-onboarding-section-title">
          <div className="onboarding-step-icon"><Target size={20}/></div>
          <div><span className="small muted">Most important</span><h2>What should your VA take off your plate?</h2></div>
        </div>
        <p className="small muted">Write this in your own words. We use it to prefill the role title, specialty, skills and responsibilities.</p>
        <div className="pill-list onboarding-ideas client-onboarding-ideas" aria-label="Common hiring needs">
          <span>Admin & scheduling</span><span>Customer support</span><span>Sales / lead generation</span><span>Social media</span><span>Bookkeeping</span><span>E-commerce</span>
        </div>
        <div className="field client-onboarding-needs">
          <label>What would you like this person to handle?</label>
          <textarea name="hiring_needs" required minLength={20} maxLength={1200} defaultValue={company?.hiring_needs||company?.hiring_notes||""} placeholder="Example: Manage our Shopify inbox, keep product listings current, coordinate weekly promotions, and flag customer issues that need me."/>
          <span className="small muted">A few specific outcomes are better than a formal job description.</span>
        </div>

        <details className="client-onboarding-company-details" open={!company?.company_name||!company?.timezone}>
          <summary><Building2 size={16}/> Company details</summary>
          <div className="form-grid client-onboarding-company-grid">
            <div className="field"><label>Your name</label><input name="full_name" required minLength={2} maxLength={100} defaultValue={profile.full_name||""}/></div>
            <div className="field"><label>Company name</label><input name="company_name" required minLength={2} maxLength={140} defaultValue={company?.company_name||""}/></div>
            <div className="field"><label>Timezone / working region</label><input name="timezone" required placeholder="Australia/Sydney, US Eastern, GMT+8" defaultValue={company?.timezone||""}/></div>
            <div className="field"><label>Company or team location <span className="muted">(optional)</span></label><input name="location" defaultValue={company?.location||""} placeholder="Sydney, Australia"/></div>
          </div>
        </details>
      </section>

      <aside className="client-onboarding-side">
        <section className="card client-onboarding-step client-onboarding-budget">
          <div className="client-onboarding-section-title compact">
            <div className="onboarding-step-icon"><DollarSign size={19}/></div>
            <div><span className="small muted">Planning range</span><h2>VA budget</h2></div>
          </div>
          <div className="grid-2 client-onboarding-budget-grid">
            <div className="field"><label htmlFor="client-onboarding-budget-min">Min USD/hr</label><input id="client-onboarding-budget-min" type="number" name="budget_min" min={MIN_HOURLY_RATE} step="0.5" required defaultValue={budgetMinDefault} aria-invalid={Boolean(budgetError)} aria-describedby={budgetError ? "client-onboarding-budget-error" : undefined}/></div>
            <div className="field"><label htmlFor="client-onboarding-budget-max">Max USD/hr</label><input id="client-onboarding-budget-max" type="number" name="budget_max" min={MIN_HOURLY_RATE} step="0.5" required defaultValue={budgetMaxDefault} aria-invalid={Boolean(budgetError)} aria-describedby={budgetError ? "client-onboarding-budget-error" : undefined}/></div>
          </div>
          {budgetError ? <p id="client-onboarding-budget-error" className="field-error" role="alert">Enter a valid hiring budget range. The minimum is ${MIN_HOURLY_RATE}/hr, and the maximum cannot be lower than the minimum.</p> : null}
          <p className="small muted">Planning only. Each hiring request can use its own rate range.</p>
        </section>

        <section className="card client-onboarding-next">
          <strong>Next: review your prepared brief</strong>
          <p>We’ll carry these answers into the new-job flow so you are editing a draft, not starting again.</p>
          <div className="client-onboarding-next-steps">
            <span><Building2 size={14}/> Company prefilled</span>
            <span><Target size={14}/> Role draft generated</span>
            <span><DollarSign size={14}/> Budget carried over</span>
          </div>
        </section>
      </aside>

      <div className="card onboarding-finish client-onboarding-finish">
        <div><strong>Ready?</strong><p className="small muted">Save this setup and review the role before anything is submitted.</p></div>
        <button className="btn btn-primary btn-lg" type="submit">Prepare my hiring brief <ArrowRight size={17}/></button>
      </div>
    </form>
  </div>;
}
