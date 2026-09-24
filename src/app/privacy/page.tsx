import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description:
    "How VirtualAssistant.com.ph handles account, hiring, matching, public-profile, payment, training, analytics, and privacy-rights data.",
  alternates: { canonical: canonicalPath("/privacy") },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="section public-hero-small">
          <div className="container public-page-head">
            <h1 className="public-page-title">Privacy Notice</h1>
            <p className="public-lede">
              This notice explains how VirtualAssistant.com.ph processes information for accounts, hiring,
              candidate matching, training, payments, support, analytics, and optional public Virtual Assistant
              profiles.
            </p>
          </div>
        </section>

        <section className="section section-white">
          <div className="container stack" style={{ maxWidth: 820 }}>
            <div className="card">
              <h2>Who this notice covers</h2>
              <p className="muted">
                VirtualAssistant.com.ph processes personal information about Virtual Assistants, client users,
                prospective clients, recruiters and internal users, and people who contact or interact with the
                platform. Where VirtualAssistant.com.ph determines why and how platform information is processed,
                it acts as the personal information controller for that processing and applies the transparency,
                legitimate-purpose, proportionality, security, and accountability principles of the Philippine
                Data Privacy Act of 2012 and applicable National Privacy Commission rules.
              </p>
            </div>

            <div className="card">
              <h2>Information we process</h2>
              <p className="muted">
                Depending on how you use the platform, this can include account and authentication information;
                name and contact information; company and role information; VA professional profiles, resumes,
                portfolio information, availability, rates, skills, tools and industries; applications, vetting,
                assessment and training records; interview, placement and workroom information; payment and
                transaction records; support and privacy requests; security and audit events; and product analytics.
              </p>
              <p className="muted">
                Private resumes and other non-public hiring records are not published in the talent directory.
                Payment card or e-wallet credentials are entered into the payment provider&apos;s hosted payment
                experience rather than stored as raw card credentials by VirtualAssistant.com.ph.
              </p>
            </div>

            <div className="card">
              <h2>Why we process information</h2>
              <p className="muted">
                We use information to create and secure accounts; operate VA and client profiles; vet candidates;
                provide training; receive hiring briefs and applications; match people to relevant roles; manage
                recruiter review, interviews, offers, placements and workrooms; collect and reconcile payments;
                prevent abuse; provide support; maintain required business records; and understand product
                performance. The legal basis depends on the activity and may include your consent, steps requested
                before or during a service relationship, legitimate business purposes permitted by law, and legal
                or regulatory obligations.
              </p>
            </div>

            <div className="card">
              <h2>Matching, search, and profiling</h2>
              <p className="muted">
                The platform uses automated processing to help search and rank professional profiles against role
                requirements. Signals can include specialties, skills, tools, industries, experience, rate,
                availability, schedule or timezone overlap, and other professional-profile information. Search may
                also use mathematical representations of public professional profile text to identify semantic
                relevance to a client&apos;s search.
              </p>
              <p className="muted">
                These systems support human review. They do not make the final hiring, rejection, vetting approval,
                placement, or payout decision on their own. Recruiters and clients review the relevant evidence and
                make the applicable human decision. If you believe profile information used for matching is
                inaccurate, you can update your profile or submit a privacy/data request.
              </p>
            </div>

            <div className="card">
              <h2>Public VA profiles require a separate choice</h2>
              <p className="muted">
                Creating a VA account, completing vetting, or being approved by a recruiter does not by itself
                authorize public display. A VA must separately opt in to public-profile discovery. The platform
                records the consent state, notice version, and grant or withdrawal date. A VA can withdraw this
                choice from the VA Profile page.
              </p>
              <p className="muted">
                Withdrawing public-profile consent makes the profile ineligible for the public VA directory. It
                does not automatically delete private applications, interviews, workrooms, payment records, audit
                records, or other information that still has a valid operational, contractual, security, or legal
                retention purpose.
              </p>
            </div>

            <div className="card">
              <h2>What can appear publicly</h2>
              <p className="muted">
                When a VA has opted in and meets the platform&apos;s approval and eligibility rules, the public
                directory can show a limited professional profile. This can include first name plus last initial,
                profile photo, professional headline and summary, specialty, skills, tools, industries, languages,
                years of experience, general availability and schedule, hourly rate, and selected verified
                professional signals. Public-profile consent is not permission to publish private contact,
                application, payment, assessment-answer, recruiter-note, or resume information.
              </p>
            </div>

            <div className="card">
              <h2>Service providers and cross-border processing</h2>
              <p className="muted">
                We use specialist providers for cloud hosting, databases, authentication, file storage, email
                delivery, analytics, scheduling/video meetings, payment processing, and limited AI or embedding
                processing used by specific product features. Current platform integrations include services such
                as Vercel, Supabase, Resend, Google Calendar/Meet, PayMongo, and configured analytics or AI
                providers. Some providers may process data outside the Philippines. VirtualAssistant.com.ph remains
                responsible for choosing appropriate providers, limiting the information shared to the relevant
                purpose, and applying contractual and technical safeguards appropriate to the processing.
              </p>
            </div>

            <div className="card">
              <h2>Retention and deletion</h2>
              <p className="muted">
                We retain information only while it is needed for the purpose collected and for applicable
                operational, contractual, security, dispute, accounting, tax, or legal requirements. Incomplete
                abandoned VA accounts can be automatically removed when they remain incomplete and have no
                protected application, vetting, offer, or workroom relationship. Public-profile withdrawal affects
                public display without requiring us to erase records that still have another lawful purpose.
              </p>
              <p className="muted">
                Retention is reviewed by data category rather than applying one indefinite period to everything.
                When data is no longer required, it should be deleted, anonymized, or securely disposed of. A
                verified deletion request can also be assessed against any records that must still be retained.
              </p>
            </div>

            <div className="card">
              <h2>Security and access</h2>
              <p className="muted">
                Private files use controlled access and short-lived signed links. Account and hiring data are
                protected through role-based application controls, database row-level policies, and server-only
                workflows for privileged operations. Sensitive financial state changes use audited server-side
                transitions. We also use logging, abuse controls, dependency checks, and access reviews. No system
                can guarantee absolute security, so controls and incident response are maintained as an ongoing
                program.
              </p>
            </div>

            <div className="card">
              <h2>Your privacy rights</h2>
              <p className="muted">
                Subject to applicable law and the circumstances, you may have rights to be informed, access your
                personal data, request correction, object to certain processing, withdraw consent, request deletion
                or blocking where appropriate, obtain data portability where applicable, and raise a privacy
                concern. Public-profile consent can be changed directly from the VA Profile page.
              </p>
              <p className="muted">
                For another privacy request, use the <Link className="text-link" href="/contact">contact form</Link>
                {" "}and choose <strong>Privacy or data request</strong>. We will verify the request before exposing,
                changing, exporting, or deleting account information.
              </p>
            </div>

            <div className="card">
              <h2>Incidents and complaints</h2>
              <p className="muted">
                Suspected personal-data incidents are assessed under the platform&apos;s incident-response process
                and applicable National Privacy Commission reporting and notification requirements. You can report
                a suspected privacy or security issue through the contact channel above. You may also raise a
                complaint with the National Privacy Commission when applicable.
              </p>
            </div>

            <div className="card">
              <h2>Public-profile controls</h2>
              <p className="muted">
                If you are a VA, open your{" "}
                <Link className="text-link" href="/workspace/va/profile#visibility">
                  VA Profile privacy settings
                </Link>{" "}
                to grant or withdraw public-profile consent. A profile can remain approved for private matching
                without being publicly listed.
              </p>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
