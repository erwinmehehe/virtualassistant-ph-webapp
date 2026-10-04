"use client";

import { useEffect } from "react";

const FIRST_TOUCH_KEY = "vaph:first-touch-attribution";

function safeHost(value: string) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function AttributionTracker() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem(FIRST_TOUCH_KEY)) return;
      const params = new URLSearchParams(window.location.search);
      const referrer = document.referrer;
      window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify({
        source: (params.get("utm_source") || safeHost(referrer) || "direct").slice(0, 160),
        medium: (params.get("utm_medium") || "").slice(0, 160),
        campaign: (params.get("utm_campaign") || "").slice(0, 240),
        landingPage: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
      }));
    } catch {
      // Attribution must never interfere with page rendering.
    }
  }, []);

  return null;
}
