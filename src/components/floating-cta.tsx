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
];

const INTERNAL_PATHS = ["/workspace", "/auth"];
const INLINE_MATCH_PATHS = ["/service/", "/industries/"];
const HIGH_INTENT_PATHS = ["/", "/hire", "/pricing", "/services", "/contact"];

function startsWithAny(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(path));
}

function isVaFacingPath(pathname: string) {
  return VA_FACING_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isHighIntentPath(pathname: string) {
  return HIGH_INTENT_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

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
        try { sessionStorage.setItem("va_discovery_form_started", "1"); } catch { /* private mode */ }
      }
    };
    const onMouseOut = (event: MouseEvent) => {
      let started = false;
      try { started = sessionStorage.getItem("va_discovery_form_started") === "1"; } catch { /* private mode */ }
      if (event.relatedTarget || !started) return;
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

  const hasInlineMatch = INLINE_MATCH_PATHS.some((path) => pathname.startsWith(path));
  if (
    startsWithAny(pathname, INTERNAL_PATHS) ||
    isVaFacingPath(pathname) ||
    hasInlineMatch ||
    (!isHighIntentPath(pathname) && !visible) ||
    dismissed ||
    !visible
  ) return null;

  const close = () => {
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, "1"); } catch { /* private mode */ }
  };

  return (
    <div className="floating-cta floating-cta-compact" role="complementary" aria-label="Book a discovery call">
      <Link className="btn btn-primary" href={DISCOVERY_CALL_URL} data-track="discovery_call_click">
        <CalendarClock size={16}/>
        <span className="floating-cta-label-desktop">Book a discovery call</span>
        <span className="floating-cta-label-mobile">Book a call</span>
      </Link>
      <button className="floating-cta-close" type="button" onClick={close} aria-label="Dismiss discovery call prompt">
        <X size={15}/>
      </button>
    </div>
  );
}
