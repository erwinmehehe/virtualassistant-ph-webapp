import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { completeVaQuickSetupAction } from "@/app/actions/va-onboarding";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVaCompletion } from "@/lib/profile-completeness";
import { VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";

export default async function VaOnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const [{ user, profile }, settings] = await Promise.all([requireRole("va"), getBusinessSettings()]);
  const supabase = await createClient();
  const { data: va } = await supabase.from("va_profiles").select("*").eq("user_id", user.id).maybeSingle();
  const completion = getVaCompletion(va, profile.avatar_url);

  return <div className="va-quick-setup-page">
    <div className="page-head va-quick-setup-head">
      <div>
        <div className="kicker">VA quick setup</div>
        <h1>Start with the details recruiters need first</h1>
        <p>Save the essentials in about two minutes. Your dashboard will guide you through the remaining profile details one step at a time.</p>
      </div>
    </div>

    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

    <div className="va-quick-setup-layout">
      <aside className="card va-quick-setup-progress">
        <div className="row-between wrap">
          <div>
            <span className="small muted">Current profile strength</span>
            <h2>{completion.score}% complete</h2>
          </div>
          <span className="badge"><Sparkles size={13}/> Step 1</span>
        </div>

        <div className="progress" aria-label={`Profile ${completion.score}% complete`}>
          <span style={{ width: `${completion.score}%` }}/>
        </div>

        <div className="va-quick-setup-step-list" aria-label="Quick setup checklist">
          <div className="va-quick-setup-step">
            <span>1</span>
            <div><strong>Choose your main specialty</strong><small>Tell recruiters the kind of work you want to be matched with.</small></div>
          </div>
          <div className="va-quick-setup-step">
            <span>2</span>
            <div><strong>Add experience and availability</strong><small>Give recruiters a fast read on your seniority and weekly capacity.</small></div>
          </div>
          <div className="va-quick-setup-step">
            <span>3</span>
            <div><strong>Set your preferred hourly rate</strong><small>Use the rate you would realistically accept for the right client.</small></div>
          </div>
        </div>

        <div className="va-quick-setup-note">
          <strong>What happens next</strong>
          <p>Your dashboard will show the next missing profile item instead of sending you through one long form.</p>
        </div>
      </aside>

      <section className="card va-quick-setup-form-card">
        <div className="va-quick-setup-card-head">
          <span className="small">Quick setup</span>
          <h2>Tell recruiters how you work</h2>
          <p>Keep this concise. You can add your photo, summary, tools, resume, and work-readiness evidence after saving.</p>
        </div>

        <form action={completeVaQuickSetupAction} className="va-quick-setup-form">
          <div className="field">
            <label htmlFor="quick-primary-category">Main VA specialty</label>
            <select id="quick-primary-category" name="primary_category" defaultValue={va?.primary_category || ""} required>
              <option value="" disabled>Choose your main specialty</option>
              {VA_CATEGORIES.map((category) => <option value={category} key={category}>{vaCategoryLabel(category)}</option>)}
            </select>
            <span className="field-help">Pick the closest match. You can add up to three additional specialties later.</span>
          </div>

          <div className="field">
            <label htmlFor="quick-headline">Professional headline</label>
            <input id="quick-headline" name="headline" minLength={8} maxLength={80} required defaultValue={va?.headline || ""} placeholder="Social Media VA | Content & Community"/>
            <span className="field-help">Use a short role-focused headline that a recruiter can understand at a glance.</span>
          </div>

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

          <div className="va-quick-setup-actions">
            <button className="btn btn-primary btn-lg" type="submit">Save quick setup <ArrowRight size={16}/></button>
            <Link className="btn btn-ghost" href="/workspace/va/profile">Open full profile</Link>
          </div>
        </form>
      </section>
    </div>
  </div>;
}
