"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, FileText, Sparkles } from "lucide-react";
import { createJobAction } from "@/app/actions/jobs";
import { MIN_HOURLY_RATE, VA_CATEGORIES } from "@/lib/constants";
import { mergeUniqueStrings } from "@/lib/collections";
import { ROLE_TEMPLATES, type RoleTemplate } from "@/lib/role-templates";
import { suggestJobDraft } from "@/lib/job-draft-suggestions";
import { isPublishableCompanyName } from "@/lib/job-publication";

const steps = ["Describe the work", "Schedule & pay", "Preview & post"] as const;

const COMMON_SKILLS = [
  "Administrative support", "Calendar management", "Inbox management", "Customer service",
  "Appointment setting", "Lead generation", "Bookkeeping", "Data entry", "Research", "Reporting",
  "Social media management", "Project coordination", "Recruiting support", "Ecommerce operations"
] as const;

type JobDraft = {
  title: string; company_name: string; categories: string; summary: string;
  description: string; responsibilities: string; required_skills: string; required_tools: string;
  hours_per_week: string; min_hourly_rate: string; max_hourly_rate: string; service_model: string;
  timezone: string; overlap_hours: string; live_coverage_exception: boolean; schedule_notes: string;
  onboarding_plan: string; direct_feedback: boolean; engagement_length: string; start_timing: string; experience_level: string;
};

type Errors = Record<string, string>;

const initial: JobDraft = {
  title: "", company_name: "", categories: "", summary: "", description: "", responsibilities: "",
  required_skills: "", required_tools: "", hours_per_week: "40", min_hourly_rate: String(MIN_HOURLY_RATE),
  max_hourly_rate: "", service_model: "curated_placement", timezone: "", overlap_hours: "4",
  live_coverage_exception: false, schedule_notes: "", onboarding_plan: "", direct_feedback: true,
  engagement_length: "Long-term preferred", start_timing: "", experience_level: "intermediate"
};

