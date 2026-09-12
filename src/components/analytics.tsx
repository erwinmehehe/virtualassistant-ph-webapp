"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { getBrowserSessionId } from "@/lib/browser-session";

const endpoint = "/api/analytics";

function trackablePath(pathname: string) {
  return !pathname.startsWith("/workspace") && !pathname.startsWith("/api");
}

function send(event: string, metadata?: Record<string, unknown>) {
  const payload = JSON.stringify({
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

function reportWorkspaceVital(metric: WebVitalMetric) {
  if (!window.location.pathname.startsWith("/workspace")) return;
  send("web_vital", {
    id: metric.id,
    name: metric.name,
    value: Math.round(metric.value * 10) / 10,
    rating: metric.rating || null,
    navigation_type: metric.navigationType || null
  });
}

export function Analytics() {
  const pathname = usePathname();
  useReportWebVitals(reportWorkspaceVital);

  useEffect(() => {
    if (!trackablePath(pathname)) return;
    send("page_view");
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
        href
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
