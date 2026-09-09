"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { submitServiceMatchAction, type ServiceMatchState } from "@/app/actions/leads";
import { getBrowserSessionId } from "@/lib/browser-session";

const initialState: ServiceMatchState = { status: "idle" };
const HIRING_CALL_URL = "https://calendar.app.google/FxedmioyeJhKras87";

export function ServiceMatchForm({
  slug,
  category,
  roleLabel,
  example,
  talentHref,
  sourcePath
}: {
  slug: string;
  category: string;
  roleLabel: string;
  example: string;
  talentHref: string;
  sourcePath?: string;
}) {
  const [state, formAction, pending] = useActionState(submitServiceMatchAction, initialState);
  const id = `service-match-${slug}`;
  const displayRole = roleLabel === roleLabel.toUpperCase() ? roleLabel : roleLabel.toLowerCase();
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    setSessionId(getBrowserSessionId());
  }, []);

  if (state.status === "success") {
    return <aside className="service-match-card service-match-success" id="match-request" aria-live="polite">
      <div className="service-match-success-icon"><CheckCircle2 size={28} /></div>
      <div className="kicker">Request received</div>
      <h2>Your hiring request is with our recruiting team.</h2>
      <p>{state.message || "We will use your request to identify relevant approved talent and the next best step."}</p>
      <div className="stack service-match-success-actions">
        <a className="btn btn-primary btn-lg" href={HIRING_CALL_URL} target="_blank" rel="noopener noreferrer">Book a 15-minute hiring call <ArrowRight size={16} /></a>
        {state.clientLinked && state.jobId ? <Link className="btn btn-lg" href={`/workspace/client/jobs/${encodeURIComponent(state.jobId)}?created_from_match=1`}>Open role in Client Portal <ArrowRight size={16} /></Link> : null}
        <Link className="btn btn-lg" href={talentHref}>Browse relevant Virtual Assistants while we review <ArrowRight size={16} /></Link>
        {!state.clientLinked ? <Link className="small text-link service-match-login" href="/auth/login?next=%2Fworkspace%2Fclient">Already a client? Open Client Portal</Link> : null}
      </div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>Your hiring request stays private while our team reviews it.</span></div>
    </aside>;
  }

  return <aside className="service-match-card" id="match-request">
    <div className="service-match-head">
      <div className="kicker">Free match request</div>
      <h2>Tell us what you need handled.</h2>
      <p>Share the workload. Our recruiting team will review it and screen relevant approved Virtual Assistants.</p>
    </div>

    <div className="service-match-divider" />

    <form action={formAction} className="service-match-form">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="source_path" value={sourcePath || `/service/${slug}/`} />
      <input type="hidden" name="session_id" value={sessionId} />
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

      {state.status === "error" ? <div className="alert" role="alert">{state.message}</div> : null}

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
        <label htmlFor={`${id}-message`}>What should your {displayRole} Virtual Assistant own? *</label>
        <textarea id={`${id}-message`} name="message" required maxLength={3000} placeholder={`Example: ${example}`} />
      </div>

      <button className="btn btn-lg service-match-submit" type="submit" disabled={pending} data-track={`service_${slug.replaceAll("-", "_")}_match`}>
        {pending ? "Sending request..." : "Start my search"} {!pending ? <ArrowRight size={17} /> : null}
      </button>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>No obligation. No spam. Your details stay confidential.</span></div>
    </form>
  </aside>;
}
