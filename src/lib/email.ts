import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarInvite } from "@/lib/booking-operations";

const SIMPLE_EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function isValidEmailAddress(value: string) {
  if (!SIMPLE_EMAIL_RE.test(value)) return false;
  const at = value.lastIndexOf("@");
  if (at <= 0 || at === value.length - 1) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;
  return domain.split(".").every((label) => (
    Boolean(label)
    && /^[A-Za-z0-9-]+$/.test(label)
    && !label.startsWith("-")
    && !label.endsWith("-")
  ));
}

function normalizeEmailAddress(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const named = raw.match(/^([^<>]+)<([^<>]+)>$/);
  if (named) {
    const email = named[2].trim();
    return isValidEmailAddress(email) ? `${named[1].trim()} <${email}>` : null;
  }
  return isValidEmailAddress(raw) ? raw : null;
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

const BLOCKED_EMAIL_RECIPIENTS = normalizeEmailList([
  "bryanbatarina@gmail.com",
]);
const blockedEmailSet = new Set(BLOCKED_EMAIL_RECIPIENTS.map((email) => email.toLowerCase()));
const isBlockedEmailRecipient = (email: string) => blockedEmailSet.has(email.toLowerCase());

const PRIVATE_INTERNAL_EMAILS = normalizeEmailList([
  "erwinvalles20@gmail.com",
  "jrvsaccad@gmail.com",
]);
const privateInternalEmailSet = new Set(PRIVATE_INTERNAL_EMAILS.map((email) => email.toLowerCase()));
const isPrivateInternalEmail = (email: string) => privateInternalEmailSet.has(email.toLowerCase());

const DEFAULT_TEAM_BCC = "jrvsaccad@gmail.com";
const teamBccRecipients = normalizeEmailList([DEFAULT_TEAM_BCC, process.env.TEAM_CC_EMAIL, process.env.TEAM_BCC_EMAIL]);
const applicationBccRecipients = normalizeEmailList([process.env.APPLICATION_CC_EMAIL, process.env.APPLICATION_BCC_EMAIL]);
const JERVIS_BOOKING_EMAIL = "jrvsaccad@gmail.com";
const discoveryBookingBccRecipients = normalizeEmailList([
  JERVIS_BOOKING_EMAIL,
  "erwinvalles20@gmail.com",
  process.env.DISCOVERY_BOOKING_CC_EMAIL,
  process.env.DISCOVERY_BOOKING_BCC_EMAIL,
]).filter((email) => !isBlockedEmailRecipient(email));
const staffClientFollowupBccRecipients = normalizeEmailList([
  "jrvsaccad@gmail.com",
  "erwinvalles20@gmail.com",
  process.env.CLIENT_FOLLOWUP_CC_EMAIL,
  process.env.CLIENT_FOLLOWUP_BCC_EMAIL,
]).filter((email) => !isBlockedEmailRecipient(email));

// Added to outgoing mail as a hidden archive copy so internal recipients never
// appear to clients or Virtual Assistants. Existing env var names remain
// supported for backwards compatibility, but archive delivery is always BCC.
const DEFAULT_ARCHIVE_TO = "erwinvalles20@gmail.com";
const configuredArchiveRecipients = normalizeEmailList(
  process.env.EMAIL_ARCHIVE_TO || process.env.EMAIL_ARCHIVE_CC || process.env.EMAIL_ARCHIVE_BCC || DEFAULT_ARCHIVE_TO
).filter((email) => !isBlockedEmailRecipient(email));
const archiveRecipients = configuredArchiveRecipients.length ? configuredArchiveRecipients : [DEFAULT_ARCHIVE_TO];

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

function configuredReplyTo() {
  return normalizeEmailList([
    process.env.CLIENT_REPLY_TO_EMAIL,
    process.env.LEAD_NOTIFICATION_EMAIL
  ])[0] || undefined;
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
  options?: { archive?: boolean; teamCc?: boolean }
) {
  // Internal archive/team copies are always hidden from external recipients.
  // Security-sensitive messages can still opt out with archive:false/teamCc:false.
  const archiveBcc = options?.archive === false ? undefined : archiveExtraFor(payload);
  const rawTo = normalizeEmailList(payload.to).filter((email) => !isBlockedEmailRecipient(email));
  const hasExternalRecipient = rawTo.some((email) => !isPrivateInternalEmail(email));

  // Privacy rule: when any external recipient is present, Erwin and Jervis
  // must never appear in visible To, CC, or Reply-To headers. Bryan is a VA,
  // so his address is suppressed from every outbound message entirely.
  const hiddenInternalFromTo = hasExternalRecipient ? rawTo.filter(isPrivateInternalEmail) : [];
  const to = hasExternalRecipient ? rawTo.filter((email) => !isPrivateInternalEmail(email)) : rawTo;

  const rawCc = normalizeEmailList(payload.cc).filter((email) => !isBlockedEmailRecipient(email));
  const hiddenInternalFromCc = hasExternalRecipient ? rawCc.filter(isPrivateInternalEmail) : [];
  const requestedCc = hasExternalRecipient ? rawCc.filter((email) => !isPrivateInternalEmail(email)) : rawCc;

  const requestedBcc = normalizeEmailList([
    payload.bcc,
    hiddenInternalFromTo,
    hiddenInternalFromCc,
    archiveBcc,
    options?.teamCc === false ? [] : teamBccRecipients
  ]).filter((email) => !isBlockedEmailRecipient(email));
  const toSet = new Set(to.map((email) => email.toLowerCase()));
  const cc = requestedCc.filter((email) => !toSet.has(email.toLowerCase()));
  const ccSet = new Set(cc.map((email) => email.toLowerCase()));
  const bcc = requestedBcc.filter((email) => !toSet.has(email.toLowerCase()) && !ccSet.has(email.toLowerCase()));

  const rawReplyTo = normalizeEmailList(payload.replyTo).filter((email) => !isBlockedEmailRecipient(email));
  const replyTo = hasExternalRecipient
    ? rawReplyTo.filter((email) => !isPrivateInternalEmail(email))
    : rawReplyTo;

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
    bcc: applicationBccRecipients.filter((email) => email.toLowerCase() !== args.to?.toLowerCase()),
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
  const recipients = normalizeEmailList(process.env.LEAD_NOTIFICATION_EMAIL || process.env.APPLICATION_CC_EMAIL)
    .filter((email) => !isBlockedEmailRecipient(email));
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
  const hiringCallUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "")}/book-client-call`;
  const bodyHtml = [
    `Thanks for reaching out about hiring a <strong>${escapeHtml(service)}</strong>. We have your request and our recruiting team is reviewing it now.`,
    "We will use the details you sent to narrow the role before we recommend anyone. You do not need to create an account to keep things moving.",
    "If you would rather talk it through, choose a time that works for you and we can cover the role, schedule, budget, and must-have experience together."
  ].map((paragraph) => `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">${paragraph}</p>`).join("");

  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    replyTo: configuredReplyTo(),
    subject: `Got your ${service} request`,
    text: `Hi ${firstName},\n\nThanks for reaching out about hiring a ${service}. We have your request and our recruiting team is reviewing it now.\n\nYou do not need to create an account to keep things moving. If you would rather talk it through, choose a time that works for you: ${hiringCallUrl}\n\nBest,\nVirtualAssistant.com.ph Hiring Team`,
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName: "VirtualAssistant.com.ph Hiring Team",
      ctaHref: hiringCallUrl,
      ctaLabel: "Choose a call time"
    })
  }, "lead_acknowledgement");
  return { sent: true as const };
}

