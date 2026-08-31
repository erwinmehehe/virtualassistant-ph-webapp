"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, DollarSign, FileText, Sparkles } from "lucide-react";
import { createJobAction } from "@/app/actions/jobs";
import { MIN_HOURLY_RATE, VA_CATEGORIES } from "@/lib/constants";
import { mergeUniqueStrings } from "@/lib/collections";
import { ROLE_TEMPLATES, type RoleTemplate } from "@/lib/role-templates";

const steps = ["Tell us what you need", "Shape the role", "Schedule & budget", "Review your brief"] as const;

const COMMON_SKILLS = [
  "Administrative support", "Calendar management", "Inbox management", "Customer service",
  "Appointment setting", "Lead generation", "Bookkeeping", "Data entry", "Research", "Reporting",
  "Social media management", "Project coordination", "Recruiting support", "Ecommerce operations"
] as const;

const COMMON_TOOLS = [
  "Google Workspace", "Microsoft Office", "Slack", "Zoom", "Canva", "HubSpot", "Salesforce",
  "ClickUp", "Asana", "Trello", "QuickBooks", "Shopify", "WordPress", "Notion"
] as const;

const BUDGET_GUIDANCE = [
  { label: "General support", range: "$5–$8/hr", note: "Admin, data entry, straightforward support" },
  { label: "Experienced specialist", range: "$8–$12/hr", note: "EA, customer support, ecommerce, bookkeeping" },
  { label: "Senior / niche", range: "$12+/hr", note: "Specialist tools, complex ownership, senior experience" }
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

export function JobWizard({ initialData, jobId, requestedVaId, requestedVaName }: {
  initialData?: Partial<JobDraft>; jobId?: string; requestedVaId?: string; requestedVaName?: string;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<JobDraft>({ ...initial, ...initialData });
  const [errors, setErrors] = useState<Errors>({});
  const [savedAt, setSavedAt] = useState("");
  const isBlankDraft = !data.title.trim() && !data.summary.trim() && !data.required_skills.trim() && !data.description.trim();
  const applyTemplate = (template: RoleTemplate) => {
    setData((prev) => ({ ...prev, ...template.values }));
    setErrors({});
  };
  const storageKey = useMemo(() => `va_job_draft_${jobId || "new"}`, [jobId]);
  const selectedCategories = data.categories.split(",").map((x) => x.trim()).filter(Boolean);
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

  function prepareBrief() {
    const words = `${data.title} ${data.summary}`.toLowerCase();
    const ecommerce = /shopify|ecommerce|e-commerce|product/.test(words);
    const support = /support|customer|email|inbox/.test(words);
    const admin = /calendar|admin|assistant|schedule/.test(words);
    const category = ecommerce ? "Ecommerce" : support ? "Customer Support" : admin ? "Administrative Support" : "General Virtual Assistance";
    const skills = ecommerce ? "Ecommerce operations, Customer service, Data entry" : support ? "Customer service, Written communication, Problem solving" : admin ? "Administrative support, Calendar management, Inbox management" : "Administrative support, Communication, Research";
    const responsibilities = ecommerce ? "Maintain product listings\nRespond to customer questions\nKeep orders and inventory information current" : support ? "Respond to customer messages\nResolve routine requests and escalate exceptions\nKeep support records current" : admin ? "Manage calendars and scheduling\nOrganize inboxes and follow-ups\nPrepare weekly updates" : "Complete recurring administrative tasks\nMaintain accurate records\nEscalate questions and blockers";
    setData((current) => ({ ...current, categories: current.categories || category, required_skills: current.required_skills || skills, responsibilities: current.responsibilities || responsibilities, description: current.description || `We need a reliable VA to help with: ${current.summary || "the responsibilities described above"}. The right person will communicate clearly, keep work organized, and raise blockers early.`, title: current.title || `${category} VA` }));
  }

  function validate(targetStep = step) {
    const next: Errors = {};
    const overlap = Number(data.overlap_hours || 0);
    if (targetStep >= 0) {
      if (data.title.trim().length < 3) next.title = "Add a clear role title.";
      if (!selectedCategories.length) next.categories = "Choose at least one specialty.";
      if (data.summary.trim().length < 20) next.summary = "Add a short summary of at least 20 characters.";
      if (data.required_skills.split(",").filter((x) => x.trim()).length < 2) next.required_skills = "Add at least two skills so matching has enough signal.";
    }
    if (targetStep >= 1) {
      if (data.description.trim().length < 50) next.description = "Describe the role and expected outcomes in at least 50 characters.";
      if (!data.responsibilities.split(/\r?\n/).some((x) => x.trim())) next.responsibilities = "Add at least one responsibility.";
      if (!Number.isFinite(hours) || hours < 1 || hours > 80) next.hours_per_week = "Enter weekly hours between 1 and 80.";
      if (data.timezone.trim().length < 2) next.timezone = "Add the client timezone or working region.";
      if (!Number.isFinite(overlap) || overlap < 0 || overlap > 12) next.overlap_hours = "Live overlap must be between 0 and 12 hours.";
      if (overlap > 4 && !data.live_coverage_exception) next.overlap_hours = "Overlap above 4 hours needs a genuine live-coverage exception.";
    }
    if (targetStep >= 2) {
      if (!Number.isFinite(minRate) || minRate < MIN_HOURLY_RATE) next.min_hourly_rate = `Minimum rate must be at least USD ${MIN_HOURLY_RATE}/hour.`;
      if (data.max_hourly_rate && (!Number.isFinite(maxRate) || maxRate < minRate)) next.max_hourly_rate = "Maximum rate must be at least the minimum rate.";
      if (data.onboarding_plan.trim().length < 30) next.onboarding_plan = "Add a short first-week onboarding plan.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    if (!validate(step)) return;
    setStep((current) => Math.min(steps.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const error = (key: string) => errors[key] ? <span className="field-error" role="alert">{errors[key]}</span> : null;

  return <form action={createJobAction} className="wizard wizard-compact" onSubmit={(event) => {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
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
      {steps.map((label, index) => <button key={label} type="button" className={`wizard-step ${index === step ? "active" : ""} ${index < step ? "complete" : ""}`} onClick={() => index <= step ? setStep(index) : undefined}>
        <span className="wizard-number">{index < step ? <CheckCircle2 size={15}/> : index + 1}</span><span>{label}</span>
      </button>)}
    </aside>

    <div className="wizard-panel">
      <div className="wizard-head row-between wrap">
        <div><div className="wizard-step-label">Step {step + 1} of 4</div><h2>{steps[step]}</h2>{requestedVaName ? <p className="small muted wizard-requested">Requested VA: <strong>{requestedVaName}</strong>. We will keep this preference attached to the role.</p> : null}</div>
        <div className="wizard-save"><span>{savedAt ? `Draft saved on this device at ${savedAt}` : "Local autosave is on"}</span><button className="btn btn-sm" name="submit_mode" value="draft" type="submit">Save & exit</button></div>
      </div>
      {Object.keys(errors).length ? <div className="alert" role="alert" style={{marginBottom:18}}>Please fix the highlighted fields before continuing.</div> : null}

      {step===0?<div className="brief-helper"><div><span className="small">Need a starting point?</span><strong>Describe the work in your own words, then we’ll help shape a clear hiring brief.</strong></div><button type="button" className="btn btn-sm" onClick={prepareBrief}><Sparkles size={15}/> Prepare a starter brief</button></div>:null}

      {step === 0 && isBlankDraft ? <section className="role-template-picker">
        <div><strong>Start from a common role</strong><p className="small muted">Fills in the title, specialty, skills, tools and a draft description. You can edit every field afterwards — or just start typing below to write your own.</p></div>
        <div className="role-template-grid">{ROLE_TEMPLATES.map((template) => <button type="button" key={template.id} className="role-template-card" onClick={() => applyTemplate(template)}><strong>{template.label}</strong><small>{template.blurb}</small></button>)}</div>
      </section> : null}

      {step === 0 ? <div className="form-grid">
        <div className="field span-2"><label>Role title</label><input value={data.title} onChange={(e) => set("title", e.target.value)} placeholder="Executive Assistant to Founder" autoFocus aria-invalid={Boolean(errors.title)}/>{error("title")}</div>
        <div className="field"><label>Company name <span className="muted">(optional)</span></label><input value={data.company_name} onChange={(e) => set("company_name", e.target.value)} placeholder="Acme Studio"/></div>
        <div className="field"><label>When do you want them to start?</label><input value={data.start_timing} onChange={(e) => set("start_timing", e.target.value)} placeholder="Within 2 weeks"/></div>
        <div className="field span-2"><label>Specialty <span className="muted">(choose up to 3)</span></label><div className="category-picker category-picker-tight">{VA_CATEGORIES.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip ${selectedCategories.includes(item) ? "selected" : ""}`} onClick={() => toggleCategory(item)} disabled={!selectedCategories.includes(item) && selectedCategories.length >= 3}>{selectedCategories.includes(item) ? <Check size={13}/> : null}{item}</button>)}</div>{error("categories")}</div>
        <div className="field span-2"><label>What should this person own?</label><textarea className="textarea-compact" value={data.summary} onChange={(e) => set("summary", e.target.value)} placeholder="Own my inbox and calendar, coordinate weekly meetings, prepare follow-ups, and keep action items moving." aria-invalid={Boolean(errors.summary)}/>{error("summary")}</div>
        <div className="field span-2"><label>Required skills</label><input value={data.required_skills} onChange={(e) => set("required_skills", e.target.value)} placeholder="Calendar management, inbox management, research"/><div className="suggestion-chips">{COMMON_SKILLS.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip compact ${hasCsvItem("required_skills", item) ? "selected" : ""}`} onClick={() => toggleCsvItem("required_skills", item)}>{item}</button>)}</div>{error("required_skills")}</div>
        <div className="field span-2"><label>Tools they should know <span className="muted">(optional)</span></label><input value={data.required_tools} onChange={(e) => set("required_tools", e.target.value)} placeholder="Google Workspace, Slack, Notion"/><div className="suggestion-chips">{COMMON_TOOLS.map((item, index) => <button type="button" key={`${String(item)}-${index}`} className={`category-chip compact ${hasCsvItem("required_tools", item) ? "selected" : ""}`} onClick={() => toggleCsvItem("required_tools", item)}>{item}</button>)}</div></div>
      </div> : null}

      {step === 1 ? <div className="form-grid">
        <div className="field span-2"><label>Role details</label><textarea value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe the team, recurring work, priorities, and what good performance looks like after the first month." aria-invalid={Boolean(errors.description)}/>{error("description")}</div>
        <div className="field span-2"><label>Key responsibilities <span className="muted">(one per line)</span></label><textarea className="textarea-compact" value={data.responsibilities} onChange={(e) => set("responsibilities", e.target.value)} placeholder={'Manage calendar and meeting requests\nTriage inbox and draft replies\nTrack follow-ups and weekly priorities'} aria-invalid={Boolean(errors.responsibilities)}/>{error("responsibilities")}</div>
        <div className="field"><label>Hours per week</label><input type="number" min="1" max="80" value={data.hours_per_week} onChange={(e) => set("hours_per_week", e.target.value)} aria-invalid={Boolean(errors.hours_per_week)}/>{error("hours_per_week")}</div>
        <div className="field"><label>Expected engagement</label><select value={data.engagement_length} onChange={(e) => set("engagement_length", e.target.value)}><option>Long-term preferred</option><option>3 to 6 months</option><option>1 to 3 months</option><option>Project-based</option></select></div><div className="field"><label>Experience level</label><select value={data.experience_level} onChange={(e) => set("experience_level", e.target.value)}><option value="entry">Entry</option><option value="intermediate">Intermediate</option><option value="senior">Senior</option><option value="expert">Expert / niche</option></select></div>
        <div className="field"><label>Timezone / working region</label><input value={data.timezone} onChange={(e) => set("timezone", e.target.value)} placeholder="US Eastern" aria-invalid={Boolean(errors.timezone)}/>{error("timezone")}</div>
        <div className="field"><label>Live overlap per day</label><select value={data.overlap_hours} onChange={(e) => set("overlap_hours", e.target.value)}><option value="0">No required overlap</option><option value="2">2 hours</option><option value="4">4 hours</option><option value="6">6 hours</option><option value="8">8 hours</option></select>{error("overlap_hours")}</div>
        {Number(data.overlap_hours) > 4 ? <label className="checkbox-card span-2"><input type="checkbox" checked={data.live_coverage_exception} onChange={(e) => set("live_coverage_exception", e.target.checked)}/><span><strong>This role genuinely needs more than 4 hours of live coverage.</strong><small>Use this for reception, outbound calling, dispatch, appointments, or other real-time work.</small></span></label> : null}
        <div className="field span-2"><label>Schedule notes <span className="muted">(optional)</span></label><textarea className="textarea-mini" value={data.schedule_notes} onChange={(e) => set("schedule_notes", e.target.value)} placeholder="Core meetings are 9–11am ET; the rest of the work can be flexible."/></div>
      </div> : null}

      {step === 2 ? <div className="stack wizard-budget-step">
        <div className="budget-guidance"><div className="budget-guidance-head"><DollarSign size={20}/><div><strong>Set a realistic VA budget</strong><span>Rates are VA compensation. Your VirtualAssistant.com.ph service fee is shown separately before publication.</span></div></div><div className="budget-guidance-grid">{BUDGET_GUIDANCE.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.range}</strong><small>{item.note}</small></div>)}</div></div>
        <div className="form-grid">
          <div className="field"><label>Minimum hourly rate, USD</label><input type="number" min={MIN_HOURLY_RATE} step="0.01" value={data.min_hourly_rate} onChange={(e) => set("min_hourly_rate", e.target.value)} aria-invalid={Boolean(errors.min_hourly_rate)}/>{error("min_hourly_rate")}</div>
          <div className="field"><label>Maximum hourly rate, USD <span className="muted">(optional)</span></label><input type="number" min={MIN_HOURLY_RATE} step="0.01" value={data.max_hourly_rate} onChange={(e) => set("max_hourly_rate", e.target.value)} placeholder="12" aria-invalid={Boolean(errors.max_hourly_rate)}/>{error("max_hourly_rate")}</div>
        </div>
        {monthlyLow ? <div className="estimate-strip"><span>Estimated VA compensation</span><strong>${monthlyLow.toLocaleString()}{monthlyHigh > monthlyLow ? `–$${monthlyHigh.toLocaleString()}` : "+"}/month</strong><small>Based on {hours} hrs/week × 4.33 weeks. Service fees are separate.</small></div> : null}
        <div><h3 className="wizard-subhead">Choose your hiring support</h3><div className="service-model-grid"><label className={`service-model-card ${data.service_model === "curated_placement" ? "selected" : ""}`}><input type="radio" checked={data.service_model === "curated_placement"} onChange={() => set("service_model", "curated_placement")}/><span><strong>Curated placement</strong><small>We recruit and vet. Your team manages the VA after hiring.</small></span></label><label className={`service-model-card ${data.service_model === "managed_service" ? "selected" : ""}`}><input type="radio" checked={data.service_model === "managed_service"} onChange={() => set("service_model", "managed_service")}/><span><strong>Managed VA service</strong><small>Recruiting plus continued placement and operating support.</small></span></label></div></div>
        <div className="field"><label>First-week onboarding plan</label><textarea className="textarea-compact" value={data.onboarding_plan} onChange={(e) => set("onboarding_plan", e.target.value)} placeholder="Day 1: tools and access. Days 2–3: SOP walkthrough and examples. End of week: review priorities, questions, and feedback." aria-invalid={Boolean(errors.onboarding_plan)}/>{error("onboarding_plan")}</div>
        <label className="inline-check"><input type="checkbox" checked={data.direct_feedback} onChange={(e) => set("direct_feedback", e.target.checked)}/><span>The VA will have direct access to a manager for priorities and feedback.</span></label>
      </div> : null}

      {step === 3 ? <div className="stack">
        <div className="review-hero"><div className="review-icon"><FileText size={22}/></div><div><span>Ready for review</span><h3>{data.title || "Untitled role"}</h3><p>{data.summary || "Add a summary before submitting."}</p></div></div>
        <div className="review-grid">
          <div><span>Specialty</span><strong>{selectedCategories.join(" · ") || "Not set"}</strong></div>
          <div><span>Schedule</span><strong>{data.hours_per_week || "—"} hrs/week · {data.timezone || "Flexible"}</strong></div><div><span>Experience</span><strong>{data.experience_level.charAt(0).toUpperCase()+data.experience_level.slice(1)}</strong></div>
          <div><span>VA budget</span><strong>${data.min_hourly_rate || MIN_HOURLY_RATE}{data.max_hourly_rate ? `–$${data.max_hourly_rate}` : "+"}/hr</strong></div>
          <div><span>Hiring support</span><strong>{data.service_model === "managed_service" ? "Managed VA service" : "Curated placement"}</strong></div>
        </div>
        <div className="card review-section"><div className="row-between"><h3>Skills & tools</h3><button className="text-button" type="button" onClick={() => setStep(0)}>Edit</button></div><div className="pill-list">{mergeUniqueStrings(data.required_skills.split(","), data.required_tools.split(",")).map((x, index) => <span className="badge" key={`${String(x)}-${index}`}>{x}</span>)}</div></div>
        <div className="card review-section"><div className="row-between"><h3>What happens next</h3><Sparkles size={18}/></div><ul className="check-list compact"><li>We review the role before anything is published.</li><li>Your service fee is shown separately from VA compensation.</li><li>You approve commercial terms before the role goes live.</li><li>Recruiter/Admin matching can create a ranked shortlist before applications arrive.</li></ul></div>
      </div> : null}

      <div className="wizard-actions">
        <button className="btn" type="button" disabled={step === 0} onClick={() => { setErrors({}); setStep((current) => Math.max(0, current - 1)); }}>Back</button>
        <div className="row wrap wizard-actions-right">{step < steps.length - 1 ? <button className="btn btn-primary" type="button" onClick={nextStep}>Continue</button> : <button className="btn btn-primary" name="submit_mode" value="submit" type="submit">Post job for recruiting review</button>}</div>
      </div>
    </div>
  </form>;
}
