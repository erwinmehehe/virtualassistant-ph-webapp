"use client";

import { useState } from "react";
import {
  confirmMfaEnabledAction,
  confirmMfaEnrollmentStartedAction,
  removeTotpFactorAction,
} from "@/app/actions/account-security";
import { createClient } from "@/lib/supabase/client";

type TotpFactor = {
  id: string;
  friendly_name?: string | null;
  status?: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function TotpManager({
  factors,
  required,
}: {
  factors: TotpFactor[];
  required: boolean;
}) {
  const supabase = createClient();
  const verifiedFactors = factors.filter((factor) => factor.status === "verified");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function beginEnrollment() {
    setError("");
    setBusy(true);
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: verifiedFactors.length ? "Backup authenticator" : "Authenticator app",
      });
      if (enrollError) {
        setError(enrollError.message);
        return;
      }

      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });

      try {
        await confirmMfaEnrollmentStartedAction(data.id);
      } catch {
        // Audit logging must not strand a valid enrollment.
      }
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnrollment() {
    if (!enrollment) return;
    setError("");
    setBusy(true);
    try {
      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
      if (unenrollError) {
        setError(unenrollError.message);
        return;
      }
      setEnrollment(null);
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnrollment() {
    if (!enrollment) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
      if (challenge.error) {
        setError("Authenticator verification could not be started.");
        return;
      }

      const verified = await supabase.auth.mfa.verify({
        factorId: enrollment.factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verified.error) {
        setError("That authenticator code is invalid or expired.");
        return;
      }

      await supabase.auth.refreshSession();
      await confirmMfaEnabledAction();
      setEnrollment(null);
      setCode("");
      window.location.reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="data-row">
        <span>Status</span>
        <strong>{verifiedFactors.length ? "Enabled" : required ? "Required - setup needed" : "Not enabled"}</strong>
      </div>

      {verifiedFactors.length ? (
        <div className="stack">
          {verifiedFactors.map((factor, index) => (
            <div className="card" key={factor.id}>
              <div className="row-between" style={{ gap: 12 }}>
                <div>
                  <strong>{factor.friendly_name || (index === 0 ? "Authenticator app" : "Backup authenticator")}</strong>
                  <div className="small muted">Verified TOTP factor</div>
                </div>
                <form action={removeTotpFactorAction}>
                  <input type="hidden" name="factor_id" value={factor.id} />
                  <button className="btn btn-sm" type="submit">Remove</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!enrollment ? (
        <div>
          <button className="btn btn-primary" type="button" onClick={beginEnrollment} disabled={busy}>
            {verifiedFactors.length ? "Add backup authenticator" : "Set up authenticator app"}
          </button>
        </div>
      ) : (
        <div className="card stack">
          <div>
            <h3 style={{ margin: 0 }}>Scan this QR code</h3>
            <p className="small muted">Use Google Authenticator, 1Password, Authy, Microsoft Authenticator, or another TOTP app.</p>
          </div>

          <div style={{ maxWidth: 220 }}>
            <img src={enrollment.qrCode} alt="Authenticator setup QR code" width="200" height="200" />
          </div>

          <div className="field">
            <label htmlFor="totp-secret">Can&apos;t scan it? Enter this setup key manually</label>
            <input id="totp-secret" value={enrollment.secret} readOnly autoComplete="off" />
          </div>

          <div className="field">
            <label htmlFor="totp-code">6-digit verification code</label>
            <input
              id="totp-code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
            />
          </div>

          {error ? <p className="alert" role="alert">{error}</p> : null}

          <div className="row wrap">
            <button className="btn btn-primary" type="button" onClick={verifyEnrollment} disabled={busy || code.length !== 6}>
              Enable two-factor authentication
            </button>
            <button className="btn" type="button" onClick={cancelEnrollment} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!enrollment && error ? <p className="alert" role="alert">{error}</p> : null}

      {verifiedFactors.length === 1 ? (
        <p className="small muted">Add a backup authenticator on a different device or app so you have a recovery option if your primary authenticator is lost.</p>
      ) : null}
    </div>
  );
}
