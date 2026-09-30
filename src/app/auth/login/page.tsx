import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { TrainingSiteHeader } from "@/components/training-site-header";
import { AuthExperienceShell } from "@/components/auth-experience-shell";
import { loginAction, oauthAction } from "@/app/actions/auth";
import { resendSignupConfirmationAction } from "@/app/actions/resend-confirmation";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { googleLoginEnabled, microsoftLoginEnabled } from "@/lib/social-login";
import { safeTrainingCourseSlug, trainingJoinHref } from "@/lib/training-intent";

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your VirtualAssistant.com.ph account to access your workspace or continue free VA training.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Log In | VirtualAssistant.com.ph",
    description: "Access your VirtualAssistant.com.ph workspace or continue your free VA training.",
  },
  twitter: {
    card: "summary",
    title: "Log In | VirtualAssistant.com.ph",
    description: "Access your VirtualAssistant.com.ph workspace or continue your free VA training.",
  },
};

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
  const socialEnabled = trainingLogin ? googleEnabled : (googleEnabled || microsoftEnabled);
  const showConfirmationRecovery = params.confirm === "1";
  const joinQuery = new URLSearchParams();
  if (next) joinQuery.set("next", next);
  if (lead) joinQuery.set("lead", lead);
  const clientJoinHref = `/auth/join/client${joinQuery.toString() ? `?${joinQuery.toString()}` : ""}`;
  const vaJoinHref = `/auth/join/va${next ? `?next=${encodeURIComponent(next)}` : ""}`;

  const loginCard = (
    <div className={`auth-card auth-card-wide ${trainingLogin ? "training-auth-card" : "auth-surface-card"}`}>
      <div className="auth-form-heading auth-login-heading">
        <div>
          <div className="kicker">{trainingLogin ? "Training account" : "Secure sign in"}</div>
          <h1>{trainingLogin ? "Welcome back to training" : "Welcome back"}</h1>
          <p className="muted auth-intro">
            {trainingLogin
              ? "Continue your free training, saved progress, and certificates with the same account."
              : "Continue with Google, or use the email and password already linked to your account."}
          </p>
          {trainingLogin ? (
            <div className="training-auth-benefit-row" aria-label="Training account benefits">
              <span>Free courses</span>
              <span>Saved progress</span>
              <span>Certificates</span>
            </div>
          ) : null}
        </div>
      </div>

      {params.error ? <div className="alert auth-alert" role="alert"><strong>We couldn&apos;t sign you in</strong><span>{params.error}</span></div> : null}
      {params.message ? <p className="success-banner" role="status">{params.message}</p> : null}

      {socialEnabled ? (
        <>
          <div className="auth-social-stack auth-social-stack-primary">
            {googleEnabled ? (
              <form action={oauthAction}>
                {next ? <input type="hidden" name="next" value={next}/> : null}
                {lead ? <input type="hidden" name="lead" value={lead}/> : null}
                <input type="hidden" name="provider" value="google"/>
                <button className="btn auth-social-btn auth-provider-btn" type="submit">
                  <span className="auth-provider-mark auth-provider-google" aria-hidden="true">G</span>
                  <span>Continue with Google</span>
                </button>
              </form>
            ) : null}
            {!trainingLogin && microsoftEnabled ? (
              <form action={oauthAction}>
                {next ? <input type="hidden" name="next" value={next}/> : null}
                {lead ? <input type="hidden" name="lead" value={lead}/> : null}
                <input type="hidden" name="provider" value="azure"/>
                <button className="btn auth-social-btn auth-provider-btn" type="submit">
                  <span className="auth-provider-mark auth-provider-microsoft" aria-hidden="true"><i/><i/><i/><i/></span>
                  <span>Continue with Microsoft</span>
                </button>
              </form>
            ) : null}
          </div>
          <div className="auth-divider"><span>or use email</span></div>
        </>
      ) : null}

      <form action={loginAction} className="stack auth-form">
        {next ? <input type="hidden" name="next" value={next}/> : null}
        {lead ? <input type="hidden" name="lead" value={lead}/> : null}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" required autoComplete="email" placeholder="you@example.com"/>
        </div>

        <div className="field">
          <div className="auth-field-label-row">
            <label htmlFor="password">Password</label>
            <Link href="/auth/forgot" className="small text-link">Forgot password?</Link>
          </div>
          <input id="password" type="password" name="password" minLength={8} required autoComplete="current-password" placeholder="Enter your password"/>
        </div>

        <TurnstileWidget action="login"/>
        <button className="btn btn-primary auth-primary-submit" type="submit" data-track="login_submit">
          {trainingLogin ? "Log in to training" : "Log in"}
        </button>
      </form>

      {showConfirmationRecovery ? (
        <div className="auth-confirmation-help">
          <div className="auth-confirmation-copy">
            <div>
              <strong>Still waiting for your confirmation email?</strong>
              <p>Enter the email you used to register and we&apos;ll try the secure confirmation again.</p>
            </div>
          </div>
          <form action={resendSignupConfirmationAction} className="auth-confirmation-form">
            {next ? <input type="hidden" name="next" value={next}/> : null}
            {lead ? <input type="hidden" name="lead" value={lead}/> : null}
            <label htmlFor="confirmation-email" className="sr-only">Confirmation email</label>
            <input id="confirmation-email" type="email" name="email" required autoComplete="email" placeholder="Email address"/>
            <TurnstileWidget action="resend_confirmation"/>
            <button className="btn btn-sm" type="submit">Resend</button>
          </form>
        </div>
      ) : null}

      <div className="auth-divider">
        <span>{trainingLogin ? "New to training?" : "New here?"}</span>
      </div>

      <div className="auth-login-options">
        {trainingLogin ? (
          <Link
            className="btn auth-secondary-choice training-auth-create"
            href={trainingJoin}
            data-track="training_account_click"
            data-course-slug={trainingCourseSlug || undefined}
          >
            Create free training account
          </Link>
        ) : (
          <>
            <Link className="btn auth-secondary-choice" href={clientJoinHref}>Create client account</Link>
            <Link className="btn auth-secondary-choice" href={vaJoinHref}>Join as a VA</Link>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {trainingLogin ? <TrainingSiteHeader courseSlug={trainingCourseSlug} current="login"/> : <SiteHeader/>}
      <main id="main-content" className={trainingLogin ? "auth-page training-auth-page" : "auth-page auth-page-premium"}>
        {trainingLogin ? loginCard : <AuthExperienceShell variant="login">{loginCard}</AuthExperienceShell>}
      </main>
    </>
  );
}