/**
 * Sent when a hiring-form submission reads like a Virtual Assistant applying for
 * work. Neutral and helpful: points them to the VA sign-up without implying they
 * made a mistake. Not archived (it is not client correspondence).
 */
export async function sendVaApplicantRedirectEmail(args: { to: string; name?: string | null }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };

  const firstName = args.name?.trim().split(/\s+/)[0] || "there";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const joinUrl = `${base}/auth/join/va`;
  const jobsUrl = `${base}/jobs`;
  const bodyHtml = [
    "Thanks for your interest in working with VirtualAssistant.com.ph.",
    "The form you sent is used by businesses to request a Virtual Assistant, so we have not added your message to our client hiring requests.",
    `To be considered for client roles, create your free Virtual Assistant profile and complete the screening steps. You can also <a href="${escapeHtml(jobsUrl)}" style="color:#4f46e5;">browse open roles</a>. There is no fee to join or apply.`
  ].map((paragraph) => `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">${paragraph}</p>`).join("");

  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: "Applying to work as a Virtual Assistant",
    text: `Hi ${firstName},\n\nThanks for your interest in working with VirtualAssistant.com.ph.\n\nThe form you sent is used by businesses to request a Virtual Assistant, so we have not added your message to our client hiring requests.\n\nTo be considered for client roles, create your free Virtual Assistant profile and complete the screening steps: ${joinUrl}\nBrowse open roles: ${jobsUrl}\n\nThere is no fee to join or apply.\n\nBest,\nVirtualAssistant.com.ph Talent Team`,
    html: renderTalentEmail({
      firstName,
      bodyHtml,
      senderName: "VirtualAssistant.com.ph Talent Team",
      ctaHref: joinUrl,
      ctaLabel: "Create my VA profile"
    })
  }, "va_applicant_redirect", { archive: false, teamCc: false });
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
  const recipients = normalizeEmailList(process.env.LEAD_NOTIFICATION_EMAIL || process.env.APPLICATION_CC_EMAIL)
    .filter((email) => !isBlockedEmailRecipient(email));
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
  const profileUrl = `${args.appUrl}/workspace/va/profile`;
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">You started creating a Virtual Assistant profile but haven’t finished the first step yet. A complete profile unlocks your category skills test, the next stage toward getting approved and matched with clients.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">It only takes a few minutes. If you have questions about the process, reply to this email.</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: "Finish your VirtualAssistant.com.ph profile",
    text: `Hi ${firstName},\n\nFinish your Virtual Assistant profile to unlock your category skills test: ${profileUrl}\n\nThere is no fee to complete your profile or apply.`,
    html: renderTalentEmail({
      firstName,
      bodyHtml,
      ctaHref: profileUrl,
      ctaLabel: "Finish my profile"
    })
  }, "profile_stage_nudge", { archive: false, teamCc: false });
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
  const hiringCallUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "")}/book-client-call`;
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">You asked about hiring for <strong>${escapeHtml(args.jobTitle)}</strong>. Our recruiting team has your request and can use it to screen relevant candidates.</p><p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">If you want to talk through the role, schedule, budget, or must-have experience, choose a discovery-call time below.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">You do not need to create a client account to continue the conversation. If you already have one, your Client Portal remains available for private candidate details and hiring workflow.</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    replyTo: configuredReplyTo(),
    subject: `Following up on your Virtual Assistant request — ${args.jobTitle}`,
    text: `Hi ${firstName},\n\nYou asked about hiring for ${args.jobTitle}. Our recruiting team has your request and can use it to screen relevant candidates.\n\nChoose a discovery-call time: ${hiringCallUrl}\n\nBest,\nVirtualAssistant.com.ph Hiring Team`,
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName: "VirtualAssistant.com.ph Hiring Team",
      ctaHref: hiringCallUrl,
      ctaLabel: "Choose a call time"
    })
  }, "lead_claim_nudge");
  return { sent: true as const };
}

function renderAuthActionEmail(args: {
  heading: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;"><tr><td style="height:5px;background:#4f46e5;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:22px 30px;border-bottom:1px solid #f2f4f7;"><div style="font-size:20px;font-weight:800;color:#101828;">VirtualAssistant<span style="color:#4f46e5;">.com.ph</span></div><div style="margin-top:4px;font-size:12px;color:#667085;">Account security</div></td></tr><tr><td style="padding:30px;"><h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#101828;">${escapeHtml(args.heading)}</h1><p style="margin:0 0 22px;color:#475467;font-size:16px;line-height:1.7;">${escapeHtml(args.body)}</p><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#4f46e5;"><a href="${escapeHtml(args.ctaHref)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">${escapeHtml(args.ctaLabel)}</a></td></tr></table><p style="margin:24px 0 0;color:#667085;font-size:13px;line-height:1.6;">This is a one-time security link. If you did not request this, you can ignore this email.</p></td></tr></table><p style="max-width:620px;margin:14px auto 0;color:#98a2b3;font-size:11px;line-height:1.5;text-align:center;">VirtualAssistant.com.ph</p></td></tr></table></body></html>`;
}

