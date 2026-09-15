"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { usePathname } from "next/navigation";

export function FooterCta() {
  const pathname = usePathname();

  if (pathname === "/") return null;

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
