import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const SIMPLE_EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function configuredSender() {
  const value = process.env.EMAIL_FROM?.trim() || "";
  if (!value || !value.includes("@") || value.toLowerCase().includes("example.com")) return null;
  return value;
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
  if (!apiKey || !from || !SIMPLE_EMAIL_RE.test(to)) {
    return { sent: false as const, reason: !SIMPLE_EMAIL_RE.test(to) ? "missing_recipient" : "email_not_configured" };
  }

  const appUrl = (args.appUrl || process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const fitLabel = escapeHtml(args.fitLabel);
  const resend = new Resend(apiKey);

  try {
    const result: any = await resend.emails.send({
      from,
      to: [to],
      subject: "A client role may be a good fit for your profile",
      html: `<p>Hi,</p><p>Our recruiting team reviewed a client role and your profile looks like a <strong>${fitLabel}</strong>.</p><p>We have included your profile in the shortlist being considered for client review. This is not yet an interview or job offer, but it means your background is relevant to what the client needs.</p><p>Please keep your availability and profile details current while the client reviews the shortlist.</p><p><a href="${appUrl}/workspace/va/profile">Review your profile and availability</a></p><p>VirtualAssistant.com.ph Recruiting Team</p>`
    });
    if (result?.error) throw new Error(result.error?.message || "Email provider rejected the message.");
    await logMatchEmail(to, "sent", result?.data?.id || null, null);
    return { sent: true as const };
  } catch (error) {
    await logMatchEmail(to, "failed", null, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