export async function sendAccountConfirmationEmail(args: { to: string; actionUrl: string }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: "Confirm your VirtualAssistant.com.ph account",
    text: `Confirm your VirtualAssistant.com.ph account: ${args.actionUrl}\n\nIf you did not create this account, you can ignore this email.`,
    html: renderAuthActionEmail({
      heading: "Confirm your email",
      body: "Confirm your email address to activate your VirtualAssistant.com.ph account and open your workspace.",
      ctaHref: args.actionUrl,
      ctaLabel: "Confirm my email"
    })
  }, "account_confirmation", { archive: false, teamCc: false });
  return { sent: true as const };
}

export async function sendPasswordRecoveryEmail(args: { to: string; actionUrl: string }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: "Reset your VirtualAssistant.com.ph password",
    text: `Reset your VirtualAssistant.com.ph password: ${args.actionUrl}\n\nIf you did not request a password reset, you can ignore this email.`,
    html: renderAuthActionEmail({
      heading: "Reset your password",
      body: "Use the secure link below to choose a new password for your VirtualAssistant.com.ph account.",
      ctaHref: args.actionUrl,
      ctaLabel: "Reset my password"
    })
  }, "password_recovery", { archive: false, teamCc: false });
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

function renderMessageParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderBrandedEmail(args: {
  firstName: string;
  bodyHtml: string;
  senderName: string;
  teamLabel: string;
  footerText: string;
  ctaHref?: string | null;
  ctaLabel?: string;
  appendSignature?: boolean;
}) {
  const cta = args.ctaHref
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 30px;"><tr><td style="border-radius:10px;background:#4f46e5;"><a href="${escapeHtml(args.ctaHref)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;">${escapeHtml(args.ctaLabel || "Continue")}</a></td></tr></table>`
    : "";
  const signature = args.appendSignature === false
    ? ""
    : `<p style="margin:28px 0 0;color:#344054;font-size:15px;line-height:1.6;">Best,<br><strong>${escapeHtml(args.senderName)}</strong></p>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;"><tr><td style="height:5px;background:#4f46e5;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:22px 30px;border-bottom:1px solid #f2f4f7;"><div style="font-size:20px;font-weight:800;letter-spacing:-0.4px;color:#101828;">VirtualAssistant<span style="color:#4f46e5;">.com.ph</span></div><div style="margin-top:4px;font-size:12px;color:#667085;">${escapeHtml(args.teamLabel)}</div></td></tr><tr><td style="padding:30px;"><p style="margin:0 0 18px;color:#101828;font-size:16px;line-height:1.7;">Hi ${escapeHtml(args.firstName)},</p>${args.bodyHtml}${cta}${signature}</td></tr></table><p style="max-width:620px;margin:14px auto 0;color:#98a2b3;font-size:11px;line-height:1.5;text-align:center;">${escapeHtml(args.footerText)}</p></td></tr></table></body></html>`;
}

