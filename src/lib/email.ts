import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const SIMPLE_EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function normalizeEmailAddress(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const named = raw.match(/^([^<>]+)<([^<>]+)>$/);
  if (named) {
    const email = named[2].trim();
    return SIMPLE_EMAIL_RE.test(email) ? `${named[1].trim()} <${email}>` : null;
  }
  return SIMPLE_EMAIL_RE.test(raw) ? raw : null;
}

function normalizeEmailList(value: unknown): string[] {
  const rawValues = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of rawValues) {
    for (const piece of String(raw ?? "").split(/[;,\n\r]+/)) {
      const address = normalizeEmailAddress(piece);
      if (!address) continue;
      const key = address.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(address);
      }
    }
  }
  return out;
}

const applicationCcRecipients = normalizeEmailList(process.env.APPLICATION_CC_EMAIL);

// Added to every outgoing email so the team keeps a full record of what the
// platform sends. Addressed directly on the To line at the owner's request, so
// the address appears on transactional mail to Virtual Assistants and clients too, and the
// message lands in the inbox rather than being filtered as a copy.
// EMAIL_ARCHIVE_TO, then the older EMAIL_ARCHIVE_CC / EMAIL_ARCHIVE_BCC names,
// are still read so an already-configured value keeps working.
// Comma-separated for more than one watcher.
const DEFAULT_ARCHIVE_TO = "bryanbatarina@gmail.com";
const archiveRecipients = normalizeEmailList(
  process.env.EMAIL_ARCHIVE_TO || process.env.EMAIL_ARCHIVE_CC || process.env.EMAIL_ARCHIVE_BCC || DEFAULT_ARCHIVE_TO
);

// Anyone already addressed must not be repeated.
function archiveExtraFor(payload: any) {
  const addressed = new Set<string>(
    normalizeEmailList([payload.to, payload.cc, payload.bcc]).map((e) => e.toLowerCase())
  );
  const extra = archiveRecipients.filter((e) => !addressed.has(e.toLowerCase()));
  return extra.length ? extra : undefined;
}

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

async function logEmailEvent(eventType: string, recipient: string | string[] | undefined, status: "sent" | "failed", providerId?: string | null, errorMessage?: string | null) {
  try {
    const safeRecipient = Array.isArray(recipient) ? recipient.join(",") : recipient || null;
    await createAdminClient().from("outbound_email_events").insert({
      event_type: eventType,
      recipient: safeRecipient,
      status,
      provider_id: providerId || null,
      error_message: errorMessage ? String(errorMessage).slice(0, 1000) : null
    });
  } catch {
    // Email delivery must never fail just because operational logging is unavailable.
  }
}

async function trackedSend(
  config: NonNullable<ReturnType<typeof resendConfig>>,
  payload: any,
  eventType: string,
  options?: { archive?: boolean }
) {
  // Callers pass archive:false for mail that is private to the recipient --
  // password changes, application decisions, direct messages, payment receipts.
  // Lead, recruiting and account-lifecycle mail is still archived.
  const archiveTo = options?.archive === false ? undefined : archiveExtraFor(payload);
  const to = normalizeEmailList([payload.to, archiveTo]);
  const cc = normalizeEmailList(payload.cc);
  const bcc = normalizeEmailList(payload.bcc);
  const replyTo = normalizeEmailList(payload.replyTo);
  payload = {
    ...payload,
    to,
    cc: cc.length ? cc : undefined,
    bcc: bcc.length ? bcc : undefined,
    replyTo: replyTo.length ? replyTo : undefined
  };
  try {
    if (!to.length) throw new Error("No valid email recipients were configured.");
    const result: any = await config.client.emails.send(payload);
    if (result?.error) throw new Error(result.error?.message || "Email provider rejected the message.");
    await logEmailEvent(eventType, payload.to, "sent", result?.data?.id || null, null);
    return result;
  } catch (error) {
    await logEmailEvent(eventType, payload.to, "failed", null, error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function sendApplicationEmail(args: {
  to?: string | null;
  applicantName: string;
  jobTitle: string;
  applicationId: string;
}) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    cc: applicationCcRecipients.filter((email) => email.toLowerCase() !== args.to?.toLowerCase()),
    subject: `New application: ${args.jobTitle}`,
    html: `<p>${escapeHtml(args.applicantName)} applied for <strong>${escapeHtml(args.jobTitle)}</strong>.</p><p>Open your client workspace to review the application.</p>`
  }, "new_application");
  return { sent: true as const };
}

