"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { submitIndustryMatchAction, type ServiceMatchState } from "@/app/actions/leads";
import { getBrowserSessionId } from "@/lib/browser-session";

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
    setSessionId(getBrowserSessionId());
  }, []);

  if (state.status === "success") {
    return <aside className="service-match-card service-match-success industry-match-card" id="industry-match-request" aria-live="polite">
      <div className="service-match-success-icon"><CheckCircle2 size={28} /></div>
      <h2>Your hiring request is with our recruiting team.</h2>
      <p>{state.message || "We will use your request to identify relevant approved talent and the next best step."}</p>
      <div className="stack service-match-success-actions">
        {state.clientLinked && state.jobId ? <Link className="btn btn-lg" href={`/workspace/client/jobs/${encodeURIComponent(state.jobId)}?created_from_match=1`}>Open role in Client Portal <ArrowRight size={16} /></Link> : null}
        <Link className="btn btn-primary btn-lg" href={talentHref}>Browse relevant Virtual Assistants while we review <ArrowRight size={16} /></Link>
        {!state.clientLinked ? <Link className="small text-link service-match-login" href="/auth/login?next=%2Fworkspace%2Fclient">Already a client? Open Client Portal</Link> : null}
      </div>
      <div className="service-match-next"><strong>What happens next</strong><span>Our recruiting team reviews the role, refines the matching criteria, and follows up with the strongest next step.</span></div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>Your hiring request stays private while our team reviews it.</span></div>
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
        {pending ? "Sending request..." : "Start my search"} {!pending ? <ArrowRight size={17} /> : null}
      </button>
      <div className="service-match-next"><strong>After you submit</strong><span>Our recruiting team reviews the workload and uses it to screen relevant approved Virtual Assistants.</span></div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>No obligation. Your details stay confidential.</span></div>
    </form>
  </aside>;
}
