"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarCheck, Check, LockKeyhole, Users } from "lucide-react";
import { type ServiceMatchState } from "@/app/actions/leads";
import {
  submitIndustryMatchWithAiAction,
  submitRoleBriefWithAiAction,
  submitServiceMatchWithAiAction
} from "@/app/actions/ai-leads";
import { submitMatchFeedbackAction, type MatchFeedbackState } from "@/app/actions/match-feedback";
import { MATCH_FEEDBACK_OPTIONS } from "@/lib/match-feedback";
import { type TopMatch } from "@/lib/talent-preview";
import { AttributionFields } from "@/components/attribution-fields";
import { PublicAvatar } from "@/components/public-avatar";
import { FormDraftPersistence } from "@/components/form-draft-persistence";
import { getBrowserSessionId } from "@/lib/browser-session";
import { MIN_HOURLY_RATE, VA_CATEGORIES } from "@/lib/constants";

/**
 * The one hiring form used across the site's hiring pages (service, software,
 * industry, pricing). Step 1 is a short brief; step 2 is the client account,
 * with a discovery call offered as the alternative. Each variant still posts to
 * its original server action so CRM source tags, duplicate protection, and
 * analytics stay unchanged.
 */

const BOOKING_URL = "/book-client-call";
const HOURS = ["Under 10 hours/week", "10 to 20 hours/week", "20 to 30 hours/week", "30 to 40 hours/week", "40+ hours/week", "Not sure yet"];
const BUDGETS = [`USD ${MIN_HOURLY_RATE} to 8/hour`, "USD 8 to 12/hour", "USD 12 to 18/hour", "USD 18 to 25/hour", "USD 25+/hour", "Not sure yet"];
const initialState: ServiceMatchState = { status: "idle" };
const initialFeedbackState: MatchFeedbackState = { status: "idle" };

type Variant =
  | { variant: "service"; slug: string; category: string; roleLabel: string; example: string; talentHref: string; sourcePath?: string }
  | { variant: "industry"; slug: string; industryLabel: string; example: string; talentHref: string; sourcePath?: string }
  | { variant: "general"; sourcePath: string } & GeneralOptions;

type GeneralOptions = {
  title?: string;
  /** Prefills, e.g. from /hire?category=...&hours=... links. */
  defaultCategory?: string;
  defaultHours?: string;
  defaultBudget?: string;
  /** Talent introduction / shortlist requests from the directory. */
  talent?: string;
  shortlist?: string;
  defaultStartTime?: string;
};

function Steps({ done }: { done: boolean }) {
  return (
    <ol className="hb-steps" aria-label="Two steps">
      <li className={done ? "is-done" : "is-active"}><span>{done ? <Check size={12} strokeWidth={3} /> : 1}</span>Brief</li>
      <li className={done ? "is-active" : ""}><span>2</span>Your account</li>
    </ol>
  );
}

type TopMatchesResponse = { matches?: TopMatch[]; total?: number; exact?: boolean };

/**
 * One tap to say why the sampled profiles missed. A client who does not warm
 * to them would otherwise leave without telling anyone; this reaches the
 * recruiter before the first call. Each chip submits on click.
 */