function renderHiringEmail(args: {
  firstName: string;
  bodyHtml: string;
  senderName: string;
  ctaHref?: string | null;
  ctaLabel?: string;
  appendSignature?: boolean;
}) {
  return renderBrandedEmail({
    ...args,
    teamLabel: "Hiring team",
    footerText: "You are receiving this because you contacted VirtualAssistant.com.ph about hiring support."
  });
}

function renderTalentEmail(args: {
  firstName: string;
  bodyHtml: string;
  senderName?: string;
  ctaHref?: string | null;
  ctaLabel?: string;
}) {
  return renderBrandedEmail({
    ...args,
    senderName: args.senderName || "VirtualAssistant.com.ph Talent Team",
    teamLabel: "Talent team",
    footerText: "You are receiving this because you have a Virtual Assistant account, application, or profile with VirtualAssistant.com.ph."
  });
}

function normalizeClientFollowup(subjectValue: string, messageValue: string, options?: { preserveSignoff?: boolean }) {
  let message = messageValue.trim().slice(0, 5000);
  let firstName = "there";
  const greeting = message.match(/^(?:hi|hello|hey)\s+([^,\n]+),?\s*(?:\r?\n)+/i);
  if (greeting) {
    firstName = greeting[1].trim().split(/\s+/)[0] || "there";
    message = message.slice(greeting[0].length).trim();
  }

  message = message
    .replace(/^Thanks for reaching out to VirtualAssistant\.com\.ph\.\s*/i, "Thanks for reaching out. ")
    .replace(/and would like to confirm a few details so we can recommend the right vetted VA\. Are you available for a short discovery call\?/i, "and I’m ready to narrow down the right candidates. Before I do that, I’d like to confirm a couple of details about the day-to-day work, schedule, and must-have experience. If a quick call is easiest, choose a time that works for you and we’ll go through it together.")
    .replace(/Following up on your VirtualAssistant\.com\.ph request\. I wanted to keep things moving and confirm the best next step for your VA search\./i, "Just following up on your VA request. I’m ready to keep this moving whenever you are. If anything has changed, reply here and I’ll adjust the search with you.");

  // Automated templates append their own signature. Manual recruiter follow-ups preserve
  // the sender's typed closing instead, so the renderer does not add a second signature.
  if (!options?.preserveSignoff) {
    message = message.replace(/\n{2,}(?:Best|Best regards|Regards|Thanks|Thank you|Cheers|Sincerely|Warm regards|Kind regards)[,]?\s*\n[^\n]*\s*$/i, "").trim();
  }

  const rawSubject = subjectValue.trim().slice(0, 180) || "VirtualAssistant.com.ph follow-up";
  const legacyMatch = rawSubject.match(/^Your VirtualAssistant\.com\.ph enquiry\s*-\s*(.+)$/i);
  const subject = legacyMatch ? `About your ${legacyMatch[1].trim()} request` : rawSubject;
  return { firstName, message, subject };
}

