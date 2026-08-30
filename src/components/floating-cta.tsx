"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, X } from "lucide-react";

const DISMISS_KEY = "va_discovery_cta_dismissed";

// Google Calendar appointment schedule. NEXT_PUBLIC_DISCOVERY_CALL_URL
// overrides it without touching this file.
const DISCOVERY_CALL_URL = "https://calendar.app.google/FxedmioyeJhKras87";

/**
 * Floating discovery-call prompt for public pages.
 *
 * Appears after the visitor has scrolled a little, so it does not cover the
 * hero on arrival, and stays dismissed for the rest of the browser session
 * once closed. Sends people to the booking page above; set
 * NEXT_PUBLIC_DISCOVERY_CALL_URL to point it elsewhere without a code change.
 */
export function FloatingCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  const href = process.env.NEXT_PUBLIC_DISCOVERY_CALL_URL?.trim() || DISCOVERY_CALL_URL;
  const external = href.startsWith("http");

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  return (
    <div className="floating-cta" role="complementary" aria-label="Book a discovery call">
      <div className="floating-cta-copy">
        <strong>Not sure what to delegate?</strong>
        <span>Book a 15-minute discovery call and we will map the role with you.</span>
      </div>
      {external
        ? <a className="btn btn-primary" href={href} target="_blank" rel="noopener noreferrer" data-track="discovery_call_click"><CalendarClock size={16}/> Book a call</a>
        : <Link className="btn btn-primary" href={href} data-track="discovery_call_click"><CalendarClock size={16}/> Book a call</Link>}
      <button className="floating-cta-close" type="button" onClick={close} aria-label="Dismiss">
        <X size={15}/>
      </button>
    </div>
  );
}