function MatchFeedback({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(submitMatchFeedbackAction, initialFeedbackState);

  if (state.status === "saved") {
    return <p className="hb-feedback-done"><Check size={13} strokeWidth={3} />Got it. Your recruiter will factor that in.</p>;
  }

  return (
    <form action={formAction} className="hb-feedback">
      <input type="hidden" name="lead" value={leadId} />
      <span>Not quite right?</span>
      <div className="hb-feedback-chips">
        {MATCH_FEEDBACK_OPTIONS.map((option) => (
          <button key={option.value} type="submit" name="reason" value={option.value} disabled={pending} data-track={`match_feedback_${option.value}`}>
            {option.label}
          </button>
        ))}
      </div>
      {state.status === "error" ? <p className="hb-feedback-error" role="alert">{state.message}</p> : null}
    </form>
  );
}

/**
 * A sample of the approved pool, shown the moment a brief lands. These are
 * deliberately framed as examples with a pool size next to them: the recruiter
 * still builds the real shortlist, so three faces the client does not warm to
 * cannot read as "that is all you have".
 */
function TopMatches({ category, leadId }: { category?: string; leadId?: string }) {
  const [pool, setPool] = useState<TopMatchesResponse | null>(null);

  useEffect(() => {
    let active = true;
    const query = category ? `?category=${encodeURIComponent(category)}` : "";
    fetch(`/api/talent/top-matches${query}`)
      .then((response) => (response.ok ? response.json() : {}))
      .then((data: TopMatchesResponse) => { if (active) setPool(data); })
      .catch(() => { if (active) setPool({}); });
    return () => { active = false; };
  }, [category]);

  const matches = pool?.matches;
  if (!matches?.length) return null;

  // Only name the specialty when all three really came from it.
  const scope = pool?.exact && category ? `${category.toLowerCase()} ` : "";
  const total = Number(pool?.total || 0);
  const browseHref = pool?.exact && category ? `/find-talent?category=${encodeURIComponent(category)}` : "/find-talent";

  return (
    <div className="hb-matches">
      <p className="hb-matches-head">
        <Users size={14} />
        {total > matches.length
          ? `${matches.length} of ${total} approved ${scope}VAs`
          : `${matches.length} approved ${scope}VAs`}
      </p>
      <ul>
        {matches.map((match) => (
          <li key={match.id}>
            <PublicAvatar name={match.name} src={match.avatarUrl} size="sm" />
            <div>
              <strong>{match.name}</strong>
              <span>{match.headline}</span>
              <em>{match.yearsExperience} yrs experience{match.weeklyHours ? ` · ${match.weeklyHours} hrs/week` : ""}</em>
            </div>
          </li>
        ))}
      </ul>
      <p className="hb-matches-note">Examples only. Your recruiter builds your shortlist from the brief you just sent.</p>
      {leadId ? <MatchFeedback leadId={leadId} /> : null}
      <Link className="hb-matches-all" href={browseHref}>
        {total > matches.length ? `Browse all ${total} approved profiles` : "Browse approved profiles"} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Success({ message, category, leadId, jobId, clientLinked }: { message?: string; category?: string; leadId?: string; jobId?: string; clientLinked?: boolean }) {
  const next = jobId ? `/workspace/client/jobs/${jobId}` : "/workspace/client";
  const joinParams = new URLSearchParams(leadId ? { lead: leadId, next } : { next });
  const accountHref = clientLinked ? `${next}?created_from_match=1` : `/auth/join/client?${joinParams.toString()}`;

  return (
    <div className="hb-card hb-success" aria-live="polite">
      <Steps done />
      <div className="hb-success-icon"><Check size={22} strokeWidth={3} /></div>
      <h2>Brief received.</h2>
      <p>{message || "Our recruiting team is reviewing your brief and will confirm availability before presenting anyone to you."}</p>
      <TopMatches category={category} leadId={leadId} />
      <a className="hb-submit" href={accountHref} data-track={clientLinked ? "portal_click" : "join_client_click"}>
        {clientLinked ? "Open your Client Portal" : "Create my account"} <ArrowRight size={16} />
      </a>
      <p className="hb-success-hint">Your account keeps this request, your shortlist, and candidate profiles in one place, so matching moves faster.</p>
      <a className="hb-secondary" href={BOOKING_URL} data-track="booking_click"><CalendarCheck size={15} />Book a 20-minute call instead</a>
    </div>
  );
}

function Fields({ id, messageMin, placeholder, defaultHours = "", defaultBudget = "" }: { id: string; messageMin: number; placeholder: string; defaultHours?: string; defaultBudget?: string }) {
  return (
    <>
      <div className="hb-row">
        <div className="hb-field">
          <label htmlFor={`${id}-name`}>First name</label>
          <input id={`${id}-name`} name="name" required maxLength={100} autoComplete="given-name" placeholder="Your first name" />
        </div>
        <div className="hb-field">
          <label htmlFor={`${id}-email`}>Work email</label>
          <input id={`${id}-email`} name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </div>
      </div>
      <div className="hb-field">
        <label htmlFor={`${id}-company`}>Company name</label>
        <input id={`${id}-company`} name="company" required maxLength={160} autoComplete="organization" placeholder="Your company" />
      </div>
      <div className="hb-row">
        <div className="hb-field">
          <label htmlFor={`${id}-hours`}>Hours per week</label>
          <select id={`${id}-hours`} name="hours" required defaultValue={HOURS.includes(defaultHours) ? defaultHours : ""}>
            <option value="" disabled>Select hours</option>
            {HOURS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>
        <div className="hb-field">
          <label htmlFor={`${id}-budget`}>Hourly budget</label>
          <select id={`${id}-budget`} name="budget" required defaultValue={BUDGETS.includes(defaultBudget) ? defaultBudget : ""}>
            <option value="" disabled>Select budget</option>
            {BUDGETS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="hb-field">
        <label htmlFor={`${id}-message`}>What should your VA handle?</label>
        <textarea id={`${id}-message`} name="message" rows={3} required minLength={messageMin} maxLength={3000} placeholder={placeholder} />
      </div>
      <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    </>
  );
}

function Head({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="hb-head">
      <Steps done={false} />
      <h2>{title}</h2>
      <p>{sub}</p>
    </div>
  );
}

function Foot() {
  return <p className="hb-foot"><LockKeyhole size={13} />Private request · No obligation · About 30 seconds</p>;
}

function MatchVariant(props: Extract<Variant, { variant: "service" | "industry" }>) {
  const action = props.variant === "service" ? submitServiceMatchWithAiAction : submitIndustryMatchWithAiAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [sessionId, setSessionId] = useState("");
  useEffect(() => { setSessionId(getBrowserSessionId()); }, []);

  if (state.status === "success") {
    return <Success message={state.message} category={props.variant === "service" ? props.category : undefined} leadId={state.leadId} jobId={state.jobId} clientLinked={state.clientLinked} />;
  }

  const base = (props.variant === "service" ? props.roleLabel : props.industryLabel).replace(/\s+(virtual assistants?|VAs?)$/i, "").trim();
  const label = `${/^[aeiou]/i.test(base) ? "an" : "a"} ${base} VA`;
  const sourcePath = props.sourcePath || (props.variant === "service" ? `/service/${props.slug}/` : `/industries/${props.slug}/`);
  const id = `hb-${props.variant}-${props.slug}`;

  return (
    <div className="hb-card" id="hiring-brief">
      <Head title={`Hire ${label}`} sub="Share a quick brief, and we will show you matching Filipino virtual assistants." />
      <form action={formAction} className="hb-form">
        <input type="hidden" name="slug" value={props.slug} />
        {props.variant === "service" ? <input type="hidden" name="category" value={props.category} /> : null}
        <input type="hidden" name="source_path" value={sourcePath} />
        <input type="hidden" name="session_id" value={sessionId} />
        {state.status === "error" ? <div className="hb-error" role="alert">{state.message}</div> : null}
        <Fields id={id} messageMin={10} placeholder={props.example} />
        <button className="hb-submit" type="submit" disabled={pending} data-track={`${props.variant}_${props.slug.replaceAll("-", "_")}_match`}>
          {pending ? "Matching..." : <>Get your free virtual assistant match <ArrowRight size={16} /></>}
        </button>
        <Foot />
      </form>
    </div>
  );
}

function GeneralVariant({ sourcePath, title = "Get your free virtual assistant match", defaultCategory = "", defaultHours, defaultBudget, talent, shortlist, defaultStartTime }: { sourcePath: string } & GeneralOptions) {
  const [url, setUrl] = useState<{ sent: boolean; error?: string; lead?: string; category?: string }>({ sent: false });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUrl({
      sent: params.get("sent") === "1",
      error: params.get("error") || undefined,
      lead: params.get("lead") || undefined,
      category: params.get("cat") || undefined
    });
  }, []);

  if (url.sent) return <Success category={url.category} leadId={url.lead} />;

  const id = `hb-general-${sourcePath.replace(/[^a-z0-9]+/gi, "-")}`;
  const categories: readonly string[] = VA_CATEGORIES;
  return (
    <div className="hb-card" id="hiring-brief">
      <Head title={title} sub="Share a quick brief, and we will show you matching Filipino virtual assistants." />
      <form id={id} action={submitRoleBriefWithAiAction} className="hb-form">
        <AttributionFields sourcePath={sourcePath} />
        <input type="hidden" name="timezone" value="To confirm on discovery call" />
        {talent ? <input type="hidden" name="talent" value={talent} /> : null}
        {shortlist ? <input type="hidden" name="shortlist" value={shortlist} /> : null}
        {defaultStartTime ? <input type="hidden" name="start_time" value={defaultStartTime} /> : null}
        {url.error ? <div className="hb-error" role="alert">{url.error}</div> : null}
        <div className="hb-field">
          <label htmlFor={`${id}-category`}>Type of help</label>
          <select id={`${id}-category`} name="category" required defaultValue={categories.includes(defaultCategory) ? defaultCategory : ""}>
            <option value="" disabled>Select a specialty</option>
            {VA_CATEGORIES.map((c, i) => <option key={`${c}-${i}`}>{c}</option>)}
          </select>
        </div>
        <Fields id={id} messageMin={15} placeholder="e.g. Inbox and calendar management, CRM updates, customer follow-up in HubSpot." defaultHours={defaultHours} defaultBudget={defaultBudget} />
        <button className="hb-submit" type="submit" data-track="role_brief_submit">Get your free virtual assistant match <ArrowRight size={16} /></button>
        <FormDraftPersistence formId={id} storageKey={sourcePath} />
        <Foot />
      </form>
    </div>
  );
}

export function HiringBriefForm(props: Variant) {
  if (props.variant === "general") { const { variant: _variant, ...options } = props; return <GeneralVariant {...options} />; }
  return <MatchVariant {...props} />;
}

/** Compact call-to-action used on informational pages instead of a form. */
export function DiscoveryCallCard({ title = "Ready to hire a Filipino VA?", sub = "Tell us what you need on a 20-minute discovery call. We confirm the role, hours, and budget, then shortlist vetted candidates." }: { title?: string; sub?: string }) {
  return (
    <div className="hb-card hb-cta">
      <div className="hb-success-icon"><CalendarCheck size={22} /></div>
      <h2>{title}</h2>
      <p>{sub}</p>
      <a className="hb-submit" href={BOOKING_URL} data-track="booking_click">Book a discovery call <ArrowRight size={16} /></a>
      <div className="hb-links"><Link href="/find-talent">Browse Virtual Assistants</Link><Link href="/pricing">See pricing</Link></div>
    </div>
  );
}
