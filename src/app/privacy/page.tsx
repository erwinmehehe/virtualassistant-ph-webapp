import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: "Privacy Notice",
  description: "How VirtualAssistant.com.ph handles public VA profiles, private hiring data, consent, retention, and privacy rights.",
  alternates: { canonical: canonicalPath("/privacy") }
};

export default function PrivacyPage() {
  return <><SiteHeader/><main id="main-content">
    <section className="section public-hero-small"><div className="container public-page-head"><h1 className="public-page-title">Privacy Notice</h1><p className="public-lede">This notice explains how VirtualAssistant.com.ph handles account, hiring, and public-profile information, including the choices available to Virtual Assistants whose professional profiles may appear in the public directory.</p></div></section>
    <section className="section section-white"><div className="container stack" style={{maxWidth:820}}>
      <div className="card"><h2>Our privacy approach</h2><p className="muted">For platform data where VirtualAssistant.com.ph determines why and how personal information is processed, we apply the principles of transparency, legitimate purpose, proportionality, security, and appropriate retention. For users in the Philippines, this includes the privacy principles and data-subject rights recognized by the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules.</p></div>

      <div className="card"><h2>Public VA profiles require a separate choice</h2><p className="muted">Creating a VA account, completing vetting, or being approved by a recruiter does not by itself authorize public display. A VA must separately opt in to public-profile discovery. The platform records the consent state, the version of this notice used, and the date of the grant or withdrawal. A VA can withdraw this choice from the VA Profile page.</p><p className="muted">Withdrawing public-profile consent makes the profile ineligible for the public VA directory. It does not delete the account, applications, messages, interviews, workrooms, or other private hiring records that may still need to be retained for legitimate operational, contractual, security, or legal purposes.</p></div>

      <div className="card"><h2>What can appear publicly</h2><p className="muted">When a VA has opted in and also satisfies the platform's approval and eligibility rules, the public directory can show a limited professional profile. This may include first name plus last initial, profile photo, professional headline and summary, specialty, skills, tools, industries, languages, years of experience, general availability and schedule, hourly rate, and selected professional-profile signals.</p><p className="muted">Public-profile consent is only for the professional information described in the consent control. It is not permission to publish the VA's private account or hiring records.</p></div>

      <div className="card"><h2>What stays private</h2><p className="muted">Email addresses, phone numbers, home address, private resumes, identity documents, account records, test answers, recruiter/admin notes, private messages, client commercial terms, payment information, and other non-public hiring data are not part of the public VA directory. Access is limited by role and the relevant hiring relationship.</p></div>

      <div className="card"><h2>Why we process information</h2><p className="muted">We process account and hiring information to create and secure accounts, build VA and client profiles, run vetting and matching, manage role briefs and applications, facilitate recruiter and client communication, support interviews and placements, operate workrooms, prevent abuse, maintain platform records, provide support, and understand product performance. Public professional-profile information is displayed only when the VA has made the separate public-profile choice and the profile meets the platform's publication rules.</p></div>

      <div className="card"><h2>Service providers and hosting</h2><p className="muted">The platform uses service providers for hosting, databases, authentication, email delivery, analytics, and other operational functions. Those providers process information only as needed to provide the relevant service and are subject to their own security and data-protection obligations and contractual terms.</p></div>

      <div className="card"><h2>Retention and deletion</h2><p className="muted">We keep personal information only for as long as reasonably necessary for the purpose for which it was collected, the hiring relationship, security and fraud prevention, dispute handling, legal or accounting obligations, and documented operational retention rules. Where information is no longer necessary, it should be deleted, anonymized, or otherwise disposed of securely. Withdrawing public-profile consent affects public display immediately but does not automatically erase records that still have a valid private purpose.</p></div>

      <div className="card"><h2>Your privacy rights</h2><p className="muted">Depending on applicable law and the circumstances, you may have rights to be informed, access personal data, request correction, object to certain processing, withdraw consent, request deletion or blocking where appropriate, and raise a privacy concern. Public-profile consent can be changed directly from the VA Profile page. For other requests, use the platform's support or contact channel and provide enough information for us to verify the account and request safely.</p></div>

      <div className="card"><h2>Security</h2><p className="muted">Private files use controlled access, account data is protected through role-based application and database controls, and sensitive operations are performed through authenticated server-side workflows. No system can guarantee absolute security, so access controls, audit trails, least-privilege design, and ongoing maintenance remain part of the platform's security program.</p></div>

      <div className="card"><h2>Public-profile controls</h2><p className="muted">If you are a VA, open your <Link className="text-link" href="/workspace/va/profile#visibility">VA Profile privacy settings</Link> to grant or withdraw public-profile consent. A profile can be approved for private matching without being publicly listed.</p></div>
    </div></section>
  </main><SiteFooter/></>;
}
