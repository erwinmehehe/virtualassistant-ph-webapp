import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { loginAction, oauthAction } from "@/app/actions/auth";
import { resendSignupConfirmationAction } from "@/app/actions/resend-confirmation";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { googleLoginEnabled, microsoftLoginEnabled } from "@/lib/social-login";
import { safeTrainingCourseSlug, trainingJoinHref } from "@/lib/training-intent";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const next = params.next?.trim();
  const lead = params.lead?.trim();
  const trainingLogin = next === "/workspace/training" || Boolean(next?.startsWith("/workspace/training/"));
  const trainingCourseMatch = next?.match(/^\/workspace\/training\/courses\/([a-z0-9-]+)$/i);
  const trainingCourseSlug = safeTrainingCourseSlug(trainingCourseMatch?.[1]);
  const trainingJoin = trainingJoinHref(trainingCourseSlug);
  const googleEnabled = googleLoginEnabled();
  const microsoftEnabled = microsoftLoginEnabled();
  const socialEnabled = (googleEnabled || microsoftEnabled) && !trainingLogin;
  const showConfirmationRecovery = params.confirm === "1";
  const joinQuery = new URLSearchParams();
  if (next) joinQuery.set("next", next);
  if (lead) joinQuery.set("lead", lead);
  const clientJoinHref = `/auth/join/client${joinQuery.toString() ? `?${joinQuery.toString()}` : ""}`;
  const vaJoinHref = `/auth/join/va${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  return <><SiteHeader/><main id="main-content" className="auth-page"><div className="auth-card auth-card-wide"><h1>Welcome back</h1><p className="muted">Log in to continue to your VirtualAssistant.com.ph workspace.</p>{params.error ? <p className="alert" role="alert">{params.error}</p> : null}{params.message ? <p className="success-banner" role="status">{params.message}</p> : null}<form action={loginAction} className="stack">{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<div className="field"><label htmlFor="email">Email</label><input id="email" type="email" name="email" required autoComplete="email"/></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" name="password" minLength={8} required autoComplete="current-password"/></div><div className="row-between"><span></span><Link href="/auth/forgot" className="small text-link">Forgot password?</Link></div><TurnstileWidget/><button className="btn btn-primary" type="submit" data-track="login_submit">Log in</button></form>{socialEnabled ? <><div className="auth-divider"><span>or continue with</span></div><div className="auth-social-stack">{googleEnabled ? <form action={oauthAction}>{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<input type="hidden" name="provider" value="google"/><button className="btn auth-social-btn" type="submit">Google</button></form> : null}{microsoftEnabled ? <form action={oauthAction}>{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<input type="hidden" name="provider" value="azure"/><button className="btn auth-social-btn" type="submit">Microsoft</button></form> : null}</div></> : null}{showConfirmationRecovery ? <div className="auth-confirmation-help"><div className="auth-confirmation-copy"><div><strong>Didn&apos;t get the confirmation email?</strong><p>Enter your email and we&apos;ll send a fresh link.</p></div></div><form action={resendSignupConfirmationAction} className="auth-confirmation-form">{next ? <input type="hidden" name="next" value={next}/> : null}{lead ? <input type="hidden" name="lead" value={lead}/> : null}<label htmlFor="confirmation-email" className="sr-only">Confirmation email</label><input id="confirmation-email" type="email" name="email" required autoComplete="email" placeholder="Email address"/><button className="btn btn-sm" type="submit">Resend</button></form></div> : null}<div className="auth-divider"><span>New here?</span></div><div className="auth-login-options">{trainingLogin ? <Link className="btn btn-primary" href={trainingJoin} data-track="training_account_click" data-course-slug={trainingCourseSlug || undefined}>Create free training account</Link> : <><Link className="btn" href={clientJoinHref}>Create client account</Link><Link className="btn" href={vaJoinHref}>Join as a VA</Link></>}</div></div></main></>;
}