export async function sendApplicationStatusEmail(args: { to?: string | null; jobTitle: string; status: string; appUrl: string }) {
  const config = resendConfig();
  if (!config || !args.to) return { sent: false as const, reason: !args.to ? "missing_recipient" : "email_not_configured" };
  const label = args.status.replaceAll("_", " ");
  const applicationsUrl = `${args.appUrl}/workspace/va/applications`;
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Your application for <strong>${escapeHtml(args.jobTitle)}</strong> is now <strong>${escapeHtml(label)}</strong>.</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: `Application update: ${args.jobTitle}`,
    text: `Your application for ${args.jobTitle} is now ${label}.\n\nView your applications: ${applicationsUrl}`,
    html: renderTalentEmail({
      firstName: "there",
      bodyHtml,
      ctaHref: applicationsUrl,
      ctaLabel: "View my applications"
    })
  }, "application_status", { archive: false, teamCc: false });
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
  const sender = args.senderName?.trim() || "VirtualAssistant.com.ph Hiring Team";
  const normalized = normalizeClientFollowup(args.subject, args.message, { preserveSignoff: true });
  const bodyHtml = renderMessageParagraphs(normalized.message);
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    bcc: staffClientFollowupBccRecipients.filter((email) => email.toLowerCase() !== recipient.toLowerCase()),
    replyTo: configuredReplyTo(),
    subject: normalized.subject,
    text: `Hi ${normalized.firstName},\n\n${normalized.message}`,
    html: renderHiringEmail({
      firstName: normalized.firstName,
      bodyHtml,
      senderName: sender,
      appendSignature: false
    })
  }, "client_followup");
  return { sent: true as const };
}

export async function sendTransactionalEventEmail(args: { to?: string | null; subject: string; heading: string; body: string; href?: string; hrefLabel?: string; archive?: boolean; teamCc?: boolean }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const isPasswordChangeNotice = args.subject.trim().toLowerCase() === "your password was changed" || args.heading.trim().toLowerCase() === "password updated";
  const bodyHtml = `<p style="margin:0;color:#344054;font-size:16px;line-height:1.7;">${escapeHtml(args.body)}</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    replyTo: isPasswordChangeNotice ? undefined : configuredReplyTo(),
    subject: args.subject,
    text: `${args.heading}\n\n${args.body}${args.href ? `\n\n${args.hrefLabel || "Open VirtualAssistant.com.ph"}: ${args.href}` : ""}`,
    html: renderBrandedEmail({
      firstName: "there",
      bodyHtml: `<h2 style="margin:0 0 14px;color:#101828;font-size:22px;line-height:1.3;">${escapeHtml(args.heading)}</h2>${bodyHtml}`,
      senderName: "VirtualAssistant.com.ph Team",
      teamLabel: "Account update",
      footerText: "You are receiving this because of activity on your VirtualAssistant.com.ph account or workspace.",
      ctaHref: args.href,
      ctaLabel: args.hrefLabel || "Open VirtualAssistant.com.ph"
    })
  }, "transactional_event", { archive: args.archive !== false, teamCc: args.teamCc !== false && !isPasswordChangeNotice });
  return { sent: true as const };
}

export async function sendProfileCompletionReminderEmail(args: { to: string; fullName?: string | null; score: number; missing: string[]; appUrl: string }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const firstName = args.fullName?.trim().split(" ")[0] || "there";
  const labels: Record<string,string> = { photo: "profile photo", headline: "headline", bio: "professional summary", category: "Virtual Assistant category", skills: "skills", tools: "tools", experience: "experience", availability: "availability", rate: "preferred rate", resume: "resume", portfolio: "portfolio sample" };
  const missing = args.missing.slice(0, 6).map((item) => labels[item] || item);
  const list = missing.length ? `<ul>${missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
  const profileUrl = `${args.appUrl}/workspace/va/profile`;
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Your VirtualAssistant.com.ph profile is currently <strong>${Math.max(0, Math.min(100, args.score))}% complete</strong>. Recruiters use your completed profile to decide whether to review and match you to client roles.</p>${missing.length ? `<p style="margin:0 0 10px;color:#344054;font-size:16px;line-height:1.7;">Please finish these items:</p>${list}` : ""}<p style="margin:18px 0 0;color:#475467;font-size:15px;line-height:1.7;">There is no fee for Virtual Assistants to complete a profile, apply, or be considered for placement.</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: `Complete your Virtual Assistant profile (${Math.max(0, Math.min(100, args.score))}% ready)`,
    text: `Hi ${firstName},\n\nYour VirtualAssistant.com.ph profile is ${Math.max(0, Math.min(100, args.score))}% complete.\n\nComplete your profile: ${profileUrl}\n\nThere is no fee to complete a profile, apply, or be considered for placement.`,
    html: renderTalentEmail({
      firstName,
      bodyHtml,
      ctaHref: profileUrl,
      ctaLabel: "Complete my profile"
    })
  }, "profile_completion_reminder", { archive: false, teamCc: false });
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
  const senderName = args.recruiterName || "VirtualAssistant.com.ph Hiring Team";
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Your discovery call is booked for <strong>${escapeHtml(args.scheduledLabel)}</strong> for about <strong>${args.durationMinutes} minutes</strong>.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">We’ll confirm the role, priorities, working hours, budget, and the fastest path to a strong shortlist.</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    replyTo: configuredReplyTo(),
    subject: `Discovery call booked — ${args.scheduledLabel}`,
    text: `Hi ${firstName},\n\nYour discovery call is booked for ${args.scheduledLabel} for about ${args.durationMinutes} minutes.${args.meetingUrl ? `\n\nJoin Google Meet: ${args.meetingUrl}` : ""}\n\nBest,\n${senderName}`,
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName,
      ctaHref: args.meetingUrl || undefined,
      ctaLabel: args.meetingUrl ? "Join Google Meet" : undefined
    })
  }, "discovery_booking");
  return { sent: true as const };
}

