"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, X } from "lucide-react";

const DISMISS_KEY = "va_discovery_cta_dismissed";

// Google Calendar appointment schedule. NEXT_PUBLIC_DISCOVERY_CALL_URL
// overrides it without touching this file.
const DISCOVERY_CALL_URL = "https://calendar.app.google/FxedmioyeJhKras87";

const VA_FACING_PATHS = [
  "/for-virtual-assistants",
  "/jobs",
  "/auth/join/va",
  "/workspace/va",
];

function isVaFacingPath(pathname: string) {
  return VA_FACING_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Floating discovery-call prompt for public client-facing pages.
 *
 * Appears after the visitor has scrolled a little, so it does not cover the
 * hero on arrival, and stays dismissed for the rest of the browser session
 * once closed. It is intentionally hidden from VA-focused application, jobs,
 * and workspace routes so applicants do not mistake a client sales call for
 * a VA interview.
 */
export function FloatingCta() {
  const pathname = usePathname();
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

  if (isVaFacingPath(pathname) || dismissed || !visible) return null;

  const href = process.env.NEXT_PUBLIC_DISCOVERY_CALL_URL?.trim() || DISCOVERY_CALL_URL;
  const external = href.startsWith("http");

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  return (
    <div className="floating-cta" role="complementary" aria-label="Book a client discovery call">
      <div className="floating-cta-copy">
        <strong>Hiring a Virtual Assistant?</strong>
        <span>Client discovery calls are for businesses looking to hire. VA applicants should use our VA application page instead.</span>
      </div>
      {external
        ? <a className="btn btn-primary" href={href} target="_blank" rel="noopener noreferrer" data-track="discovery_call_click"><CalendarClock size={16}/> Book a client call</a>
        : <Link className="btn btn-primary" href={href} data-track="discovery_call_click"><CalendarClock size={16}/> Book a client call</Link>}
      <button className="floating-cta-close" type="button" onClick={close} aria-label="Dismiss">
        <X size={15}/>
      </button>
    </div>
  );
}
