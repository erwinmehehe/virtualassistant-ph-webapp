import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset the password for your VirtualAssistant.com.ph account.",
  robots: { index: false, follow: false },
};

export default async function ForgotPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const error = params.error?.trim();
  return (
    <>
      <SiteHeader/>
      <main id="main-content" className="auth-page">
        <div className="auth-card">
          <h1>Reset your password</h1>
          <p className="muted">Enter your account email and we will send a secure reset link.</p>
          {error ? <div className="auth-error" role="alert">{error}</div> : null}
          <form action={requestPasswordResetAction} className="stack">
            <div className="field">
              <label htmlFor="password-reset-email">Email</label>
              <input id="password-reset-email" type="email" name="email" autoComplete="email" required/>
            </div>
            <TurnstileWidget action="password_reset"/>
            <button className="btn btn-primary" type="submit">Send reset link</button>
          </form>
        </div>
      </main>
    </>
  );
}
