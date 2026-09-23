import Link from "next/link";
import { Clock3, Eye, ShieldCheck } from "lucide-react";
import { requireRoleFast } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateVaProfileAction } from "@/app/actions/profile";
import { confirmVaAvailabilityAction } from "@/app/actions/agency-operations-v2";
import { updateVaPublicProfileConsentAction } from "@/app/actions/privacy-consent";
import { LiveProfileStrength } from "@/components/live-profile-strength";
import { ResumeAutoFill } from "@/components/resume-autofill";
import { VA_CATEGORIES } from "@/lib/constants";
import { getBusinessSettings } from "@/lib/business-settings";
import { PUBLIC_PROFILE_CONSENT_VERSION } from "@/lib/privacy-consent";

function availabilityAge(value?:string|null){
  if(!value)return{label:"Not yet confirmed",stale:true};
  const days=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/86400000));
  return{label:days===0?"Confirmed today":days===1?"Confirmed 1 day ago":`Confirmed ${days} days ago`,stale:days>=14};
}

export default async function VaProfilePage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const params = await searchParams;
  const [{ userId, profile },settings] = await Promise.all([requireRoleFast("va"),getBusinessSettings()]);
  const supabase = await createClient();
  const { data: va } = await supabase.from("va_profiles").select("*").eq("user_id", userId).single();
  const consentGranted = Boolean(va?.public_profile_consent);
  const consentDate = va?.public_profile_consent_at ? new Date(va.public_profile_consent_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : null;
  const freshness=availabilityAge(va?.availability_confirmed_at);
  const canConfirm=va?.availability_status==="available"&&Boolean(va?.weekly_hours)&&Boolean(va?.schedule)&&Boolean(va?.hourly_rate);

  return <>
    {params.error ? <div className="alert" role="alert">{params.error}</div> : null}
    {params.saved ? <div className="success-banner" role="status">Profile saved successfully.</div> : null}
    {params.availability_confirmed ? <div className="success-banner" role="status">Availability confirmed. Recruiters can rely on your current hours, schedule, and rate for the next matching cycle.</div> : null}
    {params.consent === "granted" ? <div className="success-banner" role="status">Public profile consent saved. Your profile can appear publicly once all eligibility and approval requirements are met.</div> : null}
    {params.consent === "withdrawn" ? <div className="success-banner" role="status">Public profile consent withdrawn. Your profile is no longer eligible to appear in the public directory.</div> : null}
    <div className="page-head va-profile-head"><div><h1>Your profile</h1><p>Keep your experience, availability, rate, and work preferences current.</p></div><Link className="btn btn-sm" href="/workspace/va/profile/preview" target="_blank"><Eye size={16}/> Preview</Link></div>
    <ResumeAutoFill formId="va-profile-form" />
    <div className="profile-editor-layout">
      <div className="stack">
        <form id="va-profile-form" action={updateVaProfileAction} className="stack profile-editor-form" encType="multipart/form-data">
          <input type="hidden" name="directory_visible" value={va?.directory_visible ? "on" : ""}/>
          <section className="profile-section profile-section-flat" id="basics"><div className="profile-section-head profile-section-head-simple"><div><h2>Basics</h2><p>Name, headline, summary, and profile photo.</p></div></div><div className="form-grid"><div className="field"><label>Full legal name <span className="muted">(private)</span></label><input name="full_name" defaultValue={profile.full_name || ""} required/><span className="field-help">Public pages show first name + last initial only.</span></div><div className="field"><label>Professional headline</label><input name="headline" defaultValue={va?.headline || ""} placeholder="Executive Assistant · Operations · Customer Support"/></div><div className="field span-2"><label>Professional summary</label><textarea name="bio" defaultValue={va?.bio || ""} placeholder="What work do you do best? Which clients have you supported? What outcomes can you own?"/><span className="field-help">Aim for 80–220 words focused on outcomes, not a list of tools.</span></div><div className="field span-2"><label>Profile photo <span className="muted">JPG/PNG/WEBP, max 3 MB</span></label>{profile.avatar_url ? <img src={profile.avatar_url} alt="Current profile photo" style={{width:64,height:64,borderRadius:"50%",objectFit:"cover",display:"block",marginBottom:8}}/> : null}<input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" required={!profile.avatar_url}/><span className="field-help">{profile.avatar_url ? "Replace your current photo at any time." : "Required before your VA profile can be completed or published."}</span><span className="field-help">Shown next to your name on your public profile and in the talent directory only if you separately opt in below.</span></div></div></section>

          <section className="profile-section profile-section-flat" id="expertise"><div className="profile-section-head profile-section-head-simple"><div><h2>Experience and skills</h2><p>Your specialty, skills, tools, and work history.</p></div></div><div className="form-grid"><div className="field"><label>Primary specialty</label><select name="primary_category" defaultValue={va?.primary_category || ""}><option value="">Choose a specialty</option>{VA_CATEGORIES.map((x, index) => <option key={`${String(x)}-${index}`}>{x}</option>)}</select><span className="field-help">Choose the type of work you do best.</span></div><div className="field"><label>Years of professional experience</label><input type="number" min="0" max="60" name="years_experience" defaultValue={va?.years_experience ?? ""}/><span className="field-help">Public discovery requires at least 2 years.</span></div><div className="field span-2"><label>Additional specialties <span className="muted">(up to 3)</span></label><input name="categories" defaultValue={(va?.categories || []).join(", ")} placeholder="Customer Service, Ecommerce"/></div><div className="field span-2"><label>Core skills</label><input name="skills" defaultValue={(va?.skills || []).join(", ")} placeholder="Calendar management, recruitment coordination, customer support, reporting, research"/><span className="field-help">Add at least 5 specific skills. Separate them with commas.</span></div><div className="field span-2"><label>Tools & software</label><input name="tools" defaultValue={(va?.tools || []).join(", ")} placeholder="Google Workspace, HubSpot, Slack, Canva, ClickUp"/><span className="field-help">Add tools you can use without training.</span></div><div className="field"><label>Industries</label><input name="industries" defaultValue={(va?.industries || []).join(", ")} placeholder="SaaS, dental, real estate"/></div><div className="field"><label>Languages</label><input name="languages" defaultValue={(va?.languages || []).join(", ")} placeholder="English, Filipino"/></div></div></section>

          <section className="profile-section profile-section-flat" id="availability"><div className="profile-section-head profile-section-head-simple profile-section-head-with-status"><div><h2>Availability and rate</h2><p>Hours, schedule, rate, and current availability.</p></div><span className={`badge ${freshness.stale?"badge-warning":"badge-success"}`}><Clock3 size={13}/>{freshness.label}</span></div><div className="form-grid"><div className="field"><label>Hours available per week</label><input type="number" min="1" max="80" name="weekly_hours" defaultValue={va?.weekly_hours || ""}/></div><div className="field"><label>Preferred hourly rate, USD</label><input type="number" min={settings.minHourlyRate} step="0.01" name="hourly_rate" defaultValue={va?.hourly_rate || ""}/><span className="field-help">Current agency minimum: USD {settings.minHourlyRate}/hour.</span></div><div className="field"><label>Preferred schedule</label><input name="schedule" defaultValue={va?.schedule || ""} placeholder="Flexible · Evening PH · US overlap"/></div><div className="field"><label>Maximum live client overlap/day</label><input type="number" min="0" max="12" name="overlap_hours" defaultValue={va?.overlap_hours ?? 4}/></div><div className="field"><label>Availability status</label><select name="availability_status" defaultValue={va?.availability_status || "available"}><option value="available">Available now</option><option value="limited">Limited availability</option><option value="unavailable">Not available</option></select></div></div>{freshness.stale?<div className="alert" style={{marginTop:14}}><div><strong>Your availability needs confirmation.</strong><p style={{margin:"4px 0 0"}}>Save any changes, then confirm your availability below.</p></div></div>:null}</section>

          <section className="profile-section profile-section-flat" id="trust"><div className="profile-section-head profile-section-head-simple"><div><h2>Links and resume</h2><p>Add professional links and a private resume.</p></div></div><div className="form-grid"><div className="field"><label>LinkedIn URL</label><input type="url" name="linkedin_url" defaultValue={va?.linkedin_url || ""} placeholder="https://linkedin.com/in/..."/></div><div className="field"><label>Portfolio URL</label><input type="url" name="portfolio_url" defaultValue={va?.portfolio_url || ""} placeholder="https://..."/></div><div className="field span-2"><label>Private resume <span className="muted">PDF/DOC/DOCX, max 5 MB</span></label><input type="file" name="resume" accept=".pdf,.doc,.docx"/><span className="field-help">Your uploaded resume is never exposed on the public profile.</span></div></div></section>

          <div className="profile-savebar"><span className="small muted">Save your changes before confirming availability.</span><button className="btn btn-primary" type="submit">Save changes</button></div>
        </form>

        <section className="profile-utility-row"><div><strong>Availability confirmation</strong><span>{canConfirm ? "Confirm that your saved hours, schedule, and rate are still current." : "Save your hours, schedule, rate, and Available now status first."}</span></div><form action={confirmVaAvailabilityAction}><button className="btn btn-sm" type="submit" disabled={!canConfirm}>Confirm availability</button></form></section>


        <section className="profile-utility-row" id="vetting-readiness"><div><strong>Vetting</strong><span>Complete the remaining screening and recruiter review steps.</span></div><Link className="btn btn-sm" href="/workspace/va/vetting">Open vetting</Link></section>
        <section className="profile-section profile-section-flat" id="visibility">
          <div className="profile-section-head profile-section-head-simple"><div><h2>Public profile</h2><p>Choose whether your approved professional profile can appear in the public directory.</p></div></div>
          <form action={updateVaPublicProfileConsentAction} className="stack">
            <label className="visibility-toggle"><input type="checkbox" name="public_profile_consent" defaultChecked={consentGranted}/><span><strong>Show my approved professional profile publicly</strong><small>Clients may see your public professional details, including your photo, headline, experience, skills, availability, schedule, and rate. Private account information and your resume are never shown.</small></span></label>
            <div className="privacy-note"><ShieldCheck size={17}/><span>Email, phone, private resume, identity documents, test answers, messages, recruiter notes, and account records are not part of the public VA directory.</span></div>
            <p className="small muted">You can turn this off at any time without affecting your account, applications, messages, or hiring history. <Link className="text-link" href="/privacy" target="_blank">Privacy Notice</Link></p>
            {consentGranted ? <div className="success-banner">Consent active{consentDate ? ` since ${consentDate}` : ""} · notice version {va?.public_profile_consent_version || PUBLIC_PROFILE_CONSENT_VERSION}</div> : <div className="alert">No public-profile consent is currently recorded. Your profile will remain private even if a recruiter approves it.</div>}
            <div className="row-between wrap"><span className="small muted">Your profile still needs recruiter approval before it can be shown publicly.</span><button className="btn btn-primary btn-sm" type="submit">Save preference</button></div>
          </form>
        </section>
      </div>

      <aside className="profile-editor-sidebar"><LiveProfileStrength formId="va-profile-form" initial={va || {}}/><nav className="profile-quick-links" aria-label="Profile shortcuts"><a href="#basics">Basics</a><a href="#expertise">Experience</a><a href="#availability">Availability</a><a href="#trust">Links and resume</a><a href="#visibility">Public profile</a></nav></aside>
    </div>
  </>;
}
