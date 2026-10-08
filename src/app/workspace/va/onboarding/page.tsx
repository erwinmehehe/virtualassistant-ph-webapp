import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
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
  const { data: va, error: profileError } = await supabase.from("va_profiles").select("*").eq("user_id", user.id).maybeSingle();
  if (profileError) {
    // Failed reads must not turn a saved onboarding profile into a blank form.
    return <main className="va-quick-setup-page"><section className="card stack" role="alert"><h1>We couldn't load your saved progress.</h1><p>Your existing setup may still be saved. Reload the page before entering anything new.</p><div className="row wrap"><a className="btn btn-primary" href="/workspace/va/onboarding">Reload setup</a><Link className="btn" href="/workspace/va">Back to workspace</Link></div></section></main>;
  }
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
    { number: 1, label: "Specialty", detail: "Role and headline", done: basicsDone },
    { number: 2, label: "Experience & availability", detail: "Experience, hours, and rate", done: workDone },
    { number: 3, label: "Review & finish", detail: "Confirm your profile", done: false },
  ];

  return <div className="va-quick-setup-page">
    <div className="page-head va-quick-setup-head va-onboarding-head">
      <div>
        <div className="kicker">VA profile setup</div>
        <h1>Build a profile recruiters can understand quickly</h1>
        <p>Complete the essentials in three short steps. Every change saves before you move on, so you can leave and return without starting over.</p>
      </div>
    </div>

    {params.error ? <div className="alert va-onboarding-alert" role="alert">{params.error}</div> : null}
    {params.saved ? <div className="success-banner va-onboarding-saved" role="status"><CheckCircle2 size={17}/><div><strong>Saved.</strong><span>Your changes are already stored.</span></div></div> : null}

    <div className="va-quick-setup-layout">
      <aside className="card va-quick-setup-progress va-onboarding-progress">
        <div className="va-onboarding-progress-top">
          <div>
            <span className="small muted">Profile completion</span>
            <h2>{completion.score}%</h2>
          </div>
          <span className="badge"><Sparkles size={13}/> Step {step} of 3</span>
        </div>

        <progress className="va-quick-setup-meter" value={completion.score} max={100} aria-label={"Profile " + completion.score + "% complete"}>
          {completion.score}%
        </progress>

        <div className="va-quick-setup-step-list" aria-label="Profile setup steps">
          {stepStatus.map((item) => <div className={"va-quick-setup-step " + (item.done ? "is-done" : item.number === step ? "is-current" : "")} key={item.number}>
            <span>{item.done ? "✓" : item.number}</span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.detail}</small>
            </div>
          </div>)}
        </div>

        <div className="va-quick-setup-note">
          <ShieldCheck size={16}/>
          <div>
            <strong>Your progress is protected</strong>
            <p>Each step saves separately. You do not need to finish everything in one session.</p>
          </div>
        </div>
      </aside>

      <section className="card va-quick-setup-form-card va-onboarding-form-card">
        {step === 1 ? <>
          <div className="va-quick-setup-card-head">
            <div className="va-onboarding-step-kicker">Step 1 of 3</div>
            <h2>Choose your specialty</h2>
            <p>Give recruiters a clear role and headline first. You can add more skills and categories from your full profile later.</p>
          </div>

          <form id="va-onboarding-step-1" action={saveVaOnboardingBasicsAction} className="va-quick-setup-form va-onboarding-form">
            <div className="field">
              <label htmlFor="quick-primary-category">Main VA specialty</label>
              <select id="quick-primary-category" name="primary_category" defaultValue={va?.primary_category || ""} required>
                <option value="" disabled>Choose your main specialty</option>
                {VA_CATEGORIES.map((category) => <option value={category} key={category}>{vaCategoryLabel(category)}</option>)}
              </select>
              <span className="field-help">Choose the closest match to the work you want recruiters to consider you for.</span>
            </div>

            <div className="field">
              <label htmlFor="quick-headline">Professional headline</label>
              <input id="quick-headline" name="headline" minLength={8} maxLength={80} required defaultValue={va?.headline || ""} placeholder="SEO VA | WordPress & Content"/>
              <span className="field-help">Keep it specific and role-based. Example: SEO VA | WordPress & Content.</span>
            </div>

            <div className="va-quick-setup-actions va-onboarding-actions">
              <span className="va-onboarding-action-note">You can edit this later from your profile.</span>
              <button className="btn btn-primary btn-lg" type="submit">Save & continue <ArrowRight size={16}/></button>
            </div>
          </form>
        </> : null}

        {step === 2 ? <>
          <div className="va-quick-setup-card-head">
            <div className="va-onboarding-step-kicker">Step 2 of 3</div>
            <h2>Experience & availability</h2>
            <p>Tell recruiters how experienced you are, how much capacity you have, and the rate you want to be considered for.</p>
          </div>

          <form id="va-onboarding-step-2" action={saveVaOnboardingWorkAction} className="va-quick-setup-form va-onboarding-form">
            <div className="va-quick-setup-metrics">
              <div className="field va-onboarding-metric-field">
                <label htmlFor="quick-years">Years of experience</label>
                <input id="quick-years" type="number" min="0" max="60" name="years_experience" required defaultValue={va?.years_experience ?? ""} placeholder="3"/>
                <span className="field-help">Total relevant professional experience.</span>
              </div>
              <div className="field va-onboarding-metric-field">
                <label htmlFor="quick-hours">Hours available per week</label>
                <input id="quick-hours" type="number" min="1" max="80" name="weekly_hours" required defaultValue={va?.weekly_hours ?? ""} placeholder="40"/>
                <span className="field-help">Your realistic weekly capacity right now.</span>
              </div>
              <div className="field va-onboarding-metric-field">
                <div className="va-rate-label">
                  <label htmlFor="quick-rate">Preferred hourly rate</label>
                  <span>Private</span>
                </div>
                <div className="va-rate-input">
                  <span>$</span>
                  <input id="quick-rate" type="number" min={settings.minHourlyRate} max="1000" step="0.50" name="hourly_rate" required defaultValue={va?.hourly_rate ?? ""} placeholder={settings.minHourlyRate.toFixed(2)}/>
                  <small>USD/hr</small>
                </div>
                <span className="field-help">Minimum accepted rate is USD {settings.minHourlyRate.toFixed(2)}/hr. This is not shown publicly.</span>
              </div>
            </div>

            <div className="va-onboarding-privacy-note">
              <ShieldCheck size={17}/>
              <div><strong>Your rate stays private.</strong><span>Recruiters use it to match you with roles that fit your expectations.</span></div>
            </div>

            <div className="va-quick-setup-actions va-onboarding-actions">
              <Link className="btn btn-ghost" href="/workspace/va/onboarding?step=1"><ArrowLeft size={16}/> Back</Link>
              <button className="btn btn-primary btn-lg" type="submit">Save & continue <ArrowRight size={16}/></button>
            </div>
          </form>
        </> : null}

        {step === 3 ? <>
          <div className="va-quick-setup-card-head">
            <div className="va-onboarding-step-kicker">Step 3 of 3</div>
            <h2>Review and finish</h2>
            <p>Check the essentials recruiters will use to understand your profile. Nothing here asks for your private home address.</p>
          </div>

          <div className="va-onboarding-review-grid">
            <div><span>Specialty</span><strong>{vaCategoryLabel(va?.primary_category)}</strong></div>
            <div><span>Professional headline</span><strong>{va?.headline || "Not set"}</strong></div>
            <div><span>Experience</span><strong>{va?.years_experience ?? 0} years</strong></div>
            <div><span>Availability</span><strong>{va?.weekly_hours ?? 0} hrs/week</strong></div>
            <div><span>Preferred rate</span><strong>USD {Number(va?.hourly_rate || 0).toFixed(2)}/hr</strong><small>Private</small></div>
          </div>

          <form id="va-onboarding-step-3" action={completeVaQuickSetupAction} className="va-quick-setup-form va-onboarding-form">
            <div className="va-onboarding-ready-note">
              <CheckCircle2 size={19}/>
              <div><strong>Your essentials are ready.</strong><span>Finish setup to continue to your VA workspace. You can complete the rest of your profile anytime.</span></div>
            </div>

            <div className="va-quick-setup-actions va-onboarding-actions">
              <Link className="btn btn-ghost" href="/workspace/va/onboarding?step=2"><ArrowLeft size={16}/> Back</Link>
              <button className="btn btn-primary btn-lg" type="submit">Finish setup <ArrowRight size={16}/></button>
            </div>
          </form>
        </> : null}
      </section>
    </div>
  </div>;
}
