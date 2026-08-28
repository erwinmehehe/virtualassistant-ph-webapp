"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

/**
 * A small persistent CTA that appears once someone scrolls past the hero,
 * so a long service/industry page doesn't require scrolling back to the
 * top to convert. Dismissible for the rest of the session (sessionStorage)
 * so it never nags -- once someone closes it, it stays closed until they
 * open a new tab.
 */
export function StickyHireCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("hideStickyHireCta") === "1") { setDismissed(true); return; }
    const onScroll = () => setVisible(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (dismissed || !visible) return null;

  return (
    <div className="sticky-hire-cta" role="complementary" aria-label="Get a managed VA">
      <Link className="btn btn-primary" href="/hire" data-track="sticky_cta_hire">Get a managed VA <ArrowRight size={15}/></Link>
      <button
        type="button"
        className="sticky-hire-cta-close"
        aria-label="Dismiss"
        onClick={() => { sessionStorage.setItem("hideStickyHireCta", "1"); setDismissed(true); }}
      ><X size={14}/></button>
    </div>
  );
}
