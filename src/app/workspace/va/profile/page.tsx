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

function availabilityAge(value?: string | null) {
  if (!value) return { label: "Not confirmed", stale: true };
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  return {
    label: days === 0 ? "Confirmed today" : days === 1 ? "Confirmed 1 day ago" : `Confirmed ${days} days ago`,
    stale: days >= 14,
  };
}

export default async function VaProfilePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [{ userId, profile }, settings] = await Promise.all([
    requireRoleFast("va"),
    getBusinessSettings(),
  ]);

  const supabase = await createClient();
  const { data: va } = await supabase.from("va_profiles").select("*").eq("user_id", userId).single();

  const consentGranted = Boolean(va?.public_profile_consent);
  const consentDate = va?.public_profile_consent_at
    ? new Date(va.public_profile_consent_at).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const freshness = availabilityAge(va?.availability_confirmed_at);
  const canConfirm =
    va?.availability_status === "available" &&
    Boolean(va?.weekly_hours) &&
    Boolean(va?.schedule) &&
    Boolean(va?.hourly_rate);

  return (
    <>
      {params.error ? <div className="alert" role="alert">{params.error}</div> : null}
      {params.saved ? <div className="success-banner" role="status">Profile saved.</div> : null}
      {params.availability_confirmed ? (
        <div className="success-banner" role="status">Availability confirmed.</div>
      ) : null}
      {params.consent === "granted" ? (
        <div className="success-banner" role="status">Public profile preference saved.</div>
      ) : null}
      {params.consent === "withdrawn" ? (
        <div className="success-banner" role="status">Your profile is private.</div>
      ) : null}

      <div className="page-head va-profile-head">
        <div>
          <h1>Your profile</h1>
          <p>Keep the details recruiters and clients use to understand your fit current.</p>
        </div>
        <Link className="btn btn-sm" href="/workspace/va/profile/preview" target="_blank">
          <Eye size={16} /> Preview
        </Link>
      </div>

      <ResumeAutoFill formId="va-profile-form" hasSavedResume={Boolean(va?.resume_path)} />

      <div className="profile-editor-layout">
        <div className="stack profile-editor-main">
          <form
            id="va-profile-form"
            action={updateVaProfileAction}
            className="profile-editor-form"
            encType="multipart/form-data"
          >
            <input type="hidden" name="directory_visible" value={va?.directory_visible ? "on" : ""} />

            <section className="profile-section profile-section-flat" id="basics">
              <div className="profile-section-head profile-section-head-simple">
                <div>
                  <h2>Profile</h2>
                  <p>Your name, headline, summary, and photo.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Full legal name <span className="muted">(private)</span></label>
                  <input name="full_name" defaultValue={profile.full_name || ""} required />
                  <span className="field-help">Public pages show first name + last initial only.</span>
                </div>
                <div className="field">
                  <label>Professional headline</label>
                  <input
                    name="headline"
                    defaultValue={va?.headline || ""}
                    placeholder="Executive Assistant · Operations · Customer Support"
                  />
                </div>
                <div className="field span-2">
                  <label>Professional summary</label>
                  <textarea
                    name="bio"
                    defaultValue={va?.bio || ""}
                    placeholder="What work do you do best? Which clients have you supported? What outcomes can you own?"
                  />
                  <span className="field-help">Aim for 80–220 words focused on outcomes and responsibilities.</span>
                </div>
                <div className="field span-2">
                  <label>Profile photo <span className="muted">JPG/PNG/WEBP, max 3 MB</span></label>
                  <div className="profile-photo-control">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="Current profile photo" />
                    ) : (
                      <div className="profile-photo-placeholder" aria-hidden="true">Photo</div>
                    )}
                    <div>
                      <input
                        type="file"
                        name="avatar"
                        accept="image/jpeg,image/png,image/webp"
                        required={!profile.avatar_url}
                      />
                      <span className="field-help">
                        {profile.avatar_url
                          ? "Choose a new file only if you want to replace your current photo."
                          : "Add a clear professional photo before your profile can be published."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-section profile-section-flat" id="expertise">
              <div className="profile-section-head profile-section-head-simple">
                <div>
                  <h2>Experience and skills</h2>
                  <p>Describe the work you can take ownership of.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Primary specialty</label>
                  <select name="primary_category" defaultValue={va?.primary_category || ""}>
                    <option value="">Choose a specialty</option>
                    {VA_CATEGORIES.map((category) => (
                      <option key={String(category)}>{category}</option>
                    ))}
                  </select>
                  <span className="field-help">Choose the type of work you do best.</span>
                </div>
                <div className="field">
                  <label>Years of professional experience</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    name="years_experience"
                    defaultValue={va?.years_experience ?? ""}
                  />
                  <span className="field-help">Public discovery requires at least 2 years.</span>
                </div>
                <div className="field span-2">
                  <label>Additional specialties <span className="muted">(up to 3)</span></label>
                  <input
                    name="categories"
                    defaultValue={(va?.categories || []).join(", ")}
                    placeholder="Customer Service, Ecommerce"
                  />
                </div>
                <div className="field span-2">
                  <label>Core skills</label>
                  <input
                    name="skills"
                    defaultValue={(va?.skills || []).join(", ")}
                    placeholder="Calendar management, recruitment coordination, customer support, reporting, research"
                  />
                  <span className="field-help">Use specific skills separated with commas.</span>
                </div>
                <div className="field span-2">
                  <label>Tools and software</label>
                  <input
                    name="tools"
                    defaultValue={(va?.tools || []).join(", ")}
                    placeholder="Google Workspace, HubSpot, Slack, Canva, ClickUp"
                  />
                  <span className="field-help">List tools you can use without training.</span>
                </div>
                <div className="field">
                  <label>Industries</label>
                  <input
                    name="industries"
                    defaultValue={(va?.industries || []).join(", ")}
                    placeholder="SaaS, dental, real estate"
                  />
                </div>
                <div className="field">
                  <label>Languages</label>
                  <input
                    name="languages"
                    defaultValue={(va?.languages || []).join(", ")}
                    placeholder="English, Filipino"
                  />
                </div>
              </div>
            </section>

            <section className="profile-section profile-section-flat" id="availability">
              <div className="profile-section-head profile-section-head-simple profile-section-head-with-status">
                <div>
                  <h2>Availability and rate</h2>
                  <p>Set the hours and schedule you can actually commit to.</p>
                </div>
                <span className={`badge ${freshness.stale ? "badge-warning" : "badge-success"}`}>
                  <Clock3 size={13} /> {freshness.label}
                </span>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Hours available per week</label>
                  <input
                    type="number"
                    min="1"
                    max="80"
                    name="weekly_hours"
                    defaultValue={va?.weekly_hours || ""}
                  />
                </div>
                <div className="field">
                  <label>Preferred hourly rate, USD</label>
                  <input
                    type="number"
                    min={settings.minHourlyRate}
                    step="0.01"
                    name="hourly_rate"
                    defaultValue={va?.hourly_rate || ""}
                  />
                  <span className="field-help">Agency minimum: USD {settings.minHourlyRate}/hour.</span>
                </div>
                <div className="field">
                  <label>Preferred schedule</label>
                  <input
                    name="schedule"
                    defaultValue={va?.schedule || ""}
                    placeholder="Flexible · Evening PH · US overlap"
                  />
                </div>
                <div className="field">
                  <label>Maximum live client overlap/day</label>
                  <input
                    type="number"
                    min="0"
                    max="12"
                    name="overlap_hours"
                    defaultValue={va?.overlap_hours ?? 4}
                  />
                </div>
                <div className="field">
                  <label>Availability status</label>
                  <select name="availability_status" defaultValue={va?.availability_status || "available"}>
                    <option value="available">Available now</option>
                    <option value="limited">Limited availability</option>
                    <option value="unavailable">Not available</option>
                  </select>
                </div>
              </div>
              {freshness.stale ? (
                <p className="profile-inline-note">
                  Save any changes, then use Confirm availability in the side panel.
                </p>
              ) : null}
            </section>

            <section className="profile-section profile-section-flat" id="links">
              <div className="profile-section-head profile-section-head-simple">
                <div>
                  <h2>Professional links</h2>
                  <p>Add links that help a recruiter verify your work.</p>
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    name="linkedin_url"
                    defaultValue={va?.linkedin_url || ""}
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="field">
                  <label>Portfolio URL</label>
                  <input
                    type="url"
                    name="portfolio_url"
                    defaultValue={va?.portfolio_url || ""}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </section>

            <div className="profile-savebar">
              <span className="small muted">Review your changes before saving.</span>
              <button className="btn btn-primary" type="submit">Save changes</button>
            </div>
          </form>

          <section className="profile-section profile-section-flat" id="visibility">
            <div className="profile-section-head profile-section-head-simple">
              <div>
                <h2>Public profile</h2>
                <p>Choose whether an approved version of your profile can appear in the talent directory.</p>
              </div>
            </div>
            <form action={updateVaPublicProfileConsentAction} className="stack">
              <label className="visibility-toggle">
                <input
                  type="checkbox"
                  name="public_profile_consent"
                  defaultChecked={consentGranted}
                />
                <span>
                  <strong>Allow my approved professional profile to appear publicly</strong>
                  <small>
                    Clients may see your photo, headline, experience, skills, availability, schedule, and rate.
                    Your private resume and account information are never shown.
                  </small>
                </span>
              </label>
              <div className="privacy-note">
                <ShieldCheck size={17} />
                <span>
                  Email, phone, resume, identity documents, test answers, messages, recruiter notes,
                  and account records remain private.
                </span>
              </div>
              {consentGranted ? (
                <div className="success-banner">
                  Public-profile consent is active{consentDate ? ` since ${consentDate}` : ""}.
                </div>
              ) : (
                <div className="profile-inline-note">
                  Your profile stays private unless you opt in and a recruiter approves it.
                </div>
              )}
              <div className="row-between wrap">
                <Link className="text-link small" href="/privacy" target="_blank">Privacy Notice</Link>
                <button className="btn btn-primary btn-sm" type="submit">Save preference</button>
              </div>
            </form>
          </section>
        </div>

        <aside className="profile-editor-sidebar">
          <LiveProfileStrength formId="va-profile-form" initial={va || {}} />

          <section className="profile-side-actions">
            <div className="profile-side-actions-head">
              <strong>Next actions</strong>
              <span>After saving your profile</span>
            </div>

            <div className="profile-side-action">
              <div>
                <strong>Availability</strong>
                <span>{canConfirm ? "Confirm your saved hours, schedule, and rate." : "Complete availability fields first."}</span>
              </div>
              <form action={confirmVaAvailabilityAction}>
                <button className="btn btn-sm" type="submit" disabled={!canConfirm}>
                  Confirm availability
                </button>
              </form>
            </div>

            <div className="profile-side-action">
              <div>
                <strong>Vetting</strong>
                <span>Check your screening and recruiter-review status.</span>
              </div>
              <Link className="btn btn-sm" href="/workspace/va/vetting">Open vetting</Link>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
