import type { Metadata } from "next";
import Link from "next/link";
import { requireRoleFast } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { correctIssuedTrainingCertificateNameAction } from "@/app/actions/training-certificate-identity";
import { normalizeTrainingCertificateName } from "@/lib/training-certificate-identity";

export const metadata: Metadata = {
  title: "Certificate Name Corrections | Training Admin",
  robots: { index: false, follow: false },
};

export default async function TrainingCertificateCorrectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; status?: string }>;
}) {
  await requireRoleFast("admin");
  const params = await searchParams;
  const code = String(params.code || "").trim().toUpperCase();
  const validCode = /^VAT-[A-Z0-9-]{8,64}$/.test(code);
  const admin = createAdminClient();

  const { data: certificate } = validCode
    ? await admin.from("training_certificates")
        .select("id,user_id,course_id,credential_code,issued_at,revoked_at,metadata")
        .eq("credential_code", code).is("revoked_at", null).maybeSingle()
    : { data: null };

  const [account, course] = certificate
    ? await Promise.all([
        admin.auth.admin.getUserById(certificate.user_id),
        admin.from("training_courses").select("title").eq("id", certificate.course_id).maybeSingle(),
      ])
    : [null, null];

  const metadataValue = certificate?.metadata &&
    typeof certificate.metadata === "object" && !Array.isArray(certificate.metadata)
      ? certificate.metadata as Record<string, unknown>
      : {};
  const currentName = normalizeTrainingCertificateName(metadataValue.recipient_name);
  const corrections = Array.isArray(metadataValue.recipient_name_corrections)
    ? metadataValue.recipient_name_corrections.length : 0;
  const statusMessage: Record<string, string> = {
    corrected: "The correction was saved. The original credential and issue date were preserved.",
    unchanged: "The requested name is already on this credential.",
    invalid_code: "Enter a valid VAPH credential code.",
    invalid_name: "Enter a valid recipient name (2–100 characters).",
    invalid_case: "A support case reference (4–120 characters) is required.",
    verification_required: "Verify the learner's ownership and requested name before submitting.",
    not_found: "No active certificate was found for that code.",
    update_failed: "The correction could not be saved. Please try again.",
  };

  return (
    <div className="dash-page role-overview">
      <Link className="btn btn-sm" href="/workspace/admin/training">Back to Training admin</Link>
      <header className="dashboard-section-head">
        <div>
          <span className="small">Authorized support only</span>
          <h1>Certificate name corrections</h1>
          <p>Correct an existing credential only after verifying the learner's account ownership and requested certificate name.</p>
        </div>
      </header>

      <section className="card dashboard-section-card">
        <h2>Find a credential</h2>
        <form method="get" className="stack">
          <div className="field">
            <label htmlFor="lookup-credential-code">Credential code</label>
            <input id="lookup-credential-code" name="code" defaultValue={code} placeholder="VAT-XXXXXXXXXXXX" required />
          </div>
          <button className="btn btn-primary" type="submit">Find certificate</button>
        </form>
        {params.status && statusMessage[params.status] ? (
          <p className={params.status === "corrected" ? "success-banner" : "notice"} role="status">{statusMessage[params.status]}</p>
        ) : null}
        {validCode && !certificate ? <p className="notice">No active credential matched that code.</p> : null}
      </section>

      {certificate ? (
        <section className="card dashboard-section-card">
          <h2>Verify and correct recipient</h2>
          <p><strong>Course:</strong> {course?.data?.title || "Unknown course"}</p>
          <p><strong>Current recipient:</strong> {currentName || "Not recorded"}</p>
          <p><strong>Account email (admin only):</strong> {account?.data?.user?.email || "Unavailable"}</p>
          <p><strong>Issued:</strong> {new Date(certificate.issued_at).toLocaleDateString("en-PH")}</p>
          <p><strong>Prior corrections:</strong> {corrections}</p>
          <p className="muted">A support email alone does not prove account ownership. Confirm the requester controls the linked account and verify the requested spelling before proceeding. Never upload identity documents here.</p>

          <form action={correctIssuedTrainingCertificateNameAction} className="stack">
            <input type="hidden" name="credential_code" value={certificate.credential_code}/>
            <div className="field">
              <label htmlFor="correct-recipient-name">Correct recipient name</label>
              <input id="correct-recipient-name" name="recipient_name" defaultValue={currentName || ""} minLength={2} maxLength={100} required autoComplete="off" />
            </div>
            <div className="field">
              <label htmlFor="correction-case-reference">Support case reference</label>
              <input id="correction-case-reference" name="case_reference" minLength={4} maxLength={120} required placeholder="Verified ticket or lead reference" autoComplete="off" />
            </div>
            <label className="row" style={{ alignItems: "flex-start", gap: 12 }}>
              <input type="checkbox" name="identity_verified" value="yes" required />
              <span>I verified account ownership and the exact name requested. I understand the corrected name will be visible to anyone with this verification link.</span>
            </label>
            <button className="btn btn-primary" type="submit">Save verified correction</button>
          </form>

          <p><Link href={"/training/certificates/" + encodeURIComponent(certificate.credential_code)} target="_blank">Open public certificate verification</Link></p>
          <p className="muted">Only the saved certificate recipient and its internal correction audit are changed; code, issue date, course completion and assessment evidence remain intact. For future certificates, the learner must also confirm their name in Training account settings.</p>
        </section>
      ) : null}
    </div>
  );
}
