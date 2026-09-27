import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { requestPasswordResetAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset the password for your VirtualAssistant.com.ph account.",
  robots: { index: false, follow: false },
};

export default function ForgotPage() {
  return (
    <>
      <SiteHeader/>
      <main id="main-content" className="auth-page">
        <div className="auth-card">
          <h1>Reset your password</h1>
          <p className="muted">Enter your account email and we will send a secure reset link.</p>
          <form action={requestPasswordResetAction} className="stack">
            <div className="field">
              <label htmlFor="password-reset-email">Email</label>
              <input id="password-reset-email" type="email" name="email" autoComplete="email" required/>
            </div>
            <button className="btn btn-primary" type="submit">Send reset link</button>
          </form>
        </div>
      </main>
    </>
  );
}
