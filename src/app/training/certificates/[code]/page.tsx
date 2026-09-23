import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldCheck, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getPublicTrainingCredentialByCode } from "@/lib/training-credentials";
import "./certificate.css";

export const metadata: Metadata = {
  title: { absolute: "Verify Training Credential | VirtualAssistant.com.ph" },
  description: "Verify a VirtualAssistant.com.ph training completion credential.",
  robots: { index: false, follow: false },
};

function issuedDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${minutes} minutes`;
  return rest ? `${hours} hr ${rest} min` : `${hours} hours`;
}

export default async function TrainingCredentialVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const credential = await getPublicTrainingCredentialByCode(code);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="credential-page">
        <div className="container credential-shell">
          <div className="credential-kicker"><ShieldCheck size={15}/> Training credential verification</div>

          {credential ? (
            <section className="credential-card credential-valid">
              <div className="credential-status-icon"><CheckCircle2 size={28}/></div>
              <div>
                <span className="credential-status">Valid credential</span>
                <h1>{credential.courseTitle}</h1>
                <p>{credential.courseSummary || "This learner completed a published VirtualAssistant.com.ph training course."}</p>

                <dl className="credential-facts">
                  <div><dt>Credential</dt><dd>{credential.credentialCode}</dd></div>
                  <div><dt>Issued</dt><dd>{issuedDate(credential.issuedAt)}</dd></div>
                  <div><dt>Course length</dt><dd>{duration(credential.estimatedMinutes)}</dd></div>
                  <div><dt>Status</dt><dd>Valid and not revoked</dd></div>
                </dl>

                <div className="credential-note">
                  <strong>What this verifies</strong>
                  <p>
                    The credential confirms completion of the named training course. It does not verify employment,
                    client experience, recruiter approval, or suitability for a specific role.
                  </p>
                </div>

                <Link className="credential-link" href="/training">
                  View the training hub <ExternalLink size={14}/>
                </Link>
              </div>
            </section>
          ) : (
            <section className="credential-card credential-invalid">
              <div className="credential-status-icon"><XCircle size={28}/></div>
              <div>
                <span className="credential-status">Credential not verified</span>
                <h1>We could not verify this training credential.</h1>
                <p>
                  The code may be incorrect, the credential may have been revoked, or the associated course may no
                  longer be published.
                </p>
                <Link className="credential-link" href="/training">Go to training</Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
