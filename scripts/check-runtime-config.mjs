import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const strict = process.argv.includes("--strict");
const leadSecret = process.env.LEAD_INGEST_SECRET?.trim() || "";
const resendKey = process.env.RESEND_API_KEY?.trim() || "";
const emailFrom = process.env.EMAIL_FROM?.trim() || "";
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

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
  }
];

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "MISSING"}  ${check.name}: ${check.detail}`);
}
console.log("MANUAL  Supabase Auth custom SMTP must be verified in Supabase Authentication > Email > SMTP Settings.");

if (strict && checks.some((check) => !check.ok)) process.exitCode = 1;
