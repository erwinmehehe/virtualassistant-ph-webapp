"use client";

import { useEffect, useState } from "react";
import { getBrowserSessionId } from "@/lib/browser-session";

type Attribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  referrer: string;
  landingPage: string;
  firstTouchSource: string;
  firstTouchMedium: string;
  firstTouchCampaign: string;
  firstTouchLandingPage: string;
};

const EMPTY: Attribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  referrer: "",
  landingPage: "",
  firstTouchSource: "",
  firstTouchMedium: "",
  firstTouchCampaign: "",
  firstTouchLandingPage: "",
};

const FIRST_TOUCH_KEY = "vaph:first-touch-attribution";

function safeHost(value: string) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function AttributionFields({ sourcePath }: { sourcePath: string }) {
  const [sessionId, setSessionId] = useState("");
  const [attribution, setAttribution] = useState<Attribution>(EMPTY);

  useEffect(() => {
    setSessionId(getBrowserSessionId());

    const params = new URLSearchParams(window.location.search);
    const current = {
      utmSource: params.get("utm_source")?.slice(0, 160) || "",
      utmMedium: params.get("utm_medium")?.slice(0, 160) || "",
      utmCampaign: params.get("utm_campaign")?.slice(0, 240) || "",
      utmContent: params.get("utm_content")?.slice(0, 240) || "",
      utmTerm: params.get("utm_term")?.slice(0, 240) || "",
      referrer: document.referrer.slice(0, 1000),
      landingPage: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
    };

    let firstTouch = {
      source: current.utmSource || safeHost(current.referrer) || "direct",
      medium: current.utmMedium,
      campaign: current.utmCampaign,
      landingPage: current.landingPage,
    };

    try {
      const saved = window.localStorage.getItem(FIRST_TOUCH_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<typeof firstTouch>;
        firstTouch = {
          source: String(parsed.source || firstTouch.source).slice(0, 160),
          medium: String(parsed.medium || "").slice(0, 160),
          campaign: String(parsed.campaign || "").slice(0, 240),
          landingPage: String(parsed.landingPage || firstTouch.landingPage).slice(0, 1000),
        };
      } else {
        window.localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(firstTouch));
      }
    } catch {
      // Attribution is useful but must never block a hiring request.
    }

    setAttribution({
      ...current,
      firstTouchSource: firstTouch.source,
      firstTouchMedium: firstTouch.medium,
      firstTouchCampaign: firstTouch.campaign,
      firstTouchLandingPage: firstTouch.landingPage,
    });
  }, []);

  return <>
    <input type="hidden" name="source_path" value={sourcePath} />
    <input type="hidden" name="session_id" value={sessionId} />
    <input type="hidden" name="utm_source" value={attribution.utmSource} />
    <input type="hidden" name="utm_medium" value={attribution.utmMedium} />
    <input type="hidden" name="utm_campaign" value={attribution.utmCampaign} />
    <input type="hidden" name="utm_content" value={attribution.utmContent} />
    <input type="hidden" name="utm_term" value={attribution.utmTerm} />
    <input type="hidden" name="referrer" value={attribution.referrer} />
    <input type="hidden" name="landing_page" value={attribution.landingPage} />
    <input type="hidden" name="first_touch_source" value={attribution.firstTouchSource} />
    <input type="hidden" name="first_touch_medium" value={attribution.firstTouchMedium} />
    <input type="hidden" name="first_touch_campaign" value={attribution.firstTouchCampaign} />
    <input type="hidden" name="first_touch_landing_page" value={attribution.firstTouchLandingPage} />
  </>;
}
