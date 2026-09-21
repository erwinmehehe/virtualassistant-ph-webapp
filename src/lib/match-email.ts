import "server-only";
import { renderTalentEmail, sendTrackedRawEmail } from "@/lib/email";

const SIMPLE_EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const BLOCKED_EMAIL_RECIPIENTS = new Set(["bryanbatarina@gmail.com"]);

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

export async function sendVaMatchEmail(args: {
  to?: string | null;
  fitLabel: string;
  appUrl?: string | null;
}) {
  const to = String(args.to || "").trim();
  const blocked = BLOCKED_EMAIL_RECIPIENTS.has(to.toLowerCase());
  if (!SIMPLE_EMAIL_RE.test(to) || blocked) {
    return {
      sent: false as const,
      reason: blocked ? "blocked_recipient" : "missing_recipient"
    };
  }

  const appUrl = (args.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const fitLabel = escapeHtml(args.fitLabel);
  const profileUrl = `${appUrl}/workspace/va/profile`;
  const result = await sendTrackedRawEmail({
      to,
      replyTo: configuredReplyTo(),
      subject: "A client role may be a good fit for your profile",
      text: `Hi there,\n\nOur recruiting team reviewed a client role and your profile looks like a ${args.fitLabel}. This is not yet an interview or job offer. Please keep your availability and profile details current while the client reviews the shortlist.\n\nReview your profile and availability: ${profileUrl}\n\nBest,\nVirtualAssistant.com.ph Talent Team`,
      html: renderTalentEmail({
        firstName: "there",
        bodyHtml: `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Our recruiting team reviewed a client role and your profile looks like a <strong>${fitLabel}</strong>.</p><p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">We have included your profile in the shortlist being considered for client review. This is not yet an interview or job offer, but it means your background is relevant to what the client needs.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">Please keep your availability and profile details current while the client reviews the shortlist.</p>`,
        ctaHref: profileUrl,
        ctaLabel: "Review my profile",
        footerText: "You are receiving this because your Virtual Assistant profile may match a client opportunity."
      }),
      eventType: "va_match_alert",
      priority: "standard"
    });
  return result.sent ? { sent: true as const } : result;
}
