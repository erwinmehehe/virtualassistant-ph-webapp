import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, UserRoundCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MarketingHero } from "@/components/marketing-hero";
import { submitContactAction } from "@/app/actions/leads";
import { canonicalPath } from "@/lib/seo-url";

export const metadata:Metadata={title:"Contact VirtualAssistant.com.ph",description:"Contact VirtualAssistant.com.ph about hiring a Virtual Assistant, account support, partnerships, privacy, or general questions.",keywords:["contact virtualassistant.com.ph","virtual assistant support"],alternates:{canonical:canonicalPath("/contact")}};

export default async function ContactPage({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
  const q=await searchParams;
  const contactForm = q.sent
    ? <div className="success-state contact-form-card"><CheckCircle2 size={36}/><h2>Message received</h2><p>Your message was saved for follow-up.</p><Link className="btn" href="/">Return home</Link></div>
    : <form action={submitContactAction} className="card stack contact-form-card"><div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1}/></label></div>{q.error?<div className="alert" role="alert">{q.error}</div>:null}<div className="form-grid"><div className="field"><label htmlFor="contact-name">Name *</label><input id="contact-name" name="name" required autoComplete="name"/></div><div className="field"><label htmlFor="contact-email">Email *</label><input id="contact-email" name="email" type="email" required autoComplete="email"/></div><div className="field"><label htmlFor="contact-phone">Phone / WhatsApp</label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={50}/></div><div className="field"><label htmlFor="contact-company">Company</label><input id="contact-company" name="company" autoComplete="organization"/></div><div className="field"><label htmlFor="contact-topic">Topic *</label><select id="contact-topic" name="topic" required defaultValue=""><option value="" disabled>Select a topic</option><option>Client account support</option><option>Virtual Assistant account or application</option><option>Partnership</option><option>Privacy or data request</option><option>General enquiry</option></select></div></div><div className="field"><label htmlFor="contact-message">Message *</label><textarea id="contact-message" name="message" required minLength={20} placeholder="Share the relevant account, role, or situation and what you need help with."/></div><button className="btn btn-primary" type="submit">Send message</button></form>;

  return <><SiteHeader/><main id="main-content">
    <MarketingHero
      eyebrow="Contact VirtualAssistant.com.ph"
      title={<h1 className="public-page-title">What can we help with?</h1>}
      intro={<p className="public-lede">Pick the option that matches you. It is faster than the form for both. Prefer to talk it through? <Link className="text-link" href="/book-client-call" data-track="booking_click">Book a client discovery call</Link>.</p>}
      actions={<><Link className="btn btn-primary btn-lg" href="/hire">I want to hire <ArrowRight size={16}/></Link><Link className="btn btn-lg" href="/auth/join/va">I am a Virtual Assistant</Link></>}
      trust={<><span><CheckCircle2 size={15}/>Hiring support</span><span><CheckCircle2 size={15}/>Account help</span><span><CheckCircle2 size={15}/>Privacy and partnership enquiries</span></>}
      form={contactForm}
    />

    <section className="section section-white"><div className="container" style={{maxWidth:900}}><div className="contact-routing">
      <Link className="contact-routing-card" href="/auth/join/va"><span className="contact-routing-icon"><UserRoundCheck size={22}/></span><span><strong>I am a Virtual Assistant looking for work</strong><small>We do not accept applications by email. Create your free profile, complete vetting, and apply to roles directly.</small><span className="contact-routing-link">Apply as a Virtual Assistant <ArrowRight size={14}/></span></span></Link>
      <Link className="contact-routing-card" href="/hire"><span className="contact-routing-icon"><BriefcaseBusiness size={22}/></span><span><strong>I want to hire a Virtual Assistant</strong><small>Tell us the role, hours, timezone, and budget. Our recruiting team will review it and help you find the right fit.</small><span className="contact-routing-link">Start a hiring request <ArrowRight size={14}/></span></span></Link>
    </div></div></section>
  </main><SiteFooter/></>;
}