export async function sendPublicDiscoveryBookingEmail(args: {
  leadId: string;
  to: string;
  clientName: string;
  company: string;
  companyUrl?: string | null;
  phone?: string | null;
  service: string;
  hours: string;
  budget: string;
  startTime: string;
  message: string;
  scheduledAt: string;
  clientLabel: string;
  manilaLabel: string;
  clientTimeZone: string;
  meetingUrl?: string | null;
  calendarEventId?: string | null;
  manageUrl: string;
}) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };

  const startsAt = new Date(args.scheduledAt);
  const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000);
  const calendarStamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const calendarParams = new URLSearchParams({
    action: "TEMPLATE",
    text: `VirtualAssistant.com.ph discovery call with ${args.company}`,
    dates: `${calendarStamp(startsAt)}/${calendarStamp(endsAt)}`,
    details: `Client discovery call for ${args.service}.${args.meetingUrl ? ` Join: ${args.meetingUrl}` : ""}`,
  });
  const calendarUrl = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;
  const firstName = args.clientName.trim().split(/\s+/)[0] || "there";
  const googleCalendarCreated = Boolean(args.calendarEventId);
  const invite = googleCalendarCreated ? null : createCalendarInvite({
    uid: args.leadId,
    startsAt: args.scheduledAt,
    durationMinutes: 30,
    company: args.company,
    service: args.service,
    meetingUrl: args.meetingUrl
  });
  const replyTo = configuredReplyTo();

  const meetingBlock = args.meetingUrl
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr><td style="padding:18px 20px;background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#4f46e5;margin-bottom:8px;">Google Meet</div>
          <div style="font-size:15px;line-height:1.6;color:#344054;margin-bottom:14px;">Your meeting link is ready.</div>
          <a href="${escapeHtml(args.meetingUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;">Join Google Meet</a>
        </td></tr>
      </table>`
    : `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr><td style="padding:16px 18px;background:#fffaeb;border:1px solid #fedf89;border-radius:14px;">
          <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#b54708;margin-bottom:7px;">Google Meet link pending</div>
          <div style="font-size:15px;line-height:1.65;color:#7a2e0e;">Your call is confirmed. We will email your Google Meet link separately before the meeting. You do not need to book again.</div>
        </td></tr>
      </table>`;

  const bodyHtml = `
    <p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Your 30-minute discovery call with the VirtualAssistant.com.ph hiring team is confirmed.</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border:1px solid #eaecf0;border-radius:14px;overflow:hidden;">
      <tr><td style="padding:18px 20px;background:#f9fafb;border-bottom:1px solid #eaecf0;">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#667085;margin-bottom:7px;">Your call time</div>
        <div style="font-size:18px;font-weight:800;line-height:1.45;color:#101828;">${escapeHtml(args.clientLabel)}</div>
        <div style="font-size:14px;line-height:1.6;color:#667085;margin-top:5px;">30 minutes · ${escapeHtml(args.clientTimeZone)}</div>
      </td></tr>
      <tr><td style="padding:16px 20px;">
        <div style="font-size:13px;color:#667085;margin-bottom:4px;">Our Philippines team</div>
        <div style="font-size:15px;font-weight:700;color:#344054;">${escapeHtml(args.manilaLabel)}</div>
      </td></tr>
    </table>

    ${meetingBlock}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;"><tr>
      ${googleCalendarCreated
        ? `<td style="padding-right:10px;"><span style="display:inline-block;padding:11px 16px;border-radius:10px;background:#ecfdf3;color:#027a48;font-size:14px;font-weight:700;">Calendar invitation sent</span></td>`
        : `<td style="padding-right:10px;"><a href="${escapeHtml(calendarUrl)}" style="display:inline-block;padding:11px 16px;border-radius:10px;background:#101828;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Add to Google Calendar</a></td>`}
      <td>
        <a href="${escapeHtml(args.manageUrl)}" style="display:inline-block;padding:10px 15px;border-radius:10px;border:1px solid #d0d5dd;color:#344054;text-decoration:none;font-size:14px;font-weight:700;">Reschedule or cancel</a>
      </td>
    </tr></table>

    <div style="margin:0 0 24px;padding:18px 20px;background:#f9fafb;border-radius:14px;">
      <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#667085;margin-bottom:12px;">What we have on your brief</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:1.6;">
        <tr><td style="padding:4px 12px 4px 0;color:#667085;width:120px;">Company</td><td style="padding:4px 0;color:#101828;font-weight:600;">${escapeHtml(args.company)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#667085;">Role</td><td style="padding:4px 0;color:#101828;font-weight:600;">${escapeHtml(args.service)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#667085;">Hours</td><td style="padding:4px 0;color:#101828;font-weight:600;">${escapeHtml(args.hours)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#667085;">VA budget</td><td style="padding:4px 0;color:#101828;font-weight:600;">${escapeHtml(args.budget)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#667085;">Preferred start</td><td style="padding:4px 0;color:#101828;font-weight:600;">${escapeHtml(args.startTime)}</td></tr>
      </table>
    </div>

    <p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">We already have your hiring brief, so there is nothing else you need to submit before the call. If anything changes, use the reschedule link above or reply to this email.</p>
  `;

  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    bcc: discoveryBookingBccRecipients.filter((email) => email.toLowerCase() !== recipient.toLowerCase()),
    replyTo: replyTo ? [replyTo] : undefined,
    attachments: invite ? [{ filename: "virtualassistant-discovery-call.ics", content: Buffer.from(invite).toString("base64") }] : undefined,
    subject: `Discovery call confirmed — ${args.clientLabel}`,
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName: "VirtualAssistant.com.ph Hiring Team"
    }),
  }, "public_discovery_booking");
  return { sent: true as const };
}

export async function sendInternalDiscoveryBookingNotificationEmail(args: {
  clientName: string;
  clientEmail: string;
  company: string;
  clientLabel: string;
  manilaLabel: string;
  meetingUrl?: string | null;
  manageUrl: string;
}) {
  const config = resendConfig();
  if (!config) return { sent: false as const, reason: "email_not_configured" };

  const meetingLine = args.meetingUrl ? `Google Meet: ${args.meetingUrl}` : "Google Meet: pending";
  await trackedSend(config, {
    from: config.from,
    to: [JERVIS_BOOKING_EMAIL],
    replyTo: args.clientEmail,
    subject: `New discovery call booked: ${args.company}`,
    text: [
      "A new client discovery call was booked.",
      "",
      `Client: ${args.clientName}`,
      `Email: ${args.clientEmail}`,
      `Company: ${args.company}`,
      `Client time: ${args.clientLabel}`,
      `Philippines time: ${args.manilaLabel}`,
      meetingLine,
      `Manage booking: ${args.manageUrl}`,
    ].join("\n"),
    html: `<h2>New discovery call booked</h2>
      <p><strong>Client:</strong> ${escapeHtml(args.clientName)} (${escapeHtml(args.clientEmail)})</p>
      <p><strong>Company:</strong> ${escapeHtml(args.company)}</p>
      <p><strong>Client time:</strong> ${escapeHtml(args.clientLabel)}</p>
      <p><strong>Philippines time:</strong> ${escapeHtml(args.manilaLabel)}</p>
      <p><strong>Google Meet:</strong> ${args.meetingUrl ? `<a href="${escapeHtml(args.meetingUrl)}">${escapeHtml(args.meetingUrl)}</a>` : "Pending"}</p>
      <p><a href="${escapeHtml(args.manageUrl)}">Manage this booking</a></p>`
  }, "discovery_booking_internal_jervis", { archive: false, teamCc: false });
  return { sent: true as const };
}

export async function sendDiscoveryMeetingSetupFailureEmail(args: {
  clientName?: string | null;
  clientEmail: string;
  company?: string | null;
  scheduledLabel: string;
  error: string;
}) {
  const config = resendConfig();
  if (!config) return { sent: false as const, reason: "email_not_configured" };
  const primary = "erwinvalles20@gmail.com";
  const hidden = ["jrvsaccad@gmail.com"];
  await trackedSend(config, {
    from: config.from,
    to: [primary],
    bcc: hidden,
    subject: `Action required: discovery call has no Google Meet link — ${args.company || args.clientName || args.clientEmail}`,
    html: `<h2>Automatic Google Meet setup failed</h2><p><strong>Client:</strong> ${escapeHtml(args.clientName || "Unknown")} (${escapeHtml(args.clientEmail)})</p><p><strong>Company:</strong> ${escapeHtml(args.company || "Not provided")}</p><p><strong>Scheduled:</strong> ${escapeHtml(args.scheduledLabel)}</p><p><strong>Error:</strong> ${escapeHtml(args.error)}</p><p>Open Recruiter CRM and use <strong>Create Google Meet</strong> after the Google Meet integration is available.</p>`
  }, "discovery_google_meet_setup_failed", { archive: false, teamCc: false });
  return { sent: true as const };
}

export async function sendDiscoveryReminderEmail(args: { to: string; clientName?: string | null; scheduledLabel: string; meetingUrl?: string | null; manageUrl: string; window: "24h" | "1h" }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const firstName = args.clientName?.trim().split(/\s+/)[0] || "there";
  const timing = args.window === "24h" ? "tomorrow" : "in about one hour";
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Your client discovery call is ${timing}, at <strong>${escapeHtml(args.scheduledLabel)}</strong>.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;"><a href="${escapeHtml(args.manageUrl)}" style="color:#4f46e5;">Reschedule or cancel</a> if your availability changed.</p>`;
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    bcc: discoveryBookingBccRecipients.filter((email) => email.toLowerCase() !== recipient.toLowerCase()),
    replyTo: configuredReplyTo(),
    subject: `Reminder: your discovery call is ${timing}`,
    text: `Hi ${firstName},\n\nYour VirtualAssistant.com.ph discovery call is ${timing}, at ${args.scheduledLabel}.${args.meetingUrl ? `\n\nJoin Google Meet: ${args.meetingUrl}` : ""}\n\nReschedule or cancel: ${args.manageUrl}`,
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName: "VirtualAssistant.com.ph Hiring Team",
      ctaHref: args.meetingUrl || args.manageUrl,
      ctaLabel: args.meetingUrl ? "Join Google Meet" : "Manage booking"
    }),
  }, `discovery_reminder_${args.window}`);
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
  const senderName = args.recruiterName || "VirtualAssistant.com.ph Hiring Team";
  const expiryText = args.expiresLabel ? ` This proposal is valid until ${args.expiresLabel}.` : "";
  const expiry = args.expiresLabel ? `<p style="margin:18px 0 0;color:#667085;font-size:14px;line-height:1.6;">This proposal is valid until ${escapeHtml(args.expiresLabel)}.</p>` : "";
  const bodyHtml = `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">Based on our conversation, your proposal for <strong>${escapeHtml(args.roleTitle)}</strong> is ready.</p><p style="margin:0;color:#475467;font-size:15px;line-height:1.7;">Review the role, expected Virtual Assistant compensation, service fee, and next steps on one page.</p>${expiry}`;
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    replyTo: configuredReplyTo(),
    subject: `Your Virtual Assistant proposal — ${args.roleTitle}`,
    text: `Hi ${firstName},\n\nYour Virtual Assistant proposal for ${args.roleTitle} is ready. Review it here: ${args.proposalUrl}.${expiryText}\n\nBest,\n${senderName}`,
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName,
      ctaHref: args.proposalUrl,
      ctaLabel: "Review proposal"
    })
  }, "client_proposal");
  return { sent: true as const };
}
