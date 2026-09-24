"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { getBrowserSessionId } from "@/lib/browser-session";

const endpoint = "/api/analytics";

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
  }
}

function isTrainingPath(pathname: string) {
  return pathname === "/training" || pathname.startsWith("/workspace/training");
}

function trackablePath(pathname: string) {
  return isTrainingPath(pathname) || (!pathname.startsWith("/workspace") && !pathname.startsWith("/api"));
}

/**
 * GA4 only ever received the base pageview, so every conversion we already
 * track landed in our own store and nowhere Google could report on. These are
 * the same events, forwarded, so key events can be defined against them and
 * read by channel and country.
 *
 * page_view is left out: GA4's enhanced measurement already records it,
 * including client-side navigation. web_vital is left out as noise.
 */
const GA4_SKIPPED_EVENTS = new Set(["page_view", "web_vital"]);

/** GA4 accepts letters, digits and underscores, starting with a letter, max 40. */
function ga4EventName(event: string) {
  const cleaned = event.trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_+/, "");
  return /^[a-z]/.test(cleaned) ? cleaned.slice(0, 40) : `event_${cleaned}`.slice(0, 40);
}

function forwardToGa4(event: string, metadata?: Record<string, unknown>) {
  if (GA4_SKIPPED_EVENTS.has(event)) return;
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

function send(event: string, metadata?: Record<string, unknown>) {
  forwardToGa4(event, metadata);
  const payload = JSON.stringify({
    event_id: typeof window.crypto?.randomUUID === "function" ? window.crypto.randomUUID() : undefined,
    event,
    // Keep analytics acquisition-focused and avoid persisting query-string values.
    path: window.location.pathname,
    referrer: document.referrer ? (() => {
      try {
        const url = new URL(document.referrer);
        return url.origin === window.location.origin ? url.pathname : url.origin;
      } catch {
        return null;
      }
    })() : null,
    session_id: getBrowserSessionId() || undefined,
    metadata: metadata ?? {}
  });
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

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
};

function reportWebVital(metric: WebVitalMetric) {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/api")) return;

  // CLS is a small unitless number, while LCP/INP/TTFB/FCP are measured in ms.
  // Preserve enough precision to make production field data useful.
  const value = metric.name === "CLS"
    ? Math.round(metric.value * 1000) / 1000
    : Math.round(metric.value);

  send("web_vital", {
    id: metric.id,
    name: metric.name,
    value,
    rating: metric.rating || null,
    navigation_type: metric.navigationType || null,
    surface: pathname.startsWith("/workspace") ? "workspace" : "public"
  });
}

export function Analytics() {
  const pathname = usePathname();
  useReportWebVitals(reportWebVital);

  useEffect(() => {
    if (!trackablePath(pathname)) return;

    if (pathname.startsWith("/workspace/training")) {
      if (pathname === "/workspace/training") {
        send("training_dashboard_view");
        return;
      }

      const segments = pathname.split("/").filter(Boolean);
      const courseIndex = segments.indexOf("courses");
      const courseSlug = courseIndex >= 0 ? segments[courseIndex + 1] || null : null;
      const lessonIndex = segments.indexOf("lessons");
      const assessmentIndex = segments.indexOf("assessments");

      if (assessmentIndex >= 0) {
        send("training_assessment_view", {
          course_slug: courseSlug,
          assessment_id: segments[assessmentIndex + 1] || null,
        });
      } else if (lessonIndex >= 0) {
        send("training_lesson_view", {
          course_slug: courseSlug,
          lesson_id: segments[lessonIndex + 1] || null,
        });
      } else if (courseSlug) {
        send("training_course_view", { course_slug: courseSlug });
      }
      return;
    }

    send("page_view");
    if (pathname.startsWith("/training/certificates/")) {
      send("training_certificate_view");
    }
    if (pathname === "/training") send("training_landing_view");
    if (pathname === "/pricing") send("pricing_view");
    if (pathname === "/hire") send("hire_page_view");
    if (pathname.startsWith("/va/")) send("candidate_view");
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

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      send("form_submit_attempt", {
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
    document.addEventListener("submit", handleSubmit);
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("submit", handleSubmit);
      document.removeEventListener("click", handleClick);
    };
  }, [pathname]);

  return null;
}
