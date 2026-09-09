"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { submitServiceMatchAction, type ServiceMatchState } from "@/app/actions/leads";

const initialState: ServiceMatchState = { status: "idle" };

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
    try {
      const key = "va_ph_session";
      let value = window.sessionStorage.getItem(key);
      if (!value) {
        value = crypto.randomUUID();
        window.sessionStorage.setItem(key, value);
      }
      setSessionId(value);
    } catch {
      // The form works without analytics/session storage.
    }
  }, []);

  if (state.status === "success") {
    return <aside className="service-match-card service-match-success" id="match-request" aria-live="polite">
      <div className="service-match-success-icon"><CheckCircle2 size={28} /></div>
      <div className="kicker">Request received</div>
      <h2>Your private job draft is ready.</h2>
      <p>{state.message || "We will use your request to identify relevant approved talent and the next best step."}</p>
      <div className="stack service-match-success-actions">
        {state.clientLinked && state.jobId ? (
          <Link className="btn btn-primary btn-lg" href={`/workspace/client/jobs/${encodeURIComponent(state.jobId)}?created_from_match=1`}>Open private job draft <ArrowRight size={16} /></Link>
        ) : (
          <Link className="btn btn-primary btn-lg" href={`/auth/join/client${state.leadId ? `?lead=${encodeURIComponent(state.leadId)}` : ""}`}>Create client account and claim job <ArrowRight size={16} /></Link>
        )}
        <Link className="btn btn-lg" href={talentHref}>Browse relevant Virtual Assistants</Link>
        {!state.clientLinked && state.leadId ? <Link className="small text-link service-match-login" href={`/auth/login?lead=${encodeURIComponent(state.leadId)}&next=${encodeURIComponent("/workspace/client")}`}>Already have a client account? Log in</Link> : null}
      </div>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>Your job draft stays private until you review and publish it.</span></div>
    </aside>;
  }

  return <aside className="service-match-card" id="match-request">
    <div className="service-match-head">
      <div className="kicker">Free match request</div>
      <h2>Tell us what you need handled.</h2>
      <p>Share the workload. We will use it to match you with relevant approved talent.</p>
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
        {pending ? "Sending request..." : "Get matched"} {!pending ? <ArrowRight size={17} /> : null}
      </button>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>No obligation. No spam. Your details stay confidential.</span></div>
    </form>
  </aside>;
}
