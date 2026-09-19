import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const SIMPLE_EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const BLOCKED_EMAIL_RECIPIENTS = new Set(["bryanbatarina@gmail.com"]);

function configuredSender() {
  const value = process.env.EMAIL_FROM?.trim() || "";
  if (!value || !value.includes("@") || value.toLowerCase().includes("example.com")) return null;
  return value;
}

function configuredReplyTo() {
  const candidates = [
    process.env.CLIENT_REPLY_TO_EMAIL,
    process.env.LEAD_NOTIFICATION_EMAIL
  ];
  for (const value of candidates) {
    const email = String(value || "").split(/[;,\n\r]+/).map((item) => item.trim()).find((item) => SIMPLE_EMAIL_RE.test(item) && !BLOCKED_EMAIL_RECIPIENTS.has(item.toLowerCase()));
    if (email) return email;
  }
  return undefined;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]!));
}

async function logMatchEmail(recipient: string, status: "sent" | "failed", providerId?: string | null, errorMessage?: string | null) {
  try {
    await createAdminClient().from("outbound_email_events").insert({
      event_type: "va_match_alert",
      recipient,
      status,
      provider_id: providerId || null,
      error_message: errorMessage ? String(errorMessage).slice(0, 1000) : null
    });
  } catch {
    // Match notifications should not fail because operational logging is unavailable.
  }
}

export async function sendVaMatchEmail(args: {
  to?: string | null;
  fitLabel: string;
  appUrl?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = configuredSender();
  const to = String(args.to || "").trim();
  const blocked = BLOCKED_EMAIL_RECIPIENTS.has(to.toLowerCase());
  if (!apiKey || !from || !SIMPLE_EMAIL_RE.test(to) || blocked) {
    return {
      sent: false as const,
      reason: blocked ? "blocked_recipient" : !SIMPLE_EMAIL_RE.test(to) ? "missing_recipient" : "email_not_configured"
    };
  }

  const appUrl = (args.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const fitLabel = escapeHtml(args.fitLabel);
  const resend = new Resend(apiKey);

  try {
    const profileUrl = `${appUrl}/workspace/va/profile`;
    const result: any = await resend.emails.send({
      from,
      to: [to],
      replyTo: configuredReplyTo(),
      subject: "A client role may be a good fit for your profile",
      text: `Hi there,\n\nOur recruiting team reviewed a client role and your profile looks like a ${args.fitLabel}. This is not yet an interview or job offer. Please keep your availability and profile details current while the client reviews the shortlist.\n\nReview your profile and availability: ${profileUrl}\n\nBest,\nVirtualAssistant.com.ph Talent Team`,
      html: `<!doctype html><html><body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;"><tr><td style="height:5px;background:#4f46e5;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:22px 30px;border-bottom:1px solid #f2f4f7;"><div style="font-size:20px;font-weight:800;color:#101828;">VirtualAssistant<span style="color:#4f46e5;">.com.ph</span></div><div style="margin-top:4px;font-size:12px;color:#667085;">Talent team</div></td></tr><tr><td style="padding:30px;"><p style="margin:0 0 18px;color:#101828;font-size:16px;line-height:1.7;">Hi there,</p><p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Our recruiting team reviewed a client role and your profile looks like a <strong>${fitLabel}</strong>.</p><p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">We have included your profile in the shortlist being considered for client review. This is not yet an interview or job offer, but it means your background is relevant to what the client needs.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">Please keep your availability and profile details current while the client reviews the shortlist.</p><table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 30px;"><tr><td style="border-radius:10px;background:#4f46e5;"><a href="${profileUrl}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;">Review my profile</a></td></tr></table><p style="margin:28px 0 0;color:#344054;font-size:15px;line-height:1.6;">Best,<br><strong>VirtualAssistant.com.ph Talent Team</strong></p></td></tr></table><p style="max-width:620px;margin:14px auto 0;color:#98a2b3;font-size:11px;line-height:1.5;text-align:center;">You are receiving this because your Virtual Assistant profile may match a client opportunity.</p></td></tr></table></body></html>`
    });
    if (result?.error) throw new Error(result.error?.message || "Email provider rejected the message.");
    await logMatchEmail(to, "sent", result?.data?.id || null, null);
    return { sent: true as const };
  } catch (error) {
    await logMatchEmail(to, "failed", null, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
