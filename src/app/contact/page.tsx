import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  CircleHelp,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { submitContactAction } from "@/app/actions/leads";
import { canonicalPath } from "@/lib/seo-url";
import { socialMetadata } from "@/lib/og";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { BrowserTimeZoneField } from "@/components/browser-timezone-field";
import "./contact.css";

export const metadata: Metadata = {
  title: "Contact VirtualAssistant.com.ph",
  description: "Contact VirtualAssistant.com.ph about hiring a Virtual Assistant, account support, partnerships, privacy, or general questions.",
  keywords: ["contact virtualassistant.com.ph", "virtual assistant support"],
  alternates: { canonical: canonicalPath("/contact") },
,
  ...socialMetadata({
    title: "Contact VirtualAssistant.com.ph",
    description: "Contact VirtualAssistant.com.ph about hiring a Virtual Assistant, account support, partnerships, privacy, or general questions.",
    path: canonicalPath("/contact"),
    category: "general",
    eyebrow: "Contact",
  }),
};

const ROUTES = [
  {
    href: "/hire",
    icon: BriefcaseBusiness,
    title: "Hire a Virtual Assistant",
    body: "Tell us the role you need and let our recruiting team take it from there.",
    cta: "Start hiring",
    track: "contact_route_hire",
    tone: "primary",
  },
  {
    href: "/book-client-call",
    icon: CalendarCheck,
    title: "Book a discovery call",
    body: "Prefer to talk first? Choose a time and discuss the role with us.",
    cta: "Choose a time",
    track: "booking_click",
    tone: "neutral",
  },
  {
    href: "/auth/join/va",
    icon: UserRoundCheck,
    title: "Apply as a Virtual Assistant",
    body: "Create your profile, complete vetting, and apply to available roles.",
    cta: "Apply as a VA",
    track: "contact_route_va",
    tone: "neutral",
  },
] as const;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;

  const contactForm = q.sent ? (
    <div className="contact-form-card contact-success" role="status">
      <span className="contact-success-icon"><CheckCircle2 size={24} /></span>
      <div>
        <p className="contact-kicker">Message sent</p>
        <h2>Thanks, we’ve got it.</h2>
        <p>Your message was saved and our team can follow up by email.</p>
        <Link className="contact-primary-button" href="/">
          Return home <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  ) : (
    <div className="contact-form-card">
      <div className="contact-form-head">
        <div>
          <p className="contact-kicker">Support & general enquiries</p>
          <h2>Send us a message</h2>
          <p>Use this form for account help, partnerships, privacy requests, or anything that does not fit the options above.</p>
        </div>
        <span className="contact-form-icon" aria-hidden="true"><MessageSquareText size={20} /></span>
      </div>

      <form action={submitContactAction} className="contact-form">
        <div className="contact-honeypot" aria-hidden="true">
          <label>Website<input name="website" tabIndex={-1} /></label>
        </div>
        <BrowserTimeZoneField />

        {q.error ? <div className="contact-error" role="alert">{q.error}</div> : null}

        <div className="contact-form-grid">
          <div className="contact-field">
            <label htmlFor="contact-name">Name</label>
            <input id="contact-name" name="name" required autoComplete="name" placeholder="Your name" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-email">Email</label>
            <input id="contact-email" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-company">Company <span>Optional</span></label>
            <input id="contact-company" name="company" autoComplete="organization" placeholder="Company name" />
          </div>
          <div className="contact-field">
            <label htmlFor="contact-phone">Phone / WhatsApp <span>Optional</span></label>
            <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={50} placeholder="+61..." />
          </div>
          <div className="contact-field contact-span-2">
            <label htmlFor="contact-topic">What do you need help with?</label>
            <select id="contact-topic" name="topic" required defaultValue="">
              <option value="" disabled>Select a topic</option>
              <option>Client account support</option>
              <option>Virtual Assistant account or application</option>
              <option>Partnership</option>
              <option>Privacy or data request</option>
              <option>General enquiry</option>
            </select>
          </div>
          <div className="contact-field contact-span-2">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              minLength={20}
              placeholder="Tell us what happened and what you need help with."
            />
            <small>Minimum 20 characters.</small>
          </div>
        </div>

        <TurnstileWidget action="contact" />

        <div className="contact-form-actions">
          <button className="contact-primary-button" type="submit">
            Send message <ArrowRight size={15} />
          </button>
          <p><LockKeyhole size={13} /> We only use your details to respond to this enquiry.</p>
        </div>
      </form>
    </div>
  );

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="contact-page">
        <section className="contact-hero">
          <div className="container contact-hero-inner">
            <p className="contact-kicker">Contact</p>
            <h1>What can we help with?</h1>
            <p>Choose the fastest route below. Hiring and VA applications go straight to the right workflow, so you do not have to wait on a general inbox.</p>
          </div>
        </section>

        <section className="contact-routes-section" aria-label="Contact options">
          <div className="container contact-routes-grid">
            {ROUTES.map(({ href, icon: Icon, title, body, cta, track, tone }) => (
              <Link
                className={`contact-route-card ${tone === "primary" ? "contact-route-card-primary" : ""}`}
                href={href}
                key={href}
                data-track={track}
              >
                <span className="contact-route-icon" aria-hidden="true"><Icon size={20} /></span>
                <span className="contact-route-content">
                  <strong>{title}</strong>
                  <small>{body}</small>
                </span>
                <span className="contact-route-cta">{cta} <ArrowRight size={14} /></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="contact-support-section">
          <div className="container contact-support-grid">
            <aside className="contact-support-copy">
              <span className="contact-support-icon"><CircleHelp size={22} /></span>
              <h2>Need something else?</h2>
              <p>Send us a message for account support, partnership enquiries, privacy requests, or general questions.</p>

              <div className="contact-support-points">
                <div>
                  <ShieldCheck size={17} />
                  <span><strong>Keep hiring requests out of the support inbox</strong><small>Use the hiring flow above so the role reaches recruiting immediately.</small></span>
                </div>
                <div>
                  <CheckCircle2 size={17} />
                  <span><strong>Give us enough context</strong><small>Include the account, role, or issue involved so the team can understand the request quickly.</small></span>
                </div>
              </div>
            </aside>

            {contactForm}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
