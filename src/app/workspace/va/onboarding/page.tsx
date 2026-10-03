import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import {
  completeVaQuickSetupAction,
  saveVaOnboardingBasicsAction,
  saveVaOnboardingWorkAction,
} from "@/app/actions/va-onboarding";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVaCompletion } from "@/lib/profile-completeness";
import { VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";

function requestedStep(value?: string) {
  const parsed = Number(value || "");
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 3 ? parsed : null;
}

export default async function VaOnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const [{ user, profile }, settings] = await Promise.all([requireRole("va"), getBusinessSettings()]);
  const supabase = await createClient();
  const { data: va } = await supabase.from("va_profiles").select("*").eq("user_id", user.id).maybeSingle();
  const completion = getVaCompletion(va, profile.avatar_url);

  const basicsDone = Boolean(
    va?.primary_category &&
    String(va?.headline || "").trim().length >= 8
  );
  const workDone = Boolean(
    va?.years_experience != null &&
    va?.weekly_hours != null &&
    va?.hourly_rate != null
  );

  let step = requestedStep(params.step) || (!basicsDone ? 1 : !workDone ? 2 : 3);
  if (!basicsDone) step = 1;
  else if (!workDone && step > 2) step = 2;

  const stepStatus = [
    { number: 1, label: "Specialty", done: basicsDone },
    { number: 2, label: "Work setup", done: workDone },
    { number: 3, label: "Ready for vetting", done: basicsDone && workDone },
  ];

  return <div className="va-quick-setup-page">
    <div className="page-head va-quick-setup-head va-onboarding-head">
      <div>
        <div className="kicker">VA quick setup</div>
        <h1>Build your profile in three saved steps</h1>
        <p>Each step saves before you continue. If you leave and come back, you will resume from the first unfinished step instead of starting over.</p>
      </div>
    </div>

    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}
    {params.saved ? <div className="success-banner" role="status"><strong>Step saved.</strong> Your progress is already stored.</div> : null}

    <div className="va-quick-setup-layout">
      <aside className="card va-quick-setup-progress va-onboarding-progress">
        <div className="row-between wrap">
          <div>
            <span className="small muted">Current profile strength</span>
            <h2>{completion.score}% complete</h2>
          </div>
          <span className="badge"><Sparkles size={13}/> Step {step} of 3</span>
        </div>

        <progress className="va-quick-setup-meter" value={step - 1} max={3} aria-label={`Quick setup step ${step} of 3`}>
          {step - 1} of 3
        </progress>

        <div className="va-quick-setup-step-list" aria-label="Quick setup checklist">
          {stepStatus.map((item) => <div className={`va-quick-setup-step ${item.done ? "is-done" : item.number === step ? "is-current" : ""}`} key={item.number}>
            <span>{item.done ? "✓" : item.number}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.number === 1 ? "Role and headline" : item.number === 2 ? "Experience, availability, and rate" : "Confirm and continue to vetting"}</small>
            </div>
          </div>)}
        </div>

        <div className="va-quick-setup-note">
          <strong>Your progress is protected</strong>
          <p>Finishing a step saves it immediately. You do not need to complete the entire setup in one session.</p>
        </div>
      </aside>

      <section className="card va-quick-setup-form-card va-onboarding-form-card">
        {step === 1 ? <>
          <div className="va-quick-setup-card-head">
            <span className="small">Step 1 · Specialty</span>
            <h2>What kind of VA work do you do?</h2>
            <p>Start with the two details recruiters use to understand your role. Saving this step immediately moves your profile above 0%.</p>
          </div>

          <form id="va-onboarding-step-1" action={saveVaOnboardingBasicsAction} className="va-quick-setup-form va-onboarding-form">
            <div className="field">
              <label htmlFor="quick-primary-category">Main VA specialty</label>
              <select id="quick-primary-category" name="primary_category" defaultValue={va?.primary_category || ""} required>
                <option value="" disabled>Choose your main specialty</option>
                {VA_CATEGORIES.map((category) => <option value={category} key={category}>{vaCategoryLabel(category)}</option>)}
              </select>
              <span className="field-help">Pick the closest match. Your profile can still belong to up to three relevant categories later.</span>
            </div>

            <div className="field">
              <label htmlFor="quick-headline">Professional headline</label>
              <input id="quick-headline" name="headline" minLength={8} maxLength={80} required defaultValue={va?.headline || ""} placeholder="SEO VA | Admin & Real Estate"/>
              <span className="field-help">Use the actual roles you can do. We use this together with skills and experience when classifying your profile.</span>
            </div>

            <div className="va-quick-setup-actions va-onboarding-actions">
              <button className="btn btn-primary btn-lg" type="submit">Save step 1 <ArrowRight size={16}/></button>
            </div>
          </form>
        </> : null}

        {step === 2 ? <>
          <div className="va-quick-setup-card-head">
            <span className="small">Step 2 · Work setup</span>
            <h2>Set your experience and availability</h2>
            <p>This step saves separately. Your rate is private operational information and is not published unless the product explicitly shows it.</p>
          </div>

          <form id="va-onboarding-step-2" action={saveVaOnboardingWorkAction} className="va-quick-setup-form va-onboarding-form">
            <div className="va-quick-setup-metrics">
              <div className="field">
                <label htmlFor="quick-years">Years of experience</label>
                <input id="quick-years" type="number" min="0" max="60" name="years_experience" required defaultValue={va?.years_experience ?? ""} placeholder="3"/>
              </div>
              <div className="field">
                <label htmlFor="quick-hours">Hours available/week</label>
                <input id="quick-hours" type="number" min="1" max="80" name="weekly_hours" required defaultValue={va?.weekly_hours ?? ""} placeholder="40"/>
              </div>
              <div className="field">
                <label htmlFor="quick-rate">Preferred hourly rate, USD</label>
                <input id="quick-rate" type="number" min={settings.minHourlyRate} max="1000" step="0.01" name="hourly_rate" required defaultValue={va?.hourly_rate ?? ""} placeholder="8.00"/>
              </div>
            </div>

            <div className="va-quick-setup-actions va-onboarding-actions">
              <Link className="btn btn-ghost" href="/workspace/va/onboarding?step=1"><ArrowLeft size={16}/> Back</Link>
              <button className="btn btn-primary btn-lg" type="submit">Save step 2 <ArrowRight size={16}/></button>
            </div>
          </form>
        </> : null}

        {step === 3 ? <>
          <div className="va-quick-setup-card-head">
            <span className="small">Step 3 · Ready for vetting</span>
            <h2>Your quick setup is ready.</h2>
            <p>We have enough professional information to continue. Sensitive personal details such as a home address are not required at this stage.</p>
          </div>

          <form id="va-onboarding-step-3" action={completeVaQuickSetupAction} className="va-quick-setup-form va-onboarding-form">
            <div className="info-banner"><ShieldCheck size={16}/><div><strong>What happens next</strong><p>Continue with your full profile, resume, skills test, video introduction, and recruiter review. We only collect additional sensitive information later when a confirmed placement or documented compliance need requires it.</p></div></div>
            <div className="va-quick-setup-actions va-onboarding-actions">
              <Link className="btn btn-ghost" href="/workspace/va/onboarding?step=2"><ArrowLeft size={16}/> Back</Link>
              <button className="btn btn-primary btn-lg" type="submit">Finish quick setup <ArrowRight size={16}/></button>
            </div>
          </form>
        </> : null}
      </section>
    </div>
  </div>;
}