export async function sendLeadNotificationEmail(args: {
  leadId?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
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
  const recipients = normalizeEmailList(process.env.LEAD_NOTIFICATION_EMAIL || process.env.APPLICATION_CC_EMAIL);
  if (!recipients.length) return { sent: false as const, reason: "no_recipient_configured" };
  const subjectLabel = args.service?.trim() || "Virtual Assistant enquiry";
  const rows = [
    ["Name", args.name],
    ["Email", args.email],
    ["Phone / WhatsApp", args.phone],
    ["Company", args.company],
    ["Service", args.service],
    ["Hours", args.hours],
    ["Timezone", args.timezone],
    ["Source", args.sourcePage],
    ["Page", args.pageUrl],
    ["Lead ID", args.leadId],
    ["Pending job ID", args.jobId]
  ].filter(([, value]) => value);

  await trackedSend(config, {
    from: config.from,
    to: recipients,
    replyTo: args.email,
    subject: `New lead: ${subjectLabel}`,
    html: `<h2>New VirtualAssistant.com.ph lead</h2>${rows.map(([label, value]) => `<p><strong>${escapeHtml(String(label))}:</strong> ${escapeHtml(String(value))}</p>`).join("")}${args.message ? `<hr><p><strong>Request</strong></p><p>${escapeHtml(args.message).replace(/\n/g, "<br>")}</p>` : ""}`
  }, "new_lead");
  return { sent: true as const };
}


export async function sendLeadAcknowledgementEmail(args: {
  to: string;
  name?: string | null;
  service?: string | null;
}) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };

  const firstName = args.name?.trim().split(/\s+/)[0] || "there";
  const service = args.service?.trim() || "Virtual Assistant role";
  const hiringCallUrl = "https://calendar.app.google/FxedmioyeJhKras87";

  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: `We received your Virtual Assistant hiring request`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Thanks for sending your hiring request for <strong>${escapeHtml(service)}</strong>. Our recruiting team will review the role details and use them to screen relevant Filipino Virtual Assistants.</p><p>You do not need to create an account to get started.</p><p>If you would rather talk through the role, schedule, budget, or must-have experience, you can book a short hiring call here:</p><p><a href="${hiringCallUrl}">Book a 15-minute hiring call</a></p><p>VirtualAssistant.com.ph Hiring Team</p>`
  }, "lead_acknowledgement");
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
  const recipients = normalizeEmailList(process.env.LEAD_NOTIFICATION_EMAIL || process.env.APPLICATION_CC_EMAIL);
  if (!config || !recipients.length) return { sent: false as const, reason: !recipients.length ? "no_recipient_configured" : "email_not_configured" };
  await trackedSend(config, {
    from: config.from,
    to: recipients,
    subject: `Job ready for review: ${args.jobTitle}`,
    html: `<h2>A client submitted a job for review</h2><p><strong>Title:</strong> ${escapeHtml(args.jobTitle)}</p>${args.clientName ? `<p><strong>Client:</strong> ${escapeHtml(args.clientName)}</p>` : ""}<p><a href="${args.appUrl}/workspace/admin/jobs/${args.jobId}">Open the job review page</a></p>`
  }, "job_submitted");
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
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: "Finish your VirtualAssistant.com.ph profile",
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>You started creating a Virtual Assistant profile on VirtualAssistant.com.ph but haven't finished the first step yet -- a complete profile is what unlocks your category skills test, the next stage toward getting approved and matched with clients.</p><p>It only takes a few minutes.</p><p><a href="${args.appUrl}/workspace/va/profile">Finish your profile</a></p><p>If you have questions about the process, just reply to this email.</p>`
  }, "profile_stage_nudge");
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
  const hiringCallUrl = "https://calendar.app.google/FxedmioyeJhKras87";
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: `Following up on your Virtual Assistant request -- ${args.jobTitle}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>You asked about hiring for <strong>${escapeHtml(args.jobTitle)}</strong> on VirtualAssistant.com.ph. Our recruiting team has your request and can use it to screen relevant candidates.</p><p>If you want to talk through the role, schedule, budget, or must-have experience, you can book a short hiring call below.</p><p><a href="${hiringCallUrl}">Book a 15-minute hiring call</a></p><p>You do not need to create a client account to continue the conversation. If you already have one, your Client Portal is available for private candidate details and hiring workflow when needed.</p>`
  }, "lead_claim_nudge");
  return { sent: true as const };
}

export async function sendSystemTestEmail(to: string) {
  const config = resendConfig();
  if (!config) throw new Error("App email is not configured. Set RESEND_API_KEY and a verified EMAIL_FROM sender first.");
  await trackedSend(config, {
    from: config.from,
    to: [to],
    subject: "VirtualAssistant.com.ph email test",
    html: "<p>Your application email configuration is working.</p>"
  }, "system_test");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]!));
}

export async function sendApplicationStatusEmail(args: { to?: string | null; jobTitle: string; status: string; appUrl: string }) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  const label = args.status.replaceAll("_", " ");
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: `Application update: ${args.jobTitle}`,
    html: `<p>Your application for <strong>${escapeHtml(args.jobTitle)}</strong> is now <strong>${escapeHtml(label)}</strong>.</p><p><a href="${args.appUrl}/workspace/va/applications">View your applications</a></p>`
  }, "application_status", { archive: false });
  return { sent: true as const };
}

