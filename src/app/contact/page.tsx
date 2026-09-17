import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CheckCircle2, LockKeyhole, UserRoundCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { submitContactAction } from "@/app/actions/leads";
import { canonicalPath } from "@/lib/seo-url";

export const metadata:Metadata={title:"Contact VirtualAssistant.com.ph",description:"Contact VirtualAssistant.com.ph about hiring a Virtual Assistant, account support, partnerships, privacy, or general questions.",keywords:["contact virtualassistant.com.ph","virtual assistant support"],alternates:{canonical:canonicalPath("/contact")}};

const ROUTES = [
  { href: "/hire", icon: BriefcaseBusiness, title: "I want to hire a Virtual Assistant", body: "Tell us the role, hours, and budget. Our recruiting team reviews it and helps you find the right fit.", cta: "Start a hiring brief", track: "contact_route_hire" },
  { href: "/book-client-call", icon: CalendarCheck, title: "I'd rather talk it through", body: "Book a client discovery call and we will cover the role, schedule, budget, and next steps together.", cta: "Book a client discovery call", track: "booking_click" },
  { href: "/auth/join/va", icon: UserRoundCheck, title: "I am a Virtual Assistant looking for work", body: "We do not accept applications by email. Create your free profile, complete vetting, and apply to roles directly.", cta: "Apply as a Virtual Assistant", track: "contact_route_va" },
] as const;

export default async function ContactPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;

  const contactForm = q.sent
    ? <div className="hb-card hb-success" role="status"><div className="hb-success-icon"><CheckCircle2 size={22}/></div><h2>Message received</h2><p>Your message was saved and our team will follow up by email.</p><Link className="hb-submit" href="/">Return home <ArrowRight size={16}/></Link></div>
    : <div className="hb-card">
        <div className="hb-head"><h2>Send us a message</h2><p>For account help, partnerships, privacy requests, or anything else.</p></div>
        <form action={submitContactAction} className="hb-form">
          <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1}/></label></div>
          {q.error?<div className="hb-error" role="alert">{q.error}</div>:null}
          <div className="hb-row">
            <div className="hb-field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" required autoComplete="name"/></div>
            <div className="hb-field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" required autoComplete="email"/></div>
          </div>
          <div className="hb-row">
            <div className="hb-field"><label htmlFor="contact-phone">Phone / WhatsApp <span className="hb-optional">optional</span></label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={50}/></div>
            <div className="hb-field"><label htmlFor="contact-company">Company <span className="hb-optional">optional</span></label><input id="contact-company" name="company" autoComplete="organization"/></div>
          </div>
          <div className="hb-field"><label htmlFor="contact-topic">Topic</label><select id="contact-topic" name="topic" required defaultValue=""><option value="" disabled>Select a topic</option><option>Client account support</option><option>Virtual Assistant account or application</option><option>Partnership</option><option>Privacy or data request</option><option>General enquiry</option></select></div>
          <div className="hb-field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" rows={4} required minLength={20} placeholder="Share the relevant account, role, or situation and what you need help with."/></div>
          <button className="hb-submit" type="submit">Send message <ArrowRight size={16}/></button>
          <p className="hb-foot"><LockKeyhole size={13}/>We only use your details to reply to this message.</p>
        </form>
      </div>;

  return <><SiteHeader/><main id="main-content">
    <section className="hh contact-hh">
      <div className="container">
        <div className="hh-grid">
          <div className="hh-copy">
            <span className="hh-eyebrow"><CheckCircle2 size={14}/>Contact VirtualAssistant.com.ph</span>
            <h1 className="hh-title">What can we help with?</h1>
            <p className="hh-lede">Pick the option that matches you. It is faster than the form for hiring and for applying.</p>
            <div className="contact-routes">
              {ROUTES.map(({ href, icon: Icon, title, body, cta, track }) => (
                <Link className="contact-route" href={href} key={href} data-track={track}>
                  <span className="contact-route-icon" aria-hidden="true"><Icon size={20}/></span>
                  <span className="contact-route-copy"><strong>{title}</strong><small>{body}</small><em>{cta} <ArrowRight size={14}/></em></span>
                </Link>
              ))}
            </div>
          </div>
          <div className="hh-form">{contactForm}</div>
        </div>
      </div>
    </section>
  </main><SiteFooter/></>;
}
