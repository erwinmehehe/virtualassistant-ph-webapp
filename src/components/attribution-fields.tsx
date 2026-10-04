"use client";

import { useEffect, useState } from "react";
import { getBrowserSessionId } from "@/lib/browser-session";

type StoredTouch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  landingPage?: string;
  referrer?: string;
  capturedAt?: string;
};

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
  firstTouchAt: string;
  lastTouchSource: string;
  lastTouchMedium: string;
  lastTouchCampaign: string;
  lastTouchLandingPage: string;
  lastTouchAt: string;
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
  firstTouchAt: "",
  lastTouchSource: "",
  lastTouchMedium: "",
  lastTouchCampaign: "",
  lastTouchLandingPage: "",
  lastTouchAt: "",
};

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

function readTouch(key: string): StoredTouch | null {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) as StoredTouch : null;
  } catch {
    return null;
  }
}

export function AttributionFields({ sourcePath }: { sourcePath: string }) {
  const [sessionId, setSessionId] = useState("");
  const [attribution, setAttribution] = useState<Attribution>(EMPTY);

  useEffect(() => {
    setSessionId(getBrowserSessionId());

    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer.slice(0, 1000);
    const currentSource = params.get("utm_source")?.slice(0, 160) || "";
    const current = {
      source: currentSource || safeHost(referrer) || "direct",
      medium: params.get("utm_medium")?.slice(0, 160) || "",
      campaign: params.get("utm_campaign")?.slice(0, 240) || "",
      content: params.get("utm_content")?.slice(0, 240) || "",
      term: params.get("utm_term")?.slice(0, 240) || "",
      referrer,
      landingPage: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
      capturedAt: new Date().toISOString(),
    };

    const firstTouch = readTouch(FIRST_TOUCH_KEY) || current;
    const lastTouch = readTouch(LAST_TOUCH_KEY) || current;

    setAttribution({
      utmSource: currentSource,
      utmMedium: current.medium,
      utmCampaign: current.campaign,
      utmContent: current.content,
      utmTerm: current.term,
      referrer: current.referrer,
      landingPage: current.landingPage,
      firstTouchSource: String(firstTouch.source || "direct").slice(0, 160),
      firstTouchMedium: String(firstTouch.medium || "").slice(0, 160),
      firstTouchCampaign: String(firstTouch.campaign || "").slice(0, 240),
      firstTouchLandingPage: String(firstTouch.landingPage || sourcePath).slice(0, 1000),
      firstTouchAt: String(firstTouch.capturedAt || "").slice(0, 64),
      lastTouchSource: String(lastTouch.source || current.source || "direct").slice(0, 160),
      lastTouchMedium: String(lastTouch.medium || "").slice(0, 160),
      lastTouchCampaign: String(lastTouch.campaign || "").slice(0, 240),
      lastTouchLandingPage: String(lastTouch.landingPage || current.landingPage).slice(0, 1000),
      lastTouchAt: String(lastTouch.capturedAt || current.capturedAt).slice(0, 64),
    });
  }, [sourcePath]);

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
    <input type="hidden" name="first_touch_at" value={attribution.firstTouchAt} />
    <input type="hidden" name="last_touch_source" value={attribution.lastTouchSource} />
    <input type="hidden" name="last_touch_medium" value={attribution.lastTouchMedium} />
    <input type="hidden" name="last_touch_campaign" value={attribution.lastTouchCampaign} />
    <input type="hidden" name="last_touch_landing_page" value={attribution.lastTouchLandingPage} />
    <input type="hidden" name="last_touch_at" value={attribution.lastTouchAt} />
  </>;
}
