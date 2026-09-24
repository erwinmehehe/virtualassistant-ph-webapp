import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrainingCertificateActions } from "@/components/training-certificate-actions";
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
          <div className="credential-kicker"><ShieldCheck size={15}/> Certificate of completion</div>

          {credential ? (
            <section className="credential-card credential-valid">
              <div className="credential-status-icon"><CheckCircle2 size={28}/></div>
              <div>
                <span className="credential-status">Verified</span>
                <h1>{credential.courseTitle}</h1>
                <p>{credential.courseSummary || "This certificate confirms completion of a VirtualAssistant.com.ph training course."}</p>

                <dl className="credential-facts">
                  <div><dt>Credential</dt><dd>{credential.credentialCode}</dd></div>
                  <div><dt>Issued</dt><dd>{issuedDate(credential.issuedAt)}</dd></div>
                  <div><dt>Course length</dt><dd>{duration(credential.estimatedMinutes)}</dd></div>
                  <div><dt>Status</dt><dd>Verified</dd></div>
                </dl>

                <div className="credential-print-actions">
                  <TrainingCertificateActions
                    href={`/training/certificates/${encodeURIComponent(credential.credentialCode)}`}
                    courseTitle={credential.courseTitle}
                    showPrint
                  />
                </div>

                <div className="credential-note">
                  <strong>What this certificate means</strong>
                  <p>
                    The credential confirms completion of the named training course. It does not verify employment,
                    client experience, recruiter approval, or suitability for a specific role.
                  </p>
                </div>

                <Link className="credential-link" href="/training">
                  Explore training <ArrowRight size={14}/>
                </Link>
              </div>
            </section>
          ) : (
            <section className="credential-card credential-invalid">
              <div className="credential-status-icon"><XCircle size={28}/></div>
              <div>
                <span className="credential-status">Not verified</span>
                <h1>We could not verify this certificate.</h1>
                <p>
                  The code may be incorrect, or this certificate may no longer be active.
                </p>
                <Link className="credential-link" href="/training">Explore training</Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
