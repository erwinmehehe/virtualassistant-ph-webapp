"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, LockKeyhole } from "lucide-react";
import { submitServiceMatchAction, type ServiceMatchState } from "@/app/actions/leads";
import { getBrowserSessionId } from "@/lib/browser-session";

const initialState: ServiceMatchState = { status: "idle" };
const HIRING_CALL_URL = "/book-client-call";

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
    return <aside className="service-match-card service-match-success service-match-compact" id="match-request" aria-live="polite">
      <div className="service-match-success-icon"><CheckCircle2 size={28} /></div>
      <div className="kicker">Request received</div>
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

  return <aside className="service-match-card service-match-compact" id="match-request">
    <div className="service-match-head">
      <div className="kicker">Quick match</div>
      <h2>Want us to narrow the list?</h2>
      <p>Tell us where to follow up. We already know you are looking for {displayRole} Virtual Assistant support.</p>
    </div>

    <div className="service-match-divider" />

    <form action={formAction} className="service-match-form service-match-form-compact">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="source_path" value={sourcePath || `/service/${slug}/`} />
      <input type="hidden" name="session_id" value={sessionId} />
      <input type="hidden" name="hours" value="Not sure yet" />
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

      <div className="field service-match-message-field">
        <label htmlFor={`${id}-message`}>What should this VA own? *</label>
        <textarea
          id={`${id}-message`}
          className="service-match-message"
          name="message"
          rows={3}
          required
          minLength={10}
          maxLength={3000}
          defaultValue={example}
        />
        <small>Pre-filled from this {displayRole} page. Edit it if your scope is different.</small>
      </div>

      <button className="btn btn-lg service-match-submit" type="submit" disabled={pending} data-track={`service_${slug.replaceAll("-", "_")}_match`}>
        {pending ? "Sending request..." : "Get matched"} {!pending ? <ArrowRight size={17} /> : null}
      </button>
      <div className="service-match-privacy"><LockKeyhole size={14} /><span>About 20 seconds. No account required. No obligation.</span></div>
    </form>
  </aside>;
}