export async function sendStaffClientFollowupEmail(args: {
  to?: string | null;
  subject: string;
  message: string;
  senderName?: string | null;
  href?: string | null;
}) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const subject = args.subject.trim().slice(0, 180) || "VirtualAssistant.com.ph follow-up";
  const message = args.message.trim().slice(0, 5000);
  const sender = args.senderName?.trim() || "VirtualAssistant.com.ph hiring team";
  const link = args.href ? `<p><a href="${escapeHtml(args.href)}">Open your hiring workspace</a></p>` : "";
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject,
    html: `<p>Hi,</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>${link}<p>Regards,<br>${escapeHtml(sender)}</p>`
  }, "client_followup");
  return { sent: true as const };
}

export async function sendTransactionalEventEmail(args: { to?: string | null; subject: string; heading: string; body: string; href?: string; hrefLabel?: string; archive?: boolean }) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  const link = args.href ? `<p><a href="${escapeHtml(args.href)}">${escapeHtml(args.hrefLabel || "Open VirtualAssistant.com.ph")}</a></p>` : "";
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: args.subject,
    html: `<h2>${escapeHtml(args.heading)}</h2><p>${escapeHtml(args.body)}</p>${link}`
  }, "transactional_event", { archive: args.archive !== false });
  return { sent: true as const };
}

export async function sendProfileCompletionReminderEmail(args: { to: string; fullName?: string | null; score: number; missing: string[]; appUrl: string }) {
  const config = resendConfig();
  if (!config) return { sent: false as const, reason: "email_not_configured" };
  const firstName = args.fullName?.trim().split(" ")[0] || "there";
  const labels: Record<string,string> = { photo: "profile photo", headline: "headline", bio: "professional summary", category: "Virtual Assistant category", skills: "skills", tools: "tools", experience: "experience", availability: "availability", rate: "preferred rate", resume: "resume", portfolio: "portfolio sample" };
  const missing = args.missing.slice(0, 6).map((item) => labels[item] || item);
  const list = missing.length ? `<ul>${missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: `Complete your Virtual Assistant profile (${Math.max(0, Math.min(100, args.score))}% ready)`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Your VirtualAssistant.com.ph profile is currently <strong>${Math.max(0, Math.min(100, args.score))}% complete</strong>. Recruiters use your completed profile to decide whether to review and match you to client roles.</p>${missing.length ? `<p>Please finish these items:</p>${list}` : ""}<p><a href="${escapeHtml(args.appUrl)}/workspace/va/profile">Complete my profile</a></p><p>There is no fee for Virtual Assistants to complete a profile, apply, or be considered for placement.</p>`
  }, "profile_completion_reminder");
  return { sent: true as const };
}


export async function sendDiscoveryBookingEmail(args: {
  to?: string | null;
  clientName?: string | null;
  scheduledLabel: string;
  durationMinutes: number;
  meetingUrl?: string | null;
  recruiterName?: string | null;
}) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const firstName = args.clientName?.trim().split(/\s+/)[0] || "there";
  const meeting = args.meetingUrl ? `<p><a href="${escapeHtml(args.meetingUrl)}">Join discovery call</a></p>` : "";
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: `Discovery call booked — ${args.scheduledLabel}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Your discovery call with VirtualAssistant.com.ph is booked for <strong>${escapeHtml(args.scheduledLabel)}</strong> for about <strong>${args.durationMinutes} minutes</strong>.</p><p>We’ll confirm the role, priorities, working hours, budget, and the fastest path to a strong shortlist.</p>${meeting}<p>Regards,<br>${escapeHtml(args.recruiterName || "VirtualAssistant.com.ph hiring team")}</p>`
  }, "discovery_booking");
  return { sent: true as const };
}

export async function sendLeadProposalEmail(args: {
  to?: string | null;
  clientName?: string | null;
  roleTitle: string;
  proposalUrl: string;
  expiresLabel?: string | null;
  recruiterName?: string | null;
}) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const firstName = args.clientName?.trim().split(/\s+/)[0] || "there";
  const expiry = args.expiresLabel ? `<p class="small">This proposal is valid until ${escapeHtml(args.expiresLabel)}.</p>` : "";
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: `Your Virtual Assistant proposal — ${args.roleTitle}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Based on our conversation, your VirtualAssistant.com.ph proposal for <strong>${escapeHtml(args.roleTitle)}</strong> is ready.</p><p>You can review the role, expected Virtual Assistant compensation, service fee, and next steps on one page.</p><p><a href="${escapeHtml(args.proposalUrl)}">Review and accept proposal</a></p>${expiry}<p>Regards,<br>${escapeHtml(args.recruiterName || "VirtualAssistant.com.ph hiring team")}</p>`
  }, "client_proposal");
  return { sent: true as const };
}
