"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { submitIndustryMatchAction, type ServiceMatchState } from "@/app/actions/leads";

const initialState: ServiceMatchState = { status: "idle" };

function titleCase(value: string) {
  return value.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function IndustryMatchForm({
  slug,
  industryLabel,
  example,
  talentHref,
  workflows,
  sourcePath
}: {
  slug: string;
  industryLabel: string;
  example: string;
  talentHref: string;
  workflows: string[];
  sourcePath?: string;
}) {
  const [state, formAction, pending] = useActionState(submitIndustryMatchAction, initialState);
  const id = `industry-match-${slug}`;
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    try {
      const key = "va_ph_session";
      let value = window.sessionStorage.getItem(key);
      if (!value) {
        value = crypto.randomUUID();
        window.sessionStorage.setItem(key, value);
      }
      setSessionId(value);
    } catch {
      // The form remains usable when session storage is unavailable.
    }
  }, []);

  if (state.status === "success") {
    return <aside className="service-match-card service-match-success industry-match-card" id="industry-match-request" aria-live="polite">
      <div className="service-match-success-icon"><CheckCircle2 size={28} /></div>
      <h2>Your private job draft is ready.</h2>
      <p>{state.message || "We will use your request to identify relevant approved talent and the next best step."}</p>
      <div className="stack service-match-success-actions">
        {state.clientLinked && state.jobId ? (
          <Link className="btn btn-primary btn-lg" href={`/workspace/client/jobs/${encodeURIComponent(state.jobId)}?created_from_match=1`}>Open private job draft <ArrowRight size={16} /></Link>
        ) : (
          <Link className="btn btn-primary btn-lg" href={`/auth/join/client${state.leadId ? `?lead=${encodeURIComponent(state.leadId)}` : ""}`}>Claim your job draft <ArrowRight size={16} /></Link>
        )}
        <Link className="btn btn-lg" href={talentHref}>Browse relevant Virtual Assistants</Link>
        {!state.clientLinked && state.leadId ? <Link className="small text-link service-match-login" href={`/auth/login?lead=${encodeURIComponent(state.leadId)}&next=${encodeURIComponent("/workspace/client")}`}>Already have a client account? Log in</Link> : null}
      </div>
      <div className="service-match-next"><strong>What happens next</strong><span>The role stays private while you review it. A recruiter can refine the scope and matching criteria before anything is published.</span></div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>Your job draft stays private until you review and publish it.</span></div>
    </aside>;
  }

  return <aside className="service-match-card industry-match-card" id="industry-match-request">
    <div className="service-match-head">
      <h2>Get matched for your {industryLabel.toLowerCase()} workflow.</h2>
      <p>Pick the work that needs ownership, then add any context that matters.</p>
    </div>

    <div className="service-match-divider" />

    <form action={formAction} className="service-match-form">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="source_path" value={sourcePath || `/industries/${slug}/`} />
      <input type="hidden" name="session_id" value={sessionId} />
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      {state.status === "error" ? <div className="alert" role="alert">{state.message}</div> : null}

      <fieldset className="service-match-task-fieldset">
        <legend>What should the Virtual Assistant help with?</legend>
        <div className="service-task-chips">{workflows.slice(0, 6).map((workflow,index)=><label className="service-task-chip" key={`${String(workflow)}-${index}`}><input type="checkbox" name="tasks" value={workflow}/><span>{titleCase(workflow)}</span></label>)}</div>
      </fieldset>

      <div className="service-match-name-grid">
        <div className="field">
          <label htmlFor={`${id}-name`}>First name *</label>
          <input id={`${id}-name`} name="name" required maxLength={100} autoComplete="given-name" placeholder="Your first name" />
        </div>
        <div className="field">
          <label htmlFor={`${id}-email`}>Work email *</label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-hours`}>Hours needed per week *</label>
        <select id={`${id}-hours`} name="hours" required defaultValue="">
          <option value="" disabled>Select an estimate</option>
          <option>Under 10 hours/week</option>
          <option>10 to 20 hours/week</option>
          <option>20 to 30 hours/week</option>
          <option>30 to 40 hours/week</option>
          <option>40+ hours/week</option>
          <option>Not sure yet</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor={`${id}-message`}>Anything else we should know? <span className="muted">(optional if you picked a workflow)</span></label>
        <textarea id={`${id}-message`} name="message" maxLength={3000} placeholder={`Example: ${example}`} />
      </div>

      <button className="btn btn-lg service-match-submit" type="submit" disabled={pending} data-track={`industry_${slug.replaceAll("-", "_")}_match`}>
        {pending ? "Sending request..." : "Get matched"} {!pending ? <ArrowRight size={17} /> : null}
      </button>
      <div className="service-match-next"><strong>After you submit</strong><span>We create a private draft from your answers. You review the role and matching criteria before anything can be published.</span></div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>No obligation. Your details stay confidential.</span></div>
    </form>
  </aside>;
}
