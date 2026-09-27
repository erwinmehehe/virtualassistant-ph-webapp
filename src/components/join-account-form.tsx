import Link from "next/link";
import { BriefcaseBusiness, UserRoundCheck } from "lucide-react";
import { joinAction, oauthAction } from "@/app/actions/auth";
import { googleLoginEnabled, microsoftLoginEnabled } from "@/lib/social-login";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { JoinSubmitButton } from "@/components/join-submit-button";
import { AuthExperienceShell } from "@/components/auth-experience-shell";

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
  const googleEnabled = googleLoginEnabled();
  const microsoftEnabled = microsoftLoginEnabled();
  const socialEnabled = googleEnabled || microsoftEnabled;
  const switchHref = client ? "/auth/join/va" : "/auth/join/client";
  const loginParams = new URLSearchParams();
  if (next) loginParams.set("next", next);
  else if (client && talent) loginParams.set("next", `/workspace/client?talent=${talent}`);
  if (client && lead) loginParams.set("lead", lead);
  const loginHref = `/auth/login${loginParams.toString() ? `?${loginParams.toString()}` : ""}`;

  return (
    <AuthExperienceShell variant={role}>
      <div className="auth-card auth-card-wide auth-surface-card">
        <div className="auth-role-switch" aria-label="Choose account type">
          <Link className={client ? "active" : ""} href="/auth/join/client"><BriefcaseBusiness size={15}/> Hiring a VA</Link>
          <Link className={!client ? "active" : ""} href="/auth/join/va"><UserRoundCheck size={15}/> I&apos;m a VA</Link>
        </div>

        <div className="auth-form-heading">
          <div className="auth-role-icon" aria-hidden="true">{client ? <BriefcaseBusiness size={22}/> : <UserRoundCheck size={22}/>}</div>
          <div>
            <div className="kicker">{client ? "Client account" : "Virtual Assistant account"}</div>
            <h1>{client ? "Create your client workspace" : "Create your VA account"}</h1>
            <p className="muted auth-intro">{client
              ? "Start with your account, then manage hiring requests, shortlists, interviews, and placements from one workspace."
              : "Start with your account, then complete a guided profile and vetting flow at your own pace."}</p>
          </div>
        </div>

        {lead && client ? <div className="success-banner small">Use the same email from your hiring request and we&apos;ll attach that role after you confirm your account.</div> : null}
        {talent && client ? <div className="success-banner small">The VA profile you requested will stay attached to your hiring path.</div> : null}
        {error ? <div className="alert auth-alert" role="alert"><strong>Signup needs attention</strong><span>{error}</span></div> : null}

        {socialEnabled ? (
          <>
            <div className="auth-social-stack auth-social-stack-primary" aria-label="Social sign up options">
              {googleEnabled ? <form action={oauthAction}>
                  <input type="hidden" name="provider" value="google"/>
                  <input type="hidden" name="role" value={role}/>
                  {client && talent ? <input type="hidden" name="talent" value={talent}/> : null}
                  {client && lead ? <input type="hidden" name="lead" value={lead}/> : null}
                  {next ? <input type="hidden" name="next" value={next}/> : null}
                  <button className="btn auth-social-btn auth-provider-btn" type="submit">
                    <span className="auth-provider-mark auth-provider-google" aria-hidden="true">G</span>
                    <span>Continue with Google</span>
                  </button>
                </form> : null}
              {microsoftEnabled ? <form action={oauthAction}>
                  <input type="hidden" name="provider" value="azure"/>
                  <input type="hidden" name="role" value={role}/>
                  {client && talent ? <input type="hidden" name="talent" value={talent}/> : null}
                  {client && lead ? <input type="hidden" name="lead" value={lead}/> : null}
                  {next ? <input type="hidden" name="next" value={next}/> : null}
                  <button className="btn auth-social-btn auth-provider-btn" type="submit">
                    <span className="auth-provider-mark auth-provider-microsoft" aria-hidden="true"><i/><i/><i/><i/></span>
                    <span>Continue with Microsoft</span>
                  </button>
                </form> : null}
            </div>
            <div className="auth-divider"><span>or create with email</span></div>
          </>
        ) : null}

        <form action={joinAction} className="stack auth-form">
          <input type="hidden" name="role" value={role}/>
          {talent ? <input type="hidden" name="talent" value={talent}/> : null}
          {lead ? <input type="hidden" name="lead" value={lead}/> : null}
          {next ? <input type="hidden" name="next" value={next}/> : null}

          <div className="field">
            <label htmlFor={`${role}-full-name`}>Full name</label>
            <input id={`${role}-full-name`} name="full_name" required minLength={2} autoComplete="name" placeholder="Your full name"/>
          </div>
          <div className="field">
            <label htmlFor={`${role}-email`}>{client ? "Work email" : "Email"}</label>
            <input id={`${role}-email`} type="email" name="email" required autoComplete="email" placeholder={client ? "you@company.com" : "you@example.com"}/>
          </div>
          <div className="field">
            <div className="auth-field-label-row"><label htmlFor={`${role}-password`}>Password</label><span>12+ characters</span></div>
            <input id={`${role}-password`} type="password" name="password" minLength={12} maxLength={128} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}" title="Use 12+ characters with uppercase, lowercase, a number, and a symbol." required autoComplete="new-password" placeholder="Create a strong password"/>
            <span className="small muted">Use uppercase, lowercase, a number, and a symbol.</span>
          </div>

          <TurnstileWidget/>
          <JoinSubmitButton role={role}/>
          <div className="auth-after-submit-note">
            {client
              ? "After confirmation, your private Client workspace opens immediately."
              : "After confirmation, you’ll continue to the short VA profile setup."}
          </div>
        </form>

        <p className="small muted auth-legal">By continuing, you agree to our <Link href="/terms" className="text-link">Terms</Link> and <Link href="/privacy" className="text-link">Privacy Policy</Link>.</p>
        <div className="auth-card-footer">
          <p className="small auth-switch">{client ? "Looking for VA work?" : "Hiring a VA?"} <Link href={switchHref} className="text-link">{client ? "Join as a VA" : "Create a client account"}</Link></p>
          <p className="small muted auth-login">Already registered? <Link href={loginHref} className="text-link">Log in</Link>.</p>
        </div>
      </div>
    </AuthExperienceShell>
  );
}
