"use client";

import { useEffect } from "react";

const FIRST_TOUCH_KEY = "vaph:first-touch-attribution";
const LAST_TOUCH_KEY = "vaph:last-touch-attribution";

function safeHost(value: string) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function externalReferrerHost() {
  const referrerHost = safeHost(document.referrer);
  if (!referrerHost) return "";
  const currentHost = window.location.hostname.toLowerCase();
  return referrerHost === currentHost ? "" : referrerHost;
}

export function AttributionTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const externalReferrer = externalReferrerHost();
      const campaignSource = params.get("utm_source") || "";
      const hasAcquisitionSignal = Boolean(
        campaignSource ||
        params.get("utm_medium") ||
        params.get("utm_campaign") ||
        externalReferrer,
      );
      const capturedAt = new Date().toISOString();
      const touch = {
        source: (campaignSource || externalReferrer || "direct").slice(0, 160),
        medium: (params.get("utm_medium") || "").slice(0, 160),
        campaign: (params.get("utm_campaign") || "").slice(0, 240),
        content: (params.get("utm_content") || "").slice(0, 240),
        term: (params.get("utm_term") || "").slice(0, 240),
        landingPage: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
        referrer: document.referrer.slice(0, 1000),
        capturedAt,
      };

      if (!window.localStorage.getItem(FIRST_TOUCH_KEY)) {
        window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
      }

      if (hasAcquisitionSignal || !window.localStorage.getItem(LAST_TOUCH_KEY)) {
        window.localStorage.setItem(LAST_TOUCH_KEY, JSON.stringify(touch));
      }
    } catch {
      // Attribution must never interfere with page rendering.
    }
  }, []);

  return null;
}
