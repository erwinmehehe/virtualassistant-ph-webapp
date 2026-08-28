import { loadLocalEnv } from "./load-env.mjs";

loadLocalEnv();

const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();
const fromEmail = process.env.AUTH_EMAIL_FROM?.trim();
const senderName = process.env.AUTH_EMAIL_SENDER_NAME?.trim() || "VirtualAssistant.com.ph";
const smtpPassword = process.env.AUTH_SMTP_PASSWORD?.trim() || process.env.RESEND_API_KEY?.trim();

const missing = [
  ["SUPABASE_ACCESS_TOKEN", accessToken],
  ["SUPABASE_PROJECT_REF", projectRef],
  ["AUTH_EMAIL_FROM", fromEmail],
  ["AUTH_SMTP_PASSWORD or RESEND_API_KEY", smtpPassword]
].filter(([, value]) => !value).map(([name]) => name);

if (missing.length) {
  console.error(`Missing: ${missing.join(", ")}`);
  console.error("Copy .env.ops.example to a private local env file or export these variables before running the command.");
  process.exit(1);
}

const response = await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    external_email_enabled: true,
    mailer_secure_email_change_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: fromEmail,
    smtp_host: "smtp.resend.com",
    smtp_port: 465,
    smtp_user: "resend",
    smtp_pass: smtpPassword,
    smtp_sender_name: senderName
  })
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Supabase SMTP configuration failed (${response.status}).`);
  console.error(body);
  process.exit(1);
}

console.log("Supabase Auth custom SMTP is now configured to use Resend.");
console.log("Send a signup confirmation and password-reset email to verify delivery before launch.");
