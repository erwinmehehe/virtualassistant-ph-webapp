import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { completeVaQuickSetupAction } from "@/app/actions/va-onboarding";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getVaCompletion } from "@/lib/profile-completeness";
import { MIN_HOURLY_RATE, VA_CATEGORIES, vaCategoryLabel } from "@/lib/constants";

export default async function VaOnboardingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { user, profile } = await requireRole("va");
  const supabase = await createClient();
  const { data: va } = await supabase.from("va_profiles").select("*").eq("user_id", user.id).maybeSingle();
  const completion = getVaCompletion(va, profile.avatar_url);

  return <>
    <div className="page-head">
      <div>
        <div className="kicker">VA quick setup</div>
        <h1>Start with the details recruiters need first</h1>
        <p>This short step takes about two minutes. Save the essentials now, then complete your photo, summary, skills, tools, and resume in the full profile.</p>
      </div>
      <Link className="btn" href="/workspace/va/profile">Open full profile</Link>
    </div>

    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}

    <div className="grid-2">
      <section className="card">
        <div className="row-between wrap">
          <div><span className="small muted">Current profile strength</span><h2 style={{ margin: "4px 0 0" }}>{completion.score}% complete</h2></div>
          <span className="badge"><Sparkles size={13}/> Step 1 of 2</span>
        </div>
        <div className="progress" aria-label={`Profile ${completion.score}% complete`} style={{ marginTop: 12 }}><span style={{ width: `${completion.score}%` }}/></div>
        <div className="stack" style={{ marginTop: 18 }}>
          <div className="row"><CheckCircle2 size={17}/><span>Choose your main VA specialty</span></div>
          <div className="row"><CheckCircle2 size={17}/><span>Add your experience and availability</span></div>
          <div className="row"><CheckCircle2 size={17}/><span>Set a realistic preferred hourly rate</span></div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Quick setup</h2>
        <form action={completeVaQuickSetupAction} className="stack">
          <div className="field">
            <label htmlFor="quick-primary-category">What type of VA are you?</label>
            <select id="quick-primary-category" name="primary_category" defaultValue={va?.primary_category || ""} required>
              <option value="" disabled>Choose your main specialty</option>
              {VA_CATEGORIES.map((category) => <option value={category} key={category}>{vaCategoryLabel(category)}</option>)}
            </select>
            <span className="field-help">Pick the closest match. You can add up to three additional specialties in the full profile.</span>
          </div>
          <div className="field">
            <label htmlFor="quick-headline">Professional headline</label>
            <input id="quick-headline" name="headline" minLength={8} maxLength={80} required defaultValue={va?.headline || ""} placeholder="Social Media VA | Content & Community"/>
          </div>
          <div className="form-grid">
            <div className="field"><label htmlFor="quick-years">Years of experience</label><input id="quick-years" type="number" min="0" max="60" name="years_experience" required defaultValue={va?.years_experience ?? ""}/></div>
            <div className="field"><label htmlFor="quick-hours">Hours available/week</label><input id="quick-hours" type="number" min="1" max="80" name="weekly_hours" required defaultValue={va?.weekly_hours ?? ""}/></div>
            <div className="field"><label htmlFor="quick-rate">Preferred hourly rate, USD</label><input id="quick-rate" type="number" min={MIN_HOURLY_RATE} max="1000" step="0.01" name="hourly_rate" required defaultValue={va?.hourly_rate ?? ""}/></div>
          </div>
          <button className="btn btn-primary btn-lg" type="submit">Save and continue <ArrowRight size={16}/></button>
          <span className="small muted">Next you will add your photo, professional summary, skills, tools, and resume. You can save that page in stages.</span>
        </form>
      </section>
    </div>
  </>;
}