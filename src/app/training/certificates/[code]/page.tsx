import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CertificateVerificationQr } from "@/components/certificate-verification-qr";
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
  const remainder = minutes % 60;
  if (!hours) return minutes + " minutes";
  return remainder ? hours + " hr " + remainder + " min" : hours + " hours";
}

/**
 * The verification destination is the application's configured public origin.
 * Always fall back to the canonical production domain rather than trusting
 * a request Host header when creating printed/shareable credentials.
 */
function publicVerificationUrl(path: string) {
  try {
    const base = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph");
    if (base.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && base.protocol === "http:")) {
      throw new Error("Invalid public app origin");
    }
    return new URL(path, base.origin).toString();
  } catch {
    return new URL(path, "https://virtualassistant.com.ph").toString();
  }
}

export default async function TrainingCredentialVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const credential = await getPublicTrainingCredentialByCode(code);
  const certificatePath = credential
    ? "/training/certificates/" + encodeURIComponent(credential.credentialCode)
    : null;
  const verificationUrl = certificatePath ? publicVerificationUrl(certificatePath) : null;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="credential-page">
        <div className="container credential-shell">
          <div className="credential-intro">
            <div className="credential-kicker">
              <ShieldCheck size={16} aria-hidden="true" />
              Official course completion
            </div>
            <h1>Certificate verification</h1>
            <p>
              Each credential has a unique verification page that confirms the
              recorded course completion.
            </p>
          </div>

          {credential && verificationUrl ? (
            <section className="credential-card credential-valid credential-certificate">
              <div className="credential-document" aria-label="Certificate of completion">
                <div className="credential-document-border">
                  <div className="credential-document-inner">
                    <div className="certificate-document-header">
                      <div className="certificate-wordmark">
                        VirtualAssistant<span>.com.ph</span>
                      </div>
                      <span className="certificate-document-edition">
                        FREE SKILLS TRAINING <span aria-hidden="true">/</span> VERIFIED COMPLETION
                      </span>
                    </div>

                    <div className="certificate-document-body">
                      <span className="certificate-eyebrow">In recognition of learning</span>
                      <h2 className="certificate-title">Certificate of Completion</h2>
                      <span className="certificate-title-rule" aria-hidden="true" />

                      <p className="certificate-presented">Proudly presented to</p>
                      {credential.recipientName ? (
                        <p className="certificate-recipient">{credential.recipientName}</p>
                      ) : (
                        <p className="certificate-recipient certificate-recipient-missing">
                          Recipient name not recorded
                        </p>
                      )}
                      <p className="certificate-completion-label">
                        For successfully completing the course
                      </p>
                      <h3 className="certificate-course">{credential.courseTitle}</h3>
                      <p className="certificate-explanation">
                        This certificate confirms completion of the named training course.
                      </p>
                    </div>

                    <div className="certificate-document-footer">
                      <dl className="certificate-document-details">
                        <div>
                          <dt>ISSUED ON</dt>
                          <dd>{issuedDate(credential.issuedAt)}</dd>
                        </div>
                        <div>
                          <dt>COURSE LENGTH</dt>
                          <dd>{duration(credential.estimatedMinutes)}</dd>
                        </div>
                        <div>
                          <dt>CREDENTIAL ID</dt>
                          <dd>{credential.credentialCode}</dd>
                        </div>
                      </dl>

                      <div className="certificate-document-bottom">
                        <div className="certificate-document-issuer">
                          <span className="certificate-issuer-rule" aria-hidden="true" />
                          <span className="certificate-issuer-label">Issued by</span>
                          <strong>VirtualAssistant.com.ph</strong>
                          <small>
                            A verifiable course completion record, not a professional license.
                          </small>
                        </div>
                        <div className="certificate-document-verify">
                          <a
                            href={verificationUrl}
                            className="certificate-qr-link"
                            aria-label="Open the public certificate verification page"
                          >
                            <CertificateVerificationQr url={verificationUrl} />
                          </a>
                          <div className="certificate-qr-copy">
                            <strong>SCAN TO VERIFY</strong>
                            <span>virtualassistant.com.ph</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <aside className="credential-side-panel" aria-label="Credential verification information">
                <div className="credential-verification-status">
                  <span className="credential-status-icon">
                    <CheckCircle2 size={24} aria-hidden="true" />
                  </span>
                  <div>
                    <small>Verification status</small>
                    <strong>Verified course completion</strong>
                  </div>
                </div>

                <p className="credential-verification-caption">
                  This credential matches an active course completion record
                  held by VirtualAssistant.com.ph.
                </p>

                <dl className="credential-verification-facts">
                  {credential.recipientName ? (
                    <div>
                      <dt>Learner</dt>
                      <dd>{credential.recipientName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Course</dt>
                    <dd>{credential.courseTitle}</dd>
                  </div>
                  <div>
                    <dt>Issued</dt>
                    <dd>{issuedDate(credential.issuedAt)}</dd>
                  </div>
                  <div>
                    <dt>Credential ID</dt>
                    <dd>{credential.credentialCode}</dd>
                  </div>
                </dl>

                <div className="credential-print-actions">
                  <TrainingCertificateActions
                    href={verificationUrl}
                    courseTitle={credential.courseTitle}
                    showPrint
                  />
                </div>

                <div className="credential-note">
                  <div className="credential-note-title">
                    <BadgeCheck size={17} aria-hidden="true" />
                    <strong>What this certificate means</strong>
                  </div>
                  <p>
                    This verifies course completion only. The recipient name
                    is learner-confirmed or support-corrected, not independently
                    government-ID-verified. It does not verify employment,
                    client experience, recruiter approval, or suitability for a role.
                  </p>
                </div>

                <div className="credential-panel-support">
                  <Clock3 size={16} aria-hidden="true" />
                  <span>Use Print to save an A4 landscape PDF.</span>
                </div>
                <Link className="credential-link" href="/training">
                  Explore free training <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </aside>
            </section>
          ) : (
            <section className="credential-card credential-invalid">
              <span className="credential-status-icon credential-status-invalid">
                <XCircle size={30} aria-hidden="true" />
              </span>
              <div>
                <span className="credential-invalid-eyebrow">Not verified</span>
                <h2>We could not verify this certificate.</h2>
                <p>The credential code may be incorrect, or the certificate may no longer be active.</p>
                <Link className="credential-link" href="/training">
                  Explore training <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
