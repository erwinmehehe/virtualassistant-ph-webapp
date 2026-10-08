import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const strict = process.argv.includes("--strict");
const leadSecret = process.env.LEAD_INGEST_SECRET?.trim() || "";
const resendKey = process.env.RESEND_API_KEY?.trim() || "";
const emailFrom = process.env.EMAIL_FROM?.trim() || "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";
const googleCalendarClientId = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim() || "";
const googleCalendarClientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim() || "";
const googleCalendarRefreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN?.trim() || "";
const cronSecret = process.env.CRON_SECRET?.trim() || "";
const capabilitySigningSecret = process.env.CAPABILITY_SIGNING_SECRET?.trim() || "";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim() || "";
const resendWebhookSecret = process.env.RESEND_WEBHOOK_SECRET?.trim() || "";
const triggerSecret = process.env.TRIGGER_SECRET_KEY?.trim() || "";
const automationCallbackSecret = process.env.AUTOMATION_CALLBACK_SECRET?.trim() || "";
const triggerAutomationsActive = process.env.TRIGGER_AUTOMATIONS_ACTIVE?.trim() || "";
const malwareScanEndpoint = process.env.MALWARE_SCAN_ENDPOINT?.trim() || "";
const malwareScanToken = process.env.MALWARE_SCAN_TOKEN?.trim() || "";
const triggerAutomationConfigured =
  triggerSecret.length >= 20 &&
  automationCallbackSecret.length >= 32 &&
  triggerAutomationsActive === "1";

const checks = [
  {
    name: "LEAD_INGEST_SECRET",
    ok: leadSecret.length >= 32,
    detail: leadSecret.length >= 32 ? "configured" : "missing or shorter than 32 characters"
  },
  {
    name: "RESEND_API_KEY",
    ok: resendKey.length > 10,
    detail: resendKey.length > 10 ? "configured" : "missing"
  },
  {
    name: "EMAIL_FROM",
    ok: emailFrom.includes("@") && !emailFrom.toLowerCase().includes("example.com"),
    detail: emailFrom.includes("@") && !emailFrom.toLowerCase().includes("example.com") ? "configured" : "missing or placeholder"
  },
  {
    name: "NEXT_PUBLIC_APP_URL",
    ok: /^https:\/\//i.test(appUrl) && !/localhost|127\.0\.0\.1/i.test(appUrl),
    detail: /^https:\/\//i.test(appUrl) && !/localhost|127\.0\.0\.1/i.test(appUrl) ? appUrl : "not set to a production HTTPS origin"
  },
  {
    name: "GOOGLE_CALENDAR_CLIENT_ID",
    ok: googleCalendarClientId.length > 0,
    detail: googleCalendarClientId.length > 0 ? "configured" : "missing"
  },
  {
    name: "GOOGLE_CALENDAR_CLIENT_SECRET",
    ok: googleCalendarClientSecret.length > 0,
    detail: googleCalendarClientSecret.length > 0 ? "configured" : "missing"
  },
  {
    name: "GOOGLE_CALENDAR_REFRESH_TOKEN",
    ok: googleCalendarRefreshToken.length > 0,
    detail: googleCalendarRefreshToken.length > 0 ? "configured" : "missing"
  },
  {
    name: "CRON_SECRET",
    ok: cronSecret.length >= 32,
    detail: cronSecret.length >= 32 ? "configured" : "missing or shorter than 32 characters"
  },
  {
    name: "CAPABILITY_SIGNING_SECRET",
    ok: capabilitySigningSecret.length >= 32,
    detail: capabilitySigningSecret.length >= 32 ? "independent signing key configured" : "missing or shorter than 32 characters"
  },
  {
    name: "TURNSTILE",
    ok: turnstileSiteKey.length > 0 && turnstileSecret.length > 0,
    detail: turnstileSiteKey.length > 0 && turnstileSecret.length > 0
      ? "site key and server secret configured"
      : turnstileSiteKey.length > 0 || turnstileSecret.length > 0
        ? "partial configuration is unsafe; configure both keys"
        : "disabled; configure both free Cloudflare Turnstile keys"
  },
  {
    name: "RESEND_WEBHOOK_SECRET",
    ok: resendWebhookSecret.length >= 16,
    detail: resendWebhookSecret.length >= 16 ? "configured" : "missing or unexpectedly short"
  },
  {
    name: "MALWARE_SCAN_ENDPOINT",
    ok: /^https:\/\//i.test(malwareScanEndpoint),
    detail: /^https:\/\//i.test(malwareScanEndpoint)
      ? `configured${malwareScanToken ? " with bearer token" : " without bearer token"}`
      : "missing or not an HTTPS endpoint; production file uploads fail closed without it"
  },
  {
    name: "TRIGGER_AUTOMATIONS",
    ok: triggerAutomationConfigured,
    detail: triggerAutomationConfigured
      ? "active with Trigger.dev and callback secrets configured"
      : triggerAutomationsActive !== "1"
        ? "inactive; set TRIGGER_AUTOMATIONS_ACTIVE=1 only after Trigger.dev tasks and both secrets are deployed"
        : triggerSecret.length < 20
          ? "active flag is set but TRIGGER_SECRET_KEY is missing or unexpectedly short"
          : "active flag is set but AUTOMATION_CALLBACK_SECRET is missing or shorter than 32 characters"
  }
];

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "MISSING"}  ${check.name}: ${check.detail}`);
}
console.log("MANUAL  Supabase Auth custom SMTP must be verified in Supabase Authentication > Email > SMTP Settings.");

if (strict && checks.some((check) => !check.ok)) process.exitCode = 1;
