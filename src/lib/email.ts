import "server-only";
import { Resend } from "resend";

const applicationCcEmail = process.env.APPLICATION_CC_EMAIL || "";

function configuredSender() {
  const value = process.env.EMAIL_FROM?.trim() || "";
  if (!value || !value.includes("@") || value.toLowerCase().includes("example.com")) return null;
  return value;
}

function resendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = configuredSender();
  if (!apiKey || !from) return null;
  return { client: new Resend(apiKey), from };
}

export async function sendApplicationEmail(args: {
  to?: string | null;
  applicantName: string;
  jobTitle: string;
  applicationId: string;
}) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  await config.client.emails.send({
    from: config.from,
    to: [args.to],
    cc: !applicationCcEmail || args.to.toLowerCase() === applicationCcEmail.toLowerCase() ? undefined : [applicationCcEmail],
    subject: `New application: ${args.jobTitle}`,
    html: `<p>${escapeHtml(args.applicantName)} applied for <strong>${escapeHtml(args.jobTitle)}</strong>.</p><p>Open your client workspace to review the application.</p>`
  });
  return { sent: true as const };
}

export async function sendLeadNotificationEmail(args: {
  leadId?: string | null;
  name?: string | null;
  email: string;
  company?: string | null;
  service?: string | null;
  hours?: string | null;
  timezone?: string | null;
  message?: string | null;
  sourcePage?: string | null;
  pageUrl?: string | null;
  jobId?: string | null;
}) {
  const config = resendConfig();
  if (!config) return { sent: false as const, reason: "email_not_configured" };

  // LEAD_NOTIFICATION_EMAIL accepts a comma-separated list so more than one
  // person on the team can get lead notifications -- explicit and
  // configurable here, unlike the hardcoded forced-CC this replaced.
  const recipients = (process.env.LEAD_NOTIFICATION_EMAIL || process.env.APPLICATION_CC_EMAIL || "").split(",").map((e) => e.trim()).filter(Boolean);
  if (!recipients.length) return { sent: false as const, reason: "no_recipient_configured" };
  const subjectLabel = args.service?.trim() || "VA enquiry";
  const rows = [
    ["Name", args.name],
    ["Email", args.email],
    ["Company", args.company],
    ["Service", args.service],
    ["Hours", args.hours],
    ["Timezone", args.timezone],
    ["Source", args.sourcePage],
    ["Page", args.pageUrl],
    ["Lead ID", args.leadId],
    ["Pending job ID", args.jobId]
  ].filter(([, value]) => value);

  await config.client.emails.send({
    from: config.from,
    to: recipients,
    replyTo: args.email,
    subject: `New lead: ${subjectLabel}`,
    html: `<h2>New VirtualAssistant.com.ph lead</h2>${rows.map(([label, value]) => `<p><strong>${escapeHtml(String(label))}:</strong> ${escapeHtml(String(value))}</p>`).join("")}${args.message ? `<hr><p><strong>Request</strong></p><p>${escapeHtml(args.message).replace(/\n/g, "<br>")}</p>` : ""}`
  });
  return { sent: true as const };
}

/**
 * Notifies you when a client directly posts a job for review (as opposed to
 * a public match-request lead, which goes through sendLeadNotificationEmail
 * instead). Without this, a job submitted straight from a client's own
 * workspace produced no notification of any kind.
 */
export async function sendJobSubmittedForReviewEmail(args: { jobId: string; jobTitle: string; clientName?: string | null; appUrl: string }) {
  const config = resendConfig();
  const recipient = process.env.LEAD_NOTIFICATION_EMAIL || process.env.APPLICATION_CC_EMAIL;
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "no_recipient_configured" : "email_not_configured" };
  await config.client.emails.send({
    from: config.from,
    to: [recipient],
    subject: `Job ready for review: ${args.jobTitle}`,
    html: `<h2>A client submitted a job for review</h2><p><strong>Title:</strong> ${escapeHtml(args.jobTitle)}</p>${args.clientName ? `<p><strong>Client:</strong> ${escapeHtml(args.clientName)}</p>` : ""}<p><a href="${args.appUrl}/workspace/admin/jobs/${args.jobId}">Open the job review page</a></p>`
  });
  return { sent: true as const };
}

