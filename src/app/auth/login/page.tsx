import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { loginAction, oauthAction } from "@/app/actions/auth";
import { resendSignupConfirmationAction } from "@/app/actions/resend-confirmation";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { googleLoginEnabled, microsoftLoginEnabled } from "@/lib/social-login";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const next = params.next?.trim();
  const lead = params.lead?.trim();
  const trainingLogin = next === "/workspace/training" || Boolean(next?.startsWith("/workspace/training/"));
  const googleEnabled = googleLoginEnabled();
  const microsoftEnabled = microsoftLoginEnabled();
  const socialEnabled = (googleEnabled || microsoftEnabled) && !trainingLogin;
  const showConfirmationRecovery = params.confirm === "1";
  const joinQuery = new URLSearchParams();
  if (next) joinQuery.set("next", next);
  if (lead) joinQuery.set("lead", lead);
  const clientJoinHref = `/auth/join/client${joinQuery.toString() ? `?${joinQuery.toString()}` : ""}`;
  const vaJoinHref = `/auth/join/va${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return <><SiteHeader/><main id="main-content" className="auth-page"><div className="auth-card auth-card-wide"><h1>Welcome back</h1><p className="muted">Log in to continue to your VirtualAssistant.com.ph workspace.</p>{params.error ? <p className="alert" role="alert">{params.error}</p> : null}{params.message ? <p className="success-banner" role="status">{params.message}</p> : null}<form action={loginAction} className="stack">{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<div className="field"><label htmlFor="email">Email</label><input id="email" type="email" name="email" required autoComplete="email"/></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" name="password" minLength={8} required autoComplete="current-password"/></div><div className="row-between"><span></span><Link href="/auth/forgot" className="small text-link">Forgot password?</Link></div><TurnstileWidget/><button className="btn btn-primary" type="submit" data-track="login_submit">Log in</button></form>{socialEnabled ? <><div className="auth-divider"><span>or continue with</span></div><div className="auth-social-stack">{googleEnabled ? <form action={oauthAction}>{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<input type="hidden" name="provider" value="google"/><button className="btn auth-social-btn" type="submit">Google</button></form> : null}{microsoftEnabled ? <form action={oauthAction}>{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<input type="hidden" name="provider" value="azure"/><button className="btn auth-social-btn" type="submit">Microsoft</button></form> : null}</div></> : null}{showConfirmationRecovery ? <div className="info-banner auth-confirmation-help"><strong>Need a new confirmation email?</strong><p className="small muted" style={{margin:"6px 0 12px"}}>Enter the email you used to create the account and we&apos;ll send another confirmation link.</p><form action={resendSignupConfirmationAction} className="row wrap">{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<div className="field" style={{flex:"1 1 240px"}}><label htmlFor="confirmation-email">Email</label><input id="confirmation-email" type="email" name="email" required autoComplete="email" placeholder="you@example.com"/></div><button className="btn" type="submit">Resend email</button></form></div> : null}<div className="auth-divider"><span>New here?</span></div><div className="auth-login-options">{trainingLogin ? <Link className="btn btn-primary" href="/auth/join/training">Create free training account</Link> : <><Link className="btn" href={clientJoinHref}>Create client account</Link><Link className="btn" href={vaJoinHref}>Join as a VA</Link></>}</div></div></main></>;
}
