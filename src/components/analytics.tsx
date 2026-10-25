"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getBrowserSessionId } from "@/lib/browser-session";

const endpoint = "/api/analytics";

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

function isTrainingPath(pathname: string) {
  return pathname === "/training"
    || pathname.startsWith("/training/")
    || pathname.startsWith("/workspace/training")
    || pathname.startsWith("/auth/join/training");
}

function trackablePath(pathname: string) {
  // Business conversions remain tracked, but training browsing is not
  // sent to our analytics API or GA4 as custom activity events.
  return pathname === "/workspace/va/onboarding"
    || (!isTrainingPath(pathname) && !pathname.startsWith("/workspace") && !pathname.startsWith("/api"));
}

/**
 * GA4 only ever received the base pageview, so every conversion we already
 * track landed in our own store and nowhere Google could report on. These are
 * the same events, forwarded, so key events can be defined against them and
 * read by channel and country.
 *
 * page_view is left out: GA4's enhanced measurement already records it,
 * including client-side navigation. Custom Web Vitals collection is disabled.
 */
const GA4_SKIPPED_EVENTS = new Set(["page_view"]);

/** GA4 accepts letters, digits and underscores, starting with a letter, max 40. */
function ga4EventName(event: string) {
  const cleaned = event.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+/, "");
  return /^[a-z]/.test(cleaned) ? cleaned.slice(0, 40) : `event_${cleaned}`.slice(0, 40);
}

function forwardToGa4(event: string, metadata?: Record<string, unknown>) {
  if (event.startsWith("training_") || GA4_SKIPPED_EVENTS.has(event)) return;
  const gtag = typeof window !== "undefined" ? window.gtag : undefined;
  if (typeof gtag !== "function") return;

  // GA4 drops events carrying more than 25 parameters, and truncates values
  // past 100 characters, so only scalars are passed and the rest is dropped.
  const params: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string") params[key] = value.slice(0, 100);
    else if (typeof value === "number" || typeof value === "boolean") params[key] = value;
    if (Object.keys(params).length >= 24) break;
  }
  params.page_path = window.location.pathname.slice(0, 100);

  try {
    gtag("event", ga4EventName(event), params);
  } catch {
    // Reporting must never interrupt the user experience.
  }
}

type AnalyticsEvent = { event: string; metadata?: Record<string, unknown> };

// Low-intent engagement events belong in GA4, not in a separate Vercel
// Function + rate-limiter RPC + database write. Keep conversion beacons.
const GA4_ONLY_EVENTS = new Set(["form_start", "login_submit"]);
const RETIRED_EVENTS = new Set(["page_view"]);

/**
 * Forward conversion events to GA4, and persist only meaningful funnel events.
 * Page views are measured by GA4 itself rather than a Vercel Function.
 */
function sendMany(events: AnalyticsEvent[]) {
  for (const { event, metadata } of events) forwardToGa4(event, metadata);
  const tracked = events.filter(({ event }) =>
    !event.startsWith("training_") &&
    !GA4_ONLY_EVENTS.has(event) &&
    !RETIRED_EVENTS.has(event)
  );
  if (!tracked.length) return;

  const referrer = document.referrer ? (() => {
    try {
      const url = new URL(document.referrer);
      return url.origin === window.location.origin ? url.pathname : url.origin;
    } catch {
      return null;
    }
  })() : null;
  const sessionId = getBrowserSessionId() || undefined;
  const entries = tracked.map(({ event, metadata }) => ({
    event_id: typeof window.crypto?.randomUUID === "function" ? window.crypto.randomUUID() : undefined,
    event,
    // Keep analytics acquisition-focused and avoid persisting query-string values.
    path: window.location.pathname,
    referrer,
    session_id: sessionId,
    metadata: metadata ?? {},
  }));
  // Keep the single-event request shape compatible with older deployments.
  const payload = JSON.stringify(entries.length === 1 ? entries[0] : entries);

  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
      if (ok) return;
    }
    void fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: payload, keepalive: true });
  } catch {
    // Analytics must never interrupt the user experience.
  }
}

function send(event: string, metadata?: Record<string, unknown>) {
  sendMany([{ event, metadata }]);
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!trackablePath(pathname)) return;

    if (pathname === "/workspace/va/onboarding") {
      send("va_onboarding_started");
      return;
    }

    const events: AnalyticsEvent[] = [];
    if (pathname === "/pricing") events.push({ event: "pricing_view" });
    if (pathname === "/hire") events.push({ event: "hire_page_view" });
    if (pathname.startsWith("/va/")) events.push({ event: "candidate_view" });
    if (events.length) sendMany(events);
  }, [pathname]);

  useEffect(() => {
    if (!trackablePath(pathname)) return;
    const startedForms = new WeakSet<HTMLFormElement>();

    const handleFocus = (event: FocusEvent) => {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      if (!form || startedForms.has(form)) return;
      startedForms.add(form);
      send("form_start", {
        form_id: form.id || null,
        action: form.getAttribute("action") || window.location.pathname
      });
    };

    const handleClick = (event: MouseEvent) => {
      const clicked = event.target instanceof Element ? event.target.closest<HTMLElement>("a,button,[data-track]") : null;
      if (!clicked) return;
      let href: string | null = null;
      if (clicked instanceof HTMLAnchorElement) {
        try {
          const url = new URL(clicked.href, window.location.origin);
          href = url.origin === window.location.origin ? url.pathname : url.origin;
          if (url.hostname === "calendar.app.google" || (url.origin === window.location.origin && url.pathname === "/book-client-call")) {
            send("booking_click", { href: url.origin });
          }
        } catch {
          href = null;
        }
      }
      if (!clicked.dataset.track) return;
      send(String(clicked.dataset.track), {
        label: clicked.textContent?.trim().slice(0, 120) || null,
        href,
        course_slug: clicked.dataset.courseSlug || null,
        cta_position: clicked.dataset.ctaPosition || null,
      });
    };

    document.addEventListener("focusin", handleFocus);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("click", handleClick);
    };
  }, [pathname]);

  return null;
}