/**
 * Nudges a VA who signed up but never finished the first vetting step
 * (completing their profile enough to unlock the skills test). Sent
 * manually by an admin, not automatically, so it can't turn into a spam
 * loop -- see sendProfileStageNudgesAction.
 */
export async function sendVettingNudgeEmail(args: { to: string; fullName?: string | null; appUrl: string }) {
  const config = resendConfig();
  if (!config) return { sent: false as const, reason: "email_not_configured" };
  const firstName = args.fullName?.trim().split(" ")[0] || "there";
  await config.client.emails.send({
    from: config.from,
    to: [args.to],
    subject: "Finish your VirtualAssistant.com.ph profile",
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>You started creating a VA profile on VirtualAssistant.com.ph but haven't finished the first step yet -- a complete profile is what unlocks your category skills test, the next stage toward getting approved and matched with clients.</p><p>It only takes a few minutes.</p><p><a href="${args.appUrl}/workspace/va/profile">Finish your profile</a></p><p>If you have questions about the process, just reply to this email.</p>`
  });
  return { sent: true as const };
}

/**
 * Nudges someone who submitted a private match-request lead (via /hire or a
 * service page) but never came back to create a client account -- their
 * draft job just sits with no client_id, invisible to them and unable to
 * receive a released shortlist notification, until they sign up with the
 * same email. Without this email, that only ever happens if they happen to
 * return on their own; most don't.
 */
export async function sendClaimDraftEmail(args: { to: string; name?: string | null; jobTitle: string; leadId: string; appUrl: string }) {
  const config = resendConfig();
  if (!config) return { sent: false as const, reason: "email_not_configured" };
  const firstName = args.name?.trim().split(" ")[0] || "there";
  const joinUrl = `${args.appUrl}/auth/join/client?lead=${encodeURIComponent(args.leadId)}`;
  await config.client.emails.send({
    from: config.from,
    to: [args.to],
    subject: `Your VA request is ready -- ${args.jobTitle}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>You asked about hiring for <strong>${escapeHtml(args.jobTitle)}</strong> on VirtualAssistant.com.ph. We've kept that request as a private draft -- create a free client account with this same email address (${escapeHtml(args.to)}) and it'll be waiting for you, ready to review matched candidates.</p><p><a href="${joinUrl}">Create your client account</a></p><p>If you no longer need this, no action is needed -- just ignore this email.</p>`
  });
  return { sent: true as const };
}

export async function sendSystemTestEmail(to: string) {
  const config = resendConfig();
  if (!config) throw new Error("App email is not configured. Set RESEND_API_KEY and a verified EMAIL_FROM sender first.");
  await config.client.emails.send({
    from: config.from,
    to: [to],
    subject: "VirtualAssistant.com.ph email test",
    html: "<p>Your application email configuration is working.</p>"
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]!));
}

export async function sendApplicationStatusEmail(args: { to?: string | null; jobTitle: string; status: string; appUrl: string }) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  const label = args.status.replaceAll("_", " ");
  await config.client.emails.send({
    from: config.from,
    to: [args.to],
    subject: `Application update: ${args.jobTitle}`,
    html: `<p>Your application for <strong>${escapeHtml(args.jobTitle)}</strong> is now <strong>${escapeHtml(label)}</strong>.</p><p><a href="${args.appUrl}/workspace/va/applications">View your applications</a></p>`
  });
  return { sent: true as const };
}

export async function sendTransactionalEventEmail(args: { to?: string | null; subject: string; heading: string; body: string; href?: string; hrefLabel?: string }) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  const link = args.href ? `<p><a href="${escapeHtml(args.href)}">${escapeHtml(args.hrefLabel || "Open VirtualAssistant.com.ph")}</a></p>` : "";
  await config.client.emails.send({
    from: config.from,
    to: [args.to],
    subject: args.subject,
    html: `<h2>${escapeHtml(args.heading)}</h2><p>${escapeHtml(args.body)}</p>${link}`
  });
  return { sent: true as const };
}
