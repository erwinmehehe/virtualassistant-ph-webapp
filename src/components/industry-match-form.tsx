"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { submitIndustryMatchAction, type ServiceMatchState } from "@/app/actions/leads";
import { getBrowserSessionId } from "@/lib/browser-session";

const initialState: ServiceMatchState = { status: "idle" };
const HIRING_CALL_URL = "/book-client-call";

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
    return <aside className="service-match-card service-match-success industry-match-card service-match-compact" id="industry-match-request" aria-live="polite">
      <div className="service-match-success-icon"><CheckCircle2 size={28} /></div>
      <h2>Your request is with our recruiting team.</h2>
      <p>{state.message || "We will review the role and point you to relevant approved talent."}</p>
      <div className="stack service-match-success-actions">
        <a className="btn btn-primary btn-lg" href={HIRING_CALL_URL} data-track="booking_click">Book a client discovery call <ArrowRight size={16} /></a>
        {state.clientLinked && state.jobId ? <Link className="btn btn-lg" href={`/workspace/client/jobs/${encodeURIComponent(state.jobId)}?created_from_match=1`}>Open role in Client Portal <ArrowRight size={16} /></Link> : null}
        <Link className="btn btn-lg" href={talentHref}>Browse relevant Virtual Assistants <ArrowRight size={16} /></Link>
      </div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>Your request stays private while our team reviews it.</span></div>
    </aside>;
  }

  return <aside className="service-match-card industry-match-card service-match-compact" id="industry-match-request">
    <div className="service-match-head">
      <div className="kicker">Quick match</div>
      <h2>Want help narrowing the list?</h2>
      <p>Tell us where to follow up. We already know you are looking for {industryLabel.toLowerCase()} support.</p>
    </div>

    <div className="service-match-divider" />

    <form action={formAction} className="service-match-form service-match-form-compact">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="source_path" value={sourcePath || `/industries/${slug}/`} />
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="hours" value="Not sure yet" />
      <input type="hidden" name="message" value={`Interested in ${industryLabel} Virtual Assistant support. ${example}`} />
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      {state.status === "error" ? <div className="alert" role="alert">{state.message}</div> : null}

      <fieldset className="service-match-task-fieldset service-match-task-fieldset-compact">
        <legend>What would you like help with? <span className="muted">Optional</span></legend>
        <div className="service-task-chips">{workflows.slice(0, 4).map((workflow,index)=><label className="service-task-chip" key={`${String(workflow)}-${index}`}><input type="checkbox" name="tasks" value={workflow}/><span>{titleCase(workflow)}</span></label>)}</div>
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

      <button className="btn btn-lg service-match-submit" type="submit" disabled={pending} data-track={`industry_${slug.replaceAll("-", "_")}_match`}>
        {pending ? "Sending request..." : "Get matched"} {!pending ? <ArrowRight size={17} /> : null}
      </button>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>About 20 seconds. No account required. No obligation.</span></div>
    </form>
  </aside>;
}
