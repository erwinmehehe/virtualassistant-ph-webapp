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

const brandShell = ({ heading, body, buttonLabel }) => `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:28px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;">
          <tr><td style="height:5px;background:#4f46e5;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:22px 30px;border-bottom:1px solid #f2f4f7;">
            <div style="font-size:20px;font-weight:800;color:#101828;">VirtualAssistant<span style="color:#4f46e5;">.com.ph</span></div>
            <div style="margin-top:4px;font-size:12px;color:#667085;">Account security</div>
          </td></tr>
          <tr><td style="padding:30px;">
            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#101828;">${heading}</h1>
            <p style="margin:0 0 22px;color:#475467;font-size:16px;line-height:1.7;">${body}</p>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#4f46e5;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${buttonLabel}</a>
            </td></tr></table>
            <p style="margin:24px 0 0;color:#667085;font-size:13px;line-height:1.6;">If you did not request this, you can ignore this email.</p>
          </td></tr>
        </table>
        <p style="max-width:620px;margin:14px auto 0;color:#98a2b3;font-size:11px;line-height:1.5;text-align:center;">VirtualAssistant.com.ph</p>
      </td></tr>
    </table>
  </body>
</html>`;

const confirmationTemplate = brandShell({
  heading: "Confirm your email",
  body: "Confirm your email address to activate your VirtualAssistant.com.ph account and open your workspace.",
  buttonLabel: "Confirm my email"
});

const recoveryTemplate = brandShell({
  heading: "Reset your password",
  body: "Use the secure link below to choose a new password for your VirtualAssistant.com.ph account.",
  buttonLabel: "Reset my password"
});

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
    smtp_sender_name: senderName,
    password_min_length: 12,
    mailer_otp_exp: 3600,
    mailer_subjects_confirmation: "Confirm your VirtualAssistant.com.ph account",
    mailer_subjects_recovery: "Reset your VirtualAssistant.com.ph password",
    mailer_templates_confirmation_content: confirmationTemplate,
    mailer_templates_recovery_content: recoveryTemplate
  })
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Supabase SMTP configuration failed (${response.status}).`);
  console.error(body);
  process.exit(1);
}

console.log("Supabase Auth now uses Resend SMTP, branded confirmation/recovery templates, and a 12-character password minimum.");
console.log("Send a signup confirmation and password-reset email to verify delivery before launch.");
