import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { startVaIdentityVerificationAction } from "@/app/actions/va-identity-verification";
import {
  diditConfiguration,
  identityStatusLabel,
  type IdvStatus,
} from "@/lib/va-identity-verification";

export const dynamic = "force-dynamic";

const noticeText: Record<string, string> = {
  unavailable: "Identity verification is temporarily unavailable. Your current vetting and applications are unaffected.",
  consent: "Please read and agree to the identity-check notice before continuing.",
  limit: "You've reached today's verification-attempt limit. Please try again tomorrow or contact support.",
  too_soon: "A session was just requested. Reopen this page after a short interval to resume.",
  review: "This verification needs additional review. Contact support if you'd like an alternative or a retry.",
};

export default async function VaIdentityPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { user } = await requireRole("va");
  const enabled = Boolean(diditConfiguration());
  const admin = createAdminClient();
  const [{ data: account, error: profileError }, check] = await Promise.all([
    admin.from("profiles").select("identity_verified_at").eq("id", user.id).single(),
    enabled
      ? admin.from("va_identity_checks")
          .select("status,verified_at,updated_at")
          .eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const params = await searchParams;
  const notice = params.notice ? noticeText[params.notice] : null;
  const unavailable = Boolean(profileError || check.error);
  const verified = Boolean(account?.identity_verified_at) && !unavailable;
  const status = (check.data?.status || null) as IdvStatus | null;
  const blockedForReview = status === "needs_review";
  const canStart = enabled && !unavailable && !verified && !blockedForReview;

  return (
    <main className="dash-page">
      <div className="page-head">
        <div>
          <p className="kicker">Private identity check</p>
          <h1>Verify your government ID</h1>
          <p>Complete a secure government-ID and live selfie check. Your ID and selfie are not shown to clients or added to your public profile.</p>
          <Link className="text-link small" href="/workspace/va/vetting">Back to recruiter screening</Link>
        </div>
      </div>

      {notice ? <div className="alert" role="alert">{notice}</div> : null}
      {unavailable ? <div className="alert" role="alert">Your identity status could not be loaded. No verification has been started.</div> : null}

      <section className="card stack" aria-label="Identity verification status">
        <h2>Current verification status</h2>
        {verified
          ? <div className="success-banner" role="status"><strong>Government ID verified</strong><p>Your verification record has been saved. This is separate from recruiter vetting and hiring decisions.</p></div>
          : <p role="status"><strong>{enabled ? identityStatusLabel(status) : "Verification not yet available"}</strong></p>}
        {status === "sandbox_approved" ? <p className="small muted">The sandbox test passed. It does not issue a real identity-verification badge.</p> : null}
        {blockedForReview ? <p>Something needs a closer look, which does not mean your job application has been rejected. <Link className="text-link" href="/contact">Request a review or another verification method</Link>.</p> : null}
        {status === "pending" || status === "initiating" ?
          <p className="small muted">A hosted verification session has been started. Results appear here after the provider sends a signed verification update. You can return to the provider by starting/resuming the session below.</p> : null}
        {!enabled ? <p className="muted">Automatic ID verification has not been enabled for VA accounts. You can continue using the existing recruiter-screening process.</p> : null}
      </section>

      {canStart ? (
        <section className="card stack" aria-label="Start hosted identity verification">
          <h2>Start secure verification</h2>
          <p>The verification provider, Didit, will guide you through the supported ID types and camera steps. You'll be returned here when you finish.</p>
          <form action={startVaIdentityVerificationAction} className="stack">
            <label className="row" style={{ alignItems: "flex-start", gap: 10 }}>
              <input type="checkbox" name="identity_consent" value="yes" required style={{ marginTop: 4 }} />
              <span>
                I agree to have my government-issued identity document and live selfie/liveness information processed by Didit solely to verify my identity for VirtualAssistant.com.ph. I understand verification data may be processed outside the Philippines, that VAPH receives the verification status, and that I can request a review or alternative if the check cannot be completed.
              </span>
            </label>
            <p className="small muted">
              Read the <Link className="text-link" href="/privacy">VAPH Privacy Notice</Link>,{" "}
              <a className="text-link" href="https://didit.me/terms/identity-verification/" target="_blank" rel="noreferrer">Didit identity-verification terms</a>, and{" "}
              <a className="text-link" href="https://didit.me/terms/biometric-data-policy/" target="_blank" rel="noreferrer">biometric retention policy</a>.
              This check does not guarantee a job or automatically determine hiring eligibility.
            </p>
            <div><button className="btn btn-primary" type="submit">{status === "pending" ? "Resume ID verification" : "Start ID verification"}</button></div>
          </form>
        </section>
      ) : null}

      <section className="card stack">
        <h2>Need another way to verify?</h2>
        <p>Camera issues, unreadable IDs, or a mismatched result may require a retry or a human review. A failed automated check alone will not reject your application.</p>
        <p><Link className="text-link" href="/contact">Contact the VAPH team about identity verification</Link></p>
      </section>
    </main>
  );
}
