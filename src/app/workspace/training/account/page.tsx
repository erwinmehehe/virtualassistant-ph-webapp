import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addNameToUnnamedTrainingCertificateAction, confirmTrainingCertificateNameAction } from "@/app/actions/training-certificate-identity";
import { confirmedTrainingCertificateName, suggestedTrainingCertificateName, normalizeTrainingCertificateName } from "@/lib/training-certificate-identity";

export const metadata: Metadata = {
  title: "Training Account Settings",
  description: "Confirm your certificate recipient name and manage your free training account.",
  robots: { index: false, follow: false },
};

function providerLabel(provider: string) {
  if (provider === "email") return "Email & password";
  if (provider === "google") return "Google";
  if (provider === "azure") return "Microsoft";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default async function TrainingAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ certificate_name_status?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=%2Fworkspace%2Ftraining%2Faccount");

  const providerKeys = new Set<string>();
  for (const identity of user.identities || []) {
    if (identity.provider) providerKeys.add(identity.provider);
  }
  const primaryProvider = typeof user.app_metadata?.provider === "string"
    ? user.app_metadata.provider
    : null;
  if (primaryProvider) providerKeys.add(primaryProvider);

  const providers = providerKeys.size
    ? [...providerKeys].map(providerLabel)
    : ["Email & password"];

  const params = await searchParams;
  const proposedName = suggestedTrainingCertificateName(user.user_metadata);
  const confirmedName = confirmedTrainingCertificateName(user.app_metadata);
  const { data: issuedCertificates } = await supabase
    .from("training_certificates")
    .select("credential_code,issued_at,metadata")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("issued_at", { ascending: false })
    .limit(10);

  const statusMessages: Record<string, string> = {
    saved: "Certificate name confirmed. Eligible completed courses awaiting this confirmation can now receive certificates.",
    saved_pending: "Your certificate name was saved. Some completed certificates may still be processing; contact support if they do not appear.",
    invalid_name: "Enter a valid name between 2 and 100 characters. Do not enter an email address.",
    consent_required: "Confirm that you understand your certificate name is visible to anyone with the verification link.",
    login_required: "Please verify your account email and sign in again.",
    rate_limited: "Too many name updates. Please wait and try again.",
    save_failed: "Your certificate name could not be saved. Please try again.",
    name_added: "Your confirmed name was added to the existing certificate. Its code, issue date and completion record were preserved.",
    name_confirmation_required: "Confirm your certificate recipient name above before adding it to an older unnamed certificate.",
    name_unavailable: "This active certificate is not linked to your account, or its code is invalid.",
    name_already_recorded: "This certificate already has a recipient name. Contact support for a verified correction.",
    name_update_failed: "The certificate could not be updated. Please refresh the page and try again.",
  };

  return (
    <div className="dash-page role-overview training-home">
      <header className="account-settings-header">
        <div className="account-avatar account-avatar-compact" aria-hidden="true">
          <ShieldCheck size={22} />
        </div>
        <div className="account-settings-header-copy">
          <span className="account-panel-eyebrow">Training account</span>
          <h1>Account settings</h1>
          <div className="account-settings-identity">
            <span>{user.email || "No email available"}</span>
            {user.email_confirmed_at ? (
              <span className="account-verified-badge"><MailCheck size={13} /> Verified</span>
            ) : null}
          </div>
          <p>Manage the sign-in details for your free training account without entering the hiring or candidate workspace.</p>
        </div>
      </header>

      <div className="account-settings-stack">
        <section className="account-settings-section">
          <div className="account-settings-section-head">
            <div>
              <span className="account-panel-eyebrow">Sign-in</span>
              <h2>Account access</h2>
              <p>Your training progress and certificates stay attached to this account.</p>
            </div>
          </div>

          <div className="account-setting-row">
            <div className="account-setting-copy">
              <strong>Email address</strong>
              <small>Used for training access and account recovery.</small>
            </div>
            <div className="account-setting-value">
              <span>{user.email || "Not available"}</span>
            </div>
          </div>

          <div className="account-setting-row">
            <div className="account-setting-copy">
              <strong>Sign-in methods</strong>
              <small>Ways currently connected to this account.</small>
            </div>
            <div className="account-setting-value">
              <span>{providers.join(", ")}</span>
            </div>
          </div>
        </section>


        <section className="account-settings-section" id="certificate-name">
          <div className="account-settings-section-head">
            <div>
              <span className="account-panel-eyebrow">Certificate identity</span>
              <h2>Certificate recipient name</h2>
              <p>Confirm the exact full name you want printed on VAPH certificates. For older certificates missing a name, you can separately approve adding this confirmed name below.</p>
            </div>
          </div>

          {params.certificate_name_status && statusMessages[params.certificate_name_status] ? (
            <div className={(params.certificate_name_status === "saved" || params.certificate_name_status === "name_added") ? "success-banner" : "notice"} role="status">
              {statusMessages[params.certificate_name_status]}
            </div>
          ) : null}

          <div className="account-setting-row">
            <div className="account-setting-copy">
              <strong>Current status</strong>
              <small>{confirmedName ? "Confirmed for future certificates" : "Confirmation needed before your next certificate is issued"}</small>
            </div>
            <div className="account-setting-value">
              <strong>{confirmedName || "Not confirmed"}</strong>
            </div>
          </div>

          <form action={confirmTrainingCertificateNameAction} className="stack">
            <div className="field">
              <label htmlFor="certificate-recipient-name">Full name to print on certificates</label>
              <input
                id="certificate-recipient-name"
                name="certificate_name"
                defaultValue={confirmedName || proposedName || ""}
                minLength={2}
                maxLength={100}
                autoComplete="name"
                required
                placeholder="Your correct full name"
              />
              <small className="muted">Check spelling, middle names and initials carefully. Google sign-in names and email nicknames are not automatically treated as your confirmed certificate name.</small>
            </div>
            <label className="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <input type="checkbox" name="publish_name_consent" value="yes" required />
              <span>I confirm this is the name I want on my certificates, and understand that anyone with my credential verification link can see it.</span>
            </label>
            <div className="account-settings-actions">
              <button className="btn btn-primary" type="submit">Confirm certificate name</button>
            </div>
          </form>

          <p className="muted">This confirmation applies to new certificates. An already-issued certificate that has no recipient name can be completed separately below. A name already printed on a certificate still requires a verified support correction.</p>
        </section>

        <section className="account-settings-section" id="issued-certificate-names">
          <div className="account-settings-section-head">
            <div>
              <span className="account-panel-eyebrow">Issued credentials</span>
              <h2>Existing certificate names</h2>
              <p>Use your confirmed name to complete a previously issued certificate that has no recipient name. If an existing name is incorrect, request a verified staff correction instead. You never need to retake the course.</p>
            </div>
          </div>
          {issuedCertificates?.length ? (
            <div className="stack">
              {issuedCertificates.map((item) => {
                const metadataValue = item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
                  ? item.metadata as Record<string, unknown>
                  : {};
                const name = normalizeTrainingCertificateName(metadataValue.recipient_name);
                return (
                  <div className="account-setting-row" key={item.credential_code}>
                    <div className="account-setting-copy">
                      <strong>{name || "Recipient name not recorded"}</strong>
                      <small>{item.credential_code}</small>
                    </div>
                    <div className="account-setting-value" style={{ display: "grid", gap: 10, justifyItems: "start" }}>
                      <Link className="btn btn-sm" href={"/training/certificates/" + encodeURIComponent(item.credential_code)}>View certificate</Link>
                      {!name ? (
                        confirmedName ? (
                          <form action={addNameToUnnamedTrainingCertificateAction} className="stack" style={{ gap: 10 }}>
                            <input type="hidden" name="credential_code" value={item.credential_code} />
                            <small>Confirmed recipient: <strong>{confirmedName}</strong></small>
                            <label className="row" style={{ alignItems: "flex-start", gap: 8 }}>
                              <input type="checkbox" name="publish_unnamed_certificate_consent" value="yes" required />
                              <span>I want to add my confirmed name to this unnamed certificate. Anyone with its verification link can see that name.</span>
                            </label>
                            <button className="btn btn-sm btn-primary" type="submit">Add name to certificate</button>
                          </form>
                        ) : (
                          <Link href="#certificate-name" className="btn btn-sm">Confirm your name first</Link>
                        )
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted">No certificates issued yet. Once you confirm your name and complete an eligible course, your certificate will be available from My learning.</p>
          )}
          <p>Names already recorded on issued certificates cannot be changed by the learner. For those corrections, <Link href="/contact">contact VAPH support</Link> with your credential code. Staff will verify account ownership and your requested spelling. Certificates with missing names can use the consent form above.</p>
        </section>

        <section className="account-settings-section">
          <div className="account-settings-section-head">
            <div>
              <span className="account-panel-eyebrow">Security</span>
              <h2>Password & recovery</h2>
              <p>Use the secure recovery flow to reset a password or add one to a social-login account.</p>
            </div>
          </div>

          <div className="account-setting-row">
            <div className="account-setting-copy">
              <strong>Reset or set a password</strong>
              <small>We will send a secure recovery link to your account email.</small>
            </div>
            <Link className="btn" href="/auth/forgot">
              <KeyRound size={16} />
              Password help
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
