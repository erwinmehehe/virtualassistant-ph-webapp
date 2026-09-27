import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound, MailCheck, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Training Account Settings",
  description: "Manage sign-in and security for your VirtualAssistant.com.ph training account.",
  robots: { index: false, follow: false },
};

function providerLabel(provider: string) {
  if (provider === "email") return "Email & password";
  if (provider === "google") return "Google";
  if (provider === "azure") return "Microsoft";
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export default async function TrainingAccountPage() {
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
