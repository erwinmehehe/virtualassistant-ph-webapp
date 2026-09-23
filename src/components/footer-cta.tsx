"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { usePathname } from "next/navigation";

// Pages that end with their own closing call to action (CtaBand); showing this one
// too would stack two back-to-back "ready to hire" sections.
// /training speaks to Virtual Assistants, so the hire-a-VA band would be
// aimed at the wrong reader; that page carries its own, smaller client CTA.
const PAGES_WITH_OWN_CTA = [/^\/training\/?$/, /^\/service\/[^/]+\/?$/, /^\/industries(\/[^/]+)?\/?$/, /^\/pricing\/?$/, /^\/how-vetting-works\/?$/, /^\/software\/?$/];

export function FooterCta() {
  const pathname = usePathname();

  if (pathname === "/") return null;
  if (PAGES_WITH_OWN_CTA.some((pattern) => pattern.test(pathname))) return null;

  return (
    <div className="container va-footer-cta">
      <div>
        <div className="kicker">Ready to hire?</div>
        <h2>Tell us what needs to get off your plate. We will help you find the right Filipino Virtual Assistant.</h2>
      </div>
      <div className="va-footer-actions">
        <Link className="btn btn-primary" href="/hire">Get matched <ArrowRight size={15}/></Link>
        <Link className="btn va-footer-outline" href="/find-talent">Browse Virtual Assistants</Link>
        <Link className="btn va-footer-outline" href="/book-client-call" data-track="booking_click"><CalendarDays size={15}/> Discuss your VA needs</Link>
      </div>
    </div>
  );
}
