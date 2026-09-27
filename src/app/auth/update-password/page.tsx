import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { updatePasswordAction } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Choose a New Password",
  description: "Choose a new password for your VirtualAssistant.com.ph account.",
  robots: { index: false, follow: false },
};

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  return (
    <>
      <SiteHeader/>
      <main id="main-content" className="auth-page">
        <div className="auth-card">
          <h1>Choose a new password</h1>
          {params.error ? <p className="alert" role="alert">{params.error}</p> : null}
          <form action={updatePasswordAction} className="stack">
            <div className="field">
              <label htmlFor="new-account-password">New password</label>
              <input
                id="new-account-password"
                type="password"
                name="password"
                minLength={12}
                required
                autoComplete="new-password"
                aria-describedby="new-account-password-help"
              />
              <span className="small muted" id="new-account-password-help">
                12+ characters with uppercase, lowercase, a number, and a symbol. Avoid common password phrases.
              </span>
            </div>
            <button className="btn btn-primary" type="submit">Update password</button>
          </form>
        </div>
      </main>
    </>
  );
}
