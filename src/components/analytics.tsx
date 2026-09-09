"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const endpoint = "/api/analytics";

function trackablePath(pathname: string) {
  return !pathname.startsWith("/workspace") && !pathname.startsWith("/api");
}

function sessionId() {
  try {
    const key = "va_ph_session";
    const existing = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${key}=`))
      ?.split("=")[1];
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const value = crypto.randomUUID();
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${key}=${value}; Path=/; Max-Age=7776000; SameSite=Lax${secure}`;
    return value;
  } catch {
    return undefined;
  }
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
    session_id: sessionId(),
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

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (trackablePath(pathname)) send("page_view");
  }, [pathname]);

  useEffect(() => {
    if (!trackablePath(pathname)) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-track]") : null;
      if (!target) return;
      let href: string | null = null;
      if (target instanceof HTMLAnchorElement) {
        try {
          const url = new URL(target.href, window.location.origin);
          href = url.origin === window.location.origin ? url.pathname : url.origin;
        } catch {
          href = null;
        }
      }
      send(String(target.dataset.track), {
        label: target.textContent?.trim().slice(0, 120) || null,
        href
      });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  return null;
}