export function JobWizard({ initialData, jobId, requestedVaId, requestedVaName, initialStep = 0, canSelfPublishJobs = false, publicMode = false }: {
  initialData?: Partial<JobDraft>; jobId?: string; requestedVaId?: string; requestedVaName?: string; initialStep?: number; canSelfPublishJobs?: boolean; publicMode?: boolean;
}) {
  const [step, setStep] = useState(Math.max(0, Math.min(steps.length - 1, initialStep)));
  const [data, setData] = useState<JobDraft>({ ...initial, ...initialData });
  const [errors, setErrors] = useState<Errors>({});
  const [savedAt, setSavedAt] = useState("");
  const isBlankDraft = !data.title.trim() && !data.summary.trim() && !data.required_skills.trim() && !data.description.trim();
  const applyTemplate = (template: RoleTemplate) => {
    setData((prev) => ({ ...prev, ...template.values }));
    setErrors({});
  };
  const storageKey = useMemo(() => `va_job_draft_${jobId || "new"}`, [jobId]);
  const categoryOptions = new Set<string>(VA_CATEGORIES as readonly string[]);
  const rawCategories = data.categories.split(",").map((x) => x.trim()).filter(Boolean);
  const selectedCategories = rawCategories.filter((x) => categoryOptions.has(x));
  const hours = Number(data.hours_per_week || 0);
  const minRate = Number(data.min_hourly_rate || 0);
  const maxRate = Number(data.max_hourly_rate || 0);
  const monthlyLow = hours && minRate ? Math.round(hours * minRate * 4.33) : 0;
  const monthlyHigh = hours && maxRate ? Math.round(hours * maxRate * 4.33) : monthlyLow;

  const set = (key: keyof JobDraft, value: string | boolean) => {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  };

  useEffect(() => {
    if (jobId) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setData((current) => ({ ...current, ...(JSON.parse(raw) as Partial<JobDraft>) }));
    } catch { /* local draft is optional */ }
  }, [jobId, storageKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(data));
        setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch { /* local storage can be unavailable */ }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [data, storageKey]);

  useEffect(() => {
    if (rawCategories.length !== selectedCategories.length) set("categories", selectedCategories.join(", "));
  }, [rawCategories.length, selectedCategories.length]);

  function toggleCategory(category: string) {
    const current = new Set(selectedCategories);
    if (current.has(category)) current.delete(category);
    else if (current.size < 3) current.add(category);
    set("categories", Array.from(current).join(", "));
  }

  function toggleCsvItem(key: "required_skills" | "required_tools", item: string) {
    const current = data[key].split(",").map((x) => x.trim()).filter(Boolean);
    const found = current.some((x) => x.toLowerCase() === item.toLowerCase());
    set(key, (found ? current.filter((x) => x.toLowerCase() !== item.toLowerCase()) : [...current, item]).join(", "));
  }

  const hasCsvItem = (key: "required_skills" | "required_tools", item: string) =>
    data[key].split(",").some((x) => x.trim().toLowerCase() === item.toLowerCase());

  function starterBriefValues(current: JobDraft) {
    const suggested = suggestJobDraft(`${current.title} ${current.summary}`);
    return {
      categories: current.categories || suggested.category,
      required_skills: current.required_skills || suggested.skills,
      responsibilities: current.responsibilities || suggested.responsibilities,
      description: current.description || `We need a reliable Virtual Assistant to help with: ${current.summary || "the responsibilities described above"}. The right person will communicate clearly, keep work organized, and raise blockers early.`,
      title: current.title || suggested.title,
    };
  }
  function prepareBrief() {
    setData((current) => ({ ...current, ...starterBriefValues(current) }));
  }

  function validate(targetStep = step, candidate = data) {
    const next: Errors = {};
    const candidateCategories = candidate.categories.split(",").map((x) => x.trim()).filter((x) => categoryOptions.has(x));
    const candidateHours = Number(candidate.hours_per_week || 0);
    const candidateMinRate = Number(candidate.min_hourly_rate || 0);
    const candidateMaxRate = Number(candidate.max_hourly_rate || 0);
    const overlap = Number(candidate.overlap_hours || 0);
    if (targetStep >= 0) {
      if (candidate.title.trim().length < 3) next.title = "Add a clear role title.";
      if (!isPublishableCompanyName(candidate.company_name)) next.company_name = "Enter the real company name that will be shown on the job post.";
      if (!candidateCategories.length) next.categories = "Choose at least one specialty.";
      if (candidate.summary.trim().length < 20) next.summary = "Describe what you need this person to own.";
      if (candidate.required_skills.split(",").filter((x) => x.trim()).length < 1) next.required_skills = "Add at least one required skill.";
    }
    if (targetStep >= 1) {
      if (!Number.isFinite(candidateHours) || candidateHours < 1 || candidateHours > 80) next.hours_per_week = "Enter weekly hours between 1 and 80.";
      if (candidate.timezone.trim().length < 2) next.timezone = "Add your timezone or working region.";
      if (!Number.isFinite(candidateMinRate) || candidateMinRate < MIN_HOURLY_RATE) next.min_hourly_rate = `Minimum rate must be at least USD ${MIN_HOURLY_RATE}/hour.`;
      if (candidate.max_hourly_rate && (!Number.isFinite(candidateMaxRate) || candidateMaxRate < candidateMinRate)) next.max_hourly_rate = "Maximum rate must be at least the minimum rate.";
      if (!Number.isFinite(overlap) || overlap < 0 || overlap > 12) next.overlap_hours = "Live overlap must be between 0 and 12 hours.";
      if (overlap > 4 && !candidate.live_coverage_exception) next.overlap_hours = "Overlap above 4 hours needs a genuine live-coverage exception.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    const candidate = step === 0 ? { ...data, ...starterBriefValues(data) } : data;
    if (!validate(step, candidate)) return;
    if (step === 0) setData(candidate);
    setStep((current) => Math.min(steps.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const error = (key: string) => errors[key] ? <span className="field-error" role="alert">{errors[key]}</span> : null;

  return <form action={publicMode ? undefined : createJobAction} className="wizard wizard-compact" onSubmit={(event) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (publicMode) {
      event.preventDefault();
      if (submitter?.value !== "submit" || !validate(steps.length - 1)) return;
      const completed = { ...data, ...starterBriefValues(data) };
      try { window.localStorage.setItem(storageKey, JSON.stringify(completed)); } catch { /* local storage can be unavailable */ }
      window.location.assign("/auth/join/client?next=%2Fworkspace%2Fclient%2Fjobs%2Fnew%3Ffrom_post%3D1");
      return;
    }
    if (submitter?.value === "submit" && !validate(steps.length - 1)) { event.preventDefault(); return; }
    if (submitter?.value === "submit" || submitter?.value === "draft") {
      try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
    }
  }}>
    {jobId ? <input type="hidden" name="job_id" value={jobId}/> : null}
    {requestedVaId ? <input type="hidden" name="requested_va_id" value={requestedVaId}/> : null}
    {Object.entries(data).map(([key, value]) => typeof value === "boolean"
      ? <input key={key} type="hidden" name={key} value={value ? "on" : (key === "direct_feedback" ? "off" : "")}/>
      : <input key={key} type="hidden" name={key} value={value}/>) }

    <aside className="wizard-steps" aria-label="Job form steps">
      {steps.map((label, index) => <button key={label} type="button" className={`wizard-step ${index === step ? "active" : ""} ${index < step ? "complete" : ""}`} onClick={() => index <= step ? setStep(index) : undefined} disabled={index > step} aria-current={index === step ? "step" : undefined}>
        <span className="wizard-number">{index < step ? <CheckCircle2 size={15}/> : index + 1}</span><span>{label}</span>
      </button>)}
    </aside>

    <div className="wizard-panel">
      <div className="wizard-head row-between wrap">
        <div><div className="wizard-step-label">Step {step + 1} of 3</div><h2>{steps[step]}</h2>{requestedVaName ? <p className="small muted wizard-requested">Requested VA: <strong>{requestedVaName}</strong>. We will keep this preference attached to the role.</p> : null}</div>
        <div className="wizard-save"><span>{savedAt ? `Draft saved on this device at ${savedAt}` : "Local autosave is on"}</span>{publicMode ? null : <button className="btn btn-sm" name="submit_mode" value="draft" type="submit">Save & exit</button>}</div>
      </div>
      {Object.keys(errors).length ? <div className="alert" role="alert" style={{marginBottom:18}}>Please fix the highlighted fields before continuing.</div> : null}

      {step===0 && !publicMode?<div className="brief-helper"><div><span className="small">{publicMode ? "Start here" : "Need a starting point?"}</span><strong>{publicMode ? "Describe the work in one or two sentences. The next screen fills in a draft title, specialty, skills, and responsibilities." : "Describe the work in your own words, then review the generated hiring brief before you continue."}</strong></div>{publicMode ? null : <button type="button" className="btn btn-sm" onClick={prepareBrief}><Sparkles size={15}/> Prepare a starter brief</button>}</div>:null}

      {step === 0 && isBlankDraft && !publicMode ? <section className="role-template-picker">
        <div><strong>Start from a common role</strong><p className="small muted">Fills in the title, specialty, skills, tools and a draft description. You can edit every field afterwards — or just start typing below to write your own.</p></div>
        <div className="role-template-grid">{ROLE_TEMPLATES.map((template) => <button type="button" key={template.id} className="role-template-card" onClick={() => applyTemplate(template)}><strong>{template.label}</strong><small>{template.blurb}</small></button>)}</div>
      </section> : null}

      {step === 0 ? publicMode ? <div className="form-grid">
        <div className="field span-2"><label>What should your VA handle?</label><textarea className="textarea-compact post-job-primary-input" value={data.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Manage my inbox and calendar, coordinate weekly meetings, prepare follow-ups, and keep action items moving." autoFocus aria-invalid={Boolean(errors.summary)}/><span className="small muted">Write the work in your own words. The next step fills in a draft title, specialty, skills, and responsibilities that you can edit.</span>{error("summary")}</div>
        <div className="field span-2"><label>Company name</label><input value={data.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Studio" aria-invalid={Boolean(errors.company_name)}/><span className="small muted">This company name will be shown publicly on the job post.</span>{error("company_name")}</div>
        <details className="wizard-optional span-2">
          <summary>I want to add more details now</summary>
          <div className="form-grid wizard-optional-grid">
            <div className="field span-2"><label>Job title <span className="muted">(optional)</span></label><input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Executive Assistant to Founder"/></div>
            <div className="field span-2"><label>Specialty <span className="muted">(optional, choose up to 3)</span></label><div className="category-picker category-picker-tight">{VA_CATEGORIES.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip ${selectedCategories.includes(item) ? "selected" : ""}`} onClick={() => toggleCategory(item)} disabled={!selectedCategories.includes(item) && selectedCategories.length >= 3}>{selectedCategories.includes(item) ? <Check size={13}/> : null}{item}</button>)}</div></div>
            <div className="field span-2"><label>Required skills <span className="muted">(optional)</span></label><input value={data.required_skills} onChange={(e) => set("required_skills", e.target.value)} placeholder="Calendar management, inbox management"/><div className="suggestion-chips">{COMMON_SKILLS.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip compact ${hasCsvItem("required_skills", item) ? "selected" : ""}`} onClick={() => toggleCsvItem("required_skills", item)}>{item}</button>)}</div></div>
            <div className="field"><label>Tools <span className="muted">(optional)</span></label><input value={data.required_tools} onChange={(e) => set("required_tools", e.target.value)} placeholder="Google Workspace, Slack, Notion"/></div>
            <div className="field span-2"><label>Detailed responsibilities <span className="muted">(optional)</span></label><textarea className="textarea-mini" value={data.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder={'Manage calendar and meeting requests\nTriage inbox and draft replies\nTrack follow-ups and weekly priorities'}/></div>
          </div>
        </details>
      </div> : <div className="form-grid">
        <div className="field span-2"><label>What do you need this person to own?</label><textarea className="textarea-compact post-job-primary-input" value={data.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Manage my inbox and calendar, coordinate weekly meetings, prepare follow-ups, and keep action items moving." autoFocus aria-invalid={Boolean(errors.summary)}/><span className="small muted">Write the work in your own words. If you leave the fields below blank, the next step fills in a draft title, specialty, skills, and responsibilities for review.</span>{error("summary")}</div>
        <div className="field span-2"><label>Company name</label><input value={data.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Studio" aria-invalid={Boolean(errors.company_name)}/><span className="small muted">Published job posts always show the company name.</span>{error("company_name")}</div>
        <div className="field span-2"><label>Job title <span className="muted">(optional, we can suggest one)</span></label><input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Executive Assistant to Founder" aria-invalid={Boolean(errors.title)}/>{error("title")}</div>
        <div className="field span-2"><label>Specialty <span className="muted">(optional, choose up to 3)</span></label><div className="category-picker category-picker-tight">{VA_CATEGORIES.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip ${selectedCategories.includes(item) ? "selected" : ""}`} onClick={() => toggleCategory(item)} disabled={!selectedCategories.includes(item) && selectedCategories.length >= 3}>{selectedCategories.includes(item) ? <Check size={13}/> : null}{item}</button>)}</div>{error("categories")}</div>
        <div className="field span-2"><label>Required skills <span className="muted">(optional, we can suggest these)</span></label><input value={data.required_skills} onChange={(e) => set("required_skills", e.target.value)} placeholder="Calendar management, inbox management"/><div className="suggestion-chips">{COMMON_SKILLS.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip compact ${hasCsvItem("required_skills", item) ? "selected" : ""}`} onClick={() => toggleCsvItem("required_skills", item)}>{item}</button>)}</div>{error("required_skills")}</div>
        <details className="wizard-optional span-2">
          <summary>Add tools or detailed responsibilities</summary>
          <div className="form-grid wizard-optional-grid">
            <div className="field"><label>Tools <span className="muted">(optional)</span></label><input value={data.required_tools} onChange={(e) => set("required_tools", e.target.value)} placeholder="Google Workspace, Slack, Notion"/></div>
            <div className="field span-2"><label>Detailed responsibilities <span className="muted">(optional)</span></label><textarea className="textarea-mini" value={data.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder={'Manage calendar and meeting requests\nTriage inbox and draft replies\nTrack follow-ups and weekly priorities'}/></div>
          </div>
        </details>
      </div> : null}

            {step === 1 ? <div className="stack wizard-budget-step">
        <div className="form-grid">
          <div className="field"><label>Hours per week</label><input type="number" min="1" max="80" value={data.hours_per_week} onChange={(e) => set("hours_per_week", e.target.value)} aria-invalid={Boolean(errors.hours_per_week)}/>{error("hours_per_week")}</div>
          <div className="field"><label>Timezone / working region</label><input value={data.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="Australia/Sydney or US Eastern" aria-invalid={Boolean(errors.timezone)}/>{error("timezone")}</div>
          <div className="field"><label>Minimum hourly rate, USD</label><input type="number" min={MIN_HOURLY_RATE} step="0.01" value={data.min_hourly_rate} onChange={(e) => set("min_hourly_rate", e.target.value)} aria-invalid={Boolean(errors.min_hourly_rate)}/>{error("min_hourly_rate")}</div>
          <div className="field"><label>Maximum hourly rate, USD <span className="muted">(optional)</span></label><input type="number" min={MIN_HOURLY_RATE} step="0.01" value={data.max_hourly_rate} onChange={(e) => set("max_hourly_rate", e.target.value)} placeholder="12" aria-invalid={Boolean(errors.max_hourly_rate)}/>{error("max_hourly_rate")}</div>
          <div className="field span-2"><label>When do you want them to start? <span className="muted">(optional)</span></label><input value={data.start_timing} onChange={(e) => set("start_timing", e.target.value)} placeholder="Within 2 weeks"/></div>
        </div>
        {monthlyLow ? <div className="estimate-strip"><span>Estimated VA compensation</span><strong>${monthlyLow.toLocaleString()}{monthlyHigh > monthlyLow ? `–$${monthlyHigh.toLocaleString()}` : "+"}/month</strong><small>Based on {hours} hrs/week × 4.33 weeks. Any VAPH service fee is separate and confirmed before recruiting begins.</small></div> : null}
        <details className="wizard-optional">
          <summary>Advanced schedule settings</summary>
          <div className="form-grid wizard-optional-grid">
            <div className="field"><label>Expected engagement</label><select value={data.engagement_length} onChange={(e) => set("engagement_length", e.target.value)}><option>Long-term preferred</option><option>3 to 6 months</option><option>1 to 3 months</option><option>Project-based</option></select></div>
            <div className="field"><label>Experience level</label><select value={data.experience_level} onChange={(e) => set("experience_level", e.target.value)}><option value="entry">Entry</option><option value="intermediate">Intermediate</option><option value="senior">Senior</option><option value="expert">Expert / niche</option></select></div>
            <div className="field"><label>Live overlap per day</label><select value={data.overlap_hours} onChange={(e) => set("overlap_hours", e.target.value)}><option value="0">No required overlap</option><option value="2">2 hours</option><option value="4">4 hours</option><option value="6">6 hours</option><option value="8">8 hours</option></select>{error("overlap_hours")}</div>
            <div className="field"><label>Schedule notes <span className="muted">(optional)</span></label><input value={data.schedule_notes} onChange={(e) => set("schedule_notes", e.target.value)} placeholder="Core meetings are 9–11am ET"/></div>
            {Number(data.overlap_hours) > 4 ? <label className="checkbox-card span-2"><input type="checkbox" checked={data.live_coverage_exception} onChange={(e) => set("live_coverage_exception", e.target.checked)}/><span><strong>This role genuinely needs more than 4 hours of live coverage.</strong><small>Use this for reception, outbound calling, dispatch, appointments, or other real-time work.</small></span></label> : null}
          </div>
        </details>
      </div> : null}

                  {step === 2 ? <div className="stack">
        <div className="job-post-preview">
          <div className="job-post-preview-head">
            <div className="review-icon"><FileText size={22}/></div>
            <div><span>Job preview</span><h3>{data.title || "Virtual Assistant"}</h3><p>{data.company_name || "Your company"} · {data.hours_per_week || "—"} hrs/week · {data.timezone || "Flexible timezone"}</p></div>
            <strong className="job-post-preview-rate">${data.min_hourly_rate || MIN_HOURLY_RATE}{data.max_hourly_rate ? `–${data.max_hourly_rate}` : "+"}/hr</strong>
          </div>
          <p className="job-post-preview-summary">{data.summary || "Add a summary before submitting."}</p>
          {data.responsibilities ? <div className="job-post-preview-responsibilities"><span>What this VA will own</span><ul>{data.responsibilities.split(/\r?\n/).filter(Boolean).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></div> : null}
          <div className="pill-list">{mergeUniqueStrings(data.required_skills.split(","), data.required_tools.split(",")).map((x, index) => <span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div>
        </div>
        <div className="review-grid">
          <div><span>Specialty</span><strong>{selectedCategories.join(" · ") || "Not set"}</strong></div>
          <div><span>Schedule</span><strong>{data.hours_per_week || "—"} hrs/week · {data.timezone || "Flexible"}</strong></div><div><span>Experience</span><strong>{data.experience_level.charAt(0).toUpperCase()+data.experience_level.slice(1)}</strong></div>
          <div><span>VA budget</span><strong>${data.min_hourly_rate || MIN_HOURLY_RATE}{data.max_hourly_rate ? `–$${data.max_hourly_rate}` : "+"}/hr</strong></div>
          <div><span>Start timing</span><strong>{data.start_timing || "Flexible"}</strong></div>
        </div>
        <div className="review-edit-row"><button className="text-button" type="button" onClick={() => setStep(0)}>Edit role details</button><button className="text-button" type="button" onClick={() => setStep(1)}>Edit schedule & pay</button></div>
        <div className="card review-section"><div className="row-between"><h3>What happens next</h3><Sparkles size={18}/></div>{publicMode ? <ul className="check-list compact"><li>Your draft stays saved on this device.</li><li>Create or sign in to a client account to attach the draft to your workspace.</li><li>Review the final posting, then send it for publication or recruiting review.</li><li>Your contact details stay private from applicants.</li></ul> : canSelfPublishJobs && data.service_model === "curated_placement" ? <ul className="check-list compact"><li>Your complete role publishes to the public Virtual Assistant jobs directory immediately.</li><li>Only vetted VAs can enter the recruiter-managed candidate flow.</li><li>Your company name is public on the job post; your personal contact details remain private.</li><li>You can edit or close the role from your client workspace.</li></ul> : <ul className="check-list compact"><li>Your role is saved immediately.</li><li>Our recruiting team checks the brief and confirms any service terms separately.</li><li>You approve commercial terms before recruiting begins.</li><li>Once approved, we shortlist vetted VAs against this exact role.</li></ul>}</div>
      </div> : null}

      <div className="wizard-actions">
        <button className="btn" type="button" disabled={step === 0} onClick={() => { setErrors({}); setStep((current) => Math.max(0, current - 1)); }}>Back</button>
        <div className="row wrap wizard-actions-right">{step < steps.length - 1 ? <button className="btn btn-primary" type="button" onClick={nextStep}>{step === 0 ? "Continue to schedule & pay" : "Preview job"}</button> : <button className="btn btn-primary" name="submit_mode" value="submit" type="submit">{publicMode ? "Create free account to post" : jobId ? "Save role changes" : canSelfPublishJobs && data.service_model === "curated_placement" ? "Publish job" : "Submit job for review"}</button>}</div>
      </div>
    </div>
  </form>;
}
