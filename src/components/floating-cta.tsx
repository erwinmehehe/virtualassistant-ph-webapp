"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, X } from "lucide-react";

const DISMISS_KEY = "va_discovery_cta_dismissed";
const DISCOVERY_CALL_URL = "/book-client-call";

const VA_FACING_PATHS = [
  "/for-virtual-assistants",
  "/jobs",
  "/auth/join/va",
  "/workspace/va",
];

const HIGH_INTENT_PATHS = ["/", "/hire", "/pricing", "/services", "/contact"];

function isVaFacingPath(pathname: string) {
  return VA_FACING_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isHighIntentPath(pathname: string) {
  return HIGH_INTENT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Floating discovery-call prompt for public client-facing pages.
 *
 * Stays visible on the homepage, appears on other high-intent pages after
 * a scroll, and can also appear after form abandonment. It remains dismissible
 * for the browser session and hidden from VA-focused routes so applicants do
 * not mistake a client sales call for a VA interview.
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
    setVisible(pathname === "/");
    const onScroll = () => setVisible((current) => current || (pathname !== "/" && isHighIntentPath(pathname) && window.scrollY > 600));
    const onFormFocus = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("main form")) {
        sessionStorage.setItem("va_discovery_form_started", "1");
      }
    };
    const onMouseOut = (event: MouseEvent) => {
      if (event.relatedTarget || !sessionStorage.getItem("va_discovery_form_started")) return;
      setVisible(true);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFormFocus);
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFormFocus);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [pathname]);

  if (isVaFacingPath(pathname) || (!isHighIntentPath(pathname) && !visible) || dismissed || !visible) return null;

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  return (
    <div className="floating-cta" role="complementary" aria-label="Book a client discovery call">
      <div className="floating-cta-copy">
        <strong>Hiring a Virtual Assistant?</strong>
      </div>
      <Link className="btn btn-primary" href={DISCOVERY_CALL_URL} data-track="discovery_call_click"><CalendarClock size={16}/> Book a discovery call</Link>
      <button className="floating-cta-close" type="button" onClick={close} aria-label="Dismiss">
        <X size={15}/>
      </button>
    </div>
  );
}
