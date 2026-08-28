import Link from "next/link";
import { BriefcaseBusiness, CheckCircle2, UserRoundCheck } from "lucide-react";
import { joinAction, oauthAction } from "@/app/actions/auth";
import { socialLoginEnabled } from "@/lib/social-login";
import { TurnstileWidget } from "@/components/turnstile-widget";

export function JoinAccountForm({
  role,
  error,
  talent,
  lead,
  next
}: {
  role: "client" | "va";
  error?: string;
  talent?: string;
  lead?: string;
  next?: string;
}) {
  const client = role === "client";
  const benefits = client
    ? ["Claim any match request you already sent", "Manage private job drafts and candidate shortlists", "Interview, message, and hire from one workspace"]
    : ["Build your vetted professional profile", "Complete skills and recruiter review steps", "Apply to roles and manage client conversations"];
  const switchHref = client ? "/auth/join/va" : "/auth/join/client";
  const loginParams = new URLSearchParams();
  if (next) loginParams.set("next", next);
  else if (client && talent) loginParams.set("next", `/workspace/client?talent=${talent}`);
  if (client && lead) loginParams.set("lead", lead);
  const loginHref = `/auth/login${loginParams.toString() ? `?${loginParams.toString()}` : ""}`;

  return <div className="auth-card auth-card-wide">
    <div className="auth-role-icon" aria-hidden="true">{client ? <BriefcaseBusiness size={24}/> : <UserRoundCheck size={24}/>}</div>
    <div className="kicker">{client ? "Client account" : "VA account"}</div>
    <h1>{client ? "Create your client account" : "Apply as a virtual assistant"}</h1>
    <p className="muted auth-intro">{client
      ? "Hire vetted Filipino VAs, keep your role briefs organized, and manage candidates in one private workspace."
      : "Create your candidate account to complete vetting, build your profile, and apply for matching VA opportunities."}</p>

    {lead && client ? <div className="success-banner small">Use the same email address from your match request. We will attach the private job draft to this account after signup.</div> : null}
    {talent && client ? <div className="success-banner small">The VA profile you requested will stay attached to your hiring path.</div> : null}
    {error ? <p className="alert" role="alert">{error}</p> : null}

    <div className="auth-benefits" aria-label={client ? "Client account benefits" : "VA account benefits"}>
      {benefits.map((item, index) => <div key={`${String(item)}-${index}`}><CheckCircle2 size={16}/><span>{item}</span></div>)}
    </div>

    {client && socialLoginEnabled() ? <><div className="auth-social-stack" aria-label="Social sign up options">
      <form action={oauthAction}>
        <input type="hidden" name="provider" value="google"/>
        <input type="hidden" name="role" value="client"/>
        {talent ? <input type="hidden" name="talent" value={talent}/> : null}
        {lead ? <input type="hidden" name="lead" value={lead}/> : null}
        {next ? <input type="hidden" name="next" value={next}/> : null}
        <button className="btn auth-social-btn" type="submit">Continue with Google</button>
      </form>
      <form action={oauthAction}>
        <input type="hidden" name="provider" value="azure"/>
        <input type="hidden" name="role" value="client"/>
        {talent ? <input type="hidden" name="talent" value={talent}/> : null}
        {lead ? <input type="hidden" name="lead" value={lead}/> : null}
        {next ? <input type="hidden" name="next" value={next}/> : null}
        <button className="btn auth-social-btn" type="submit">Continue with Microsoft</button>
      </form>
    </div><div className="auth-divider"><span>or use email</span></div></> : null}

    <form action={joinAction} className="stack auth-form">
      <input type="hidden" name="role" value={role}/>
      {talent ? <input type="hidden" name="talent" value={talent}/> : null}
      {lead ? <input type="hidden" name="lead" value={lead}/> : null}
      {next ? <input type="hidden" name="next" value={next}/> : null}
      <div className="field"><label htmlFor={`${role}-full-name`}>Full name</label><input id={`${role}-full-name`} name="full_name" required minLength={2} autoComplete="name"/></div>
      <div className="field"><label htmlFor={`${role}-email`}>{client ? "Work email" : "Email"}</label><input id={`${role}-email`} type="email" name="email" required autoComplete="email"/></div>
      <div className="field"><label htmlFor={`${role}-password`}>Password</label><input id={`${role}-password`} type="password" name="password" minLength={8} required autoComplete="new-password"/><span className="small muted">At least 8 characters.</span></div>
      {!client ? <div className="field"><label htmlFor="va-avatar">Profile photo</label><input id="va-avatar" type="file" name="avatar" accept="image/jpeg,image/png,image/webp" required/><span className="small muted">Required. JPG, PNG, or WEBP, max 3 MB.</span></div> : null}
      <TurnstileWidget/>
      <button className="btn btn-primary btn-lg" type="submit">{client ? "Create client account" : "Create VA account"}</button>
    </form>

    <p className="small muted auth-legal">By continuing, you agree to our <Link href="/terms" className="text-link">Terms</Link> and <Link href="/privacy" className="text-link">Privacy Policy</Link>.</p>
    <p className="small auth-switch">{client ? "Looking for VA work?" : "Hiring a VA?"} <Link href={switchHref} className="text-link">{client ? "Join as a VA" : "Create a client account"}</Link></p>
    <p className="small muted auth-login">Already have an account? <Link href={loginHref} className="text-link">Log in</Link>.</p>
  </div>;
}
