import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCalendarInvite } from "@/lib/booking-operations";

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

const DEFAULT_TEAM_BCC = "jrvsaccad@gmail.com";
const teamBccRecipients = normalizeEmailList([DEFAULT_TEAM_BCC, process.env.TEAM_CC_EMAIL, process.env.TEAM_BCC_EMAIL]);
const applicationBccRecipients = normalizeEmailList([process.env.APPLICATION_CC_EMAIL, process.env.APPLICATION_BCC_EMAIL]);
const discoveryBookingBccRecipients = normalizeEmailList([
  "jrvsaccad@gmail.com",
  "bryanbatarina@gmail.com",
  process.env.DISCOVERY_BOOKING_CC_EMAIL,
  process.env.DISCOVERY_BOOKING_BCC_EMAIL,
]);
const staffClientFollowupBccRecipients = normalizeEmailList([
  "jrvsaccad@gmail.com",
  "bryanbatarina@gmail.com",
  "erwinvalles20@gmail.com",
  process.env.CLIENT_FOLLOWUP_CC_EMAIL,
  process.env.CLIENT_FOLLOWUP_BCC_EMAIL,
]);

// Added to outgoing mail as a hidden archive copy so internal recipients never
// appear to clients or Virtual Assistants. Existing env var names remain
// supported for backwards compatibility, but archive delivery is always BCC.
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
  options?: { archive?: boolean; teamCc?: boolean }
) {
  // Internal archive/team copies are always hidden from external recipients.
  // Security-sensitive messages can still opt out with archive:false/teamCc:false.
  const archiveBcc = options?.archive === false ? undefined : archiveExtraFor(payload);
  const to = normalizeEmailList(payload.to);
  const requestedCc = normalizeEmailList(payload.cc);
  const requestedBcc = normalizeEmailList([
    payload.bcc,
    archiveBcc,
    options?.teamCc === false ? [] : teamBccRecipients
  ]);
  const toSet = new Set(to.map((email) => email.toLowerCase()));
  const cc = requestedCc.filter((email) => !toSet.has(email.toLowerCase()));
  const ccSet = new Set(cc.map((email) => email.toLowerCase()));
  const bcc = requestedBcc.filter((email) => !toSet.has(email.toLowerCase()) && !ccSet.has(email.toLowerCase()));
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
  const hiringCallUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "")}/book-client-call`;
  const bodyHtml = [
    `Thanks for reaching out about hiring a <strong>${escapeHtml(service)}</strong>. We have your request and our recruiting team is reviewing it now.`,
    "We will use the details you sent to narrow the role before we recommend anyone. You do not need to create an account to keep things moving.",
    "If you would rather talk it through, choose a time that works for you and we can cover the role, schedule, budget, and must-have experience together."
  ].map((paragraph) => `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">${paragraph}</p>`).join("");

  await trackedSend(config, {
    from: config.from,
    to: [recipient],
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
    html: renderHiringEmail({
      firstName,
      bodyHtml,
      senderName: "VirtualAssistant.com.ph Talent Team",
      ctaHref: joinUrl,
      ctaLabel: "Create my VA profile"
    })
  }, "va_applicant_redirect", { archive: false });
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
  const hiringCallUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "")}/book-client-call`;
  await trackedSend(config, {
    from: config.from,
    to: [args.to],
    subject: `Following up on your Virtual Assistant request -- ${args.jobTitle}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>You asked about hiring for <strong>${escapeHtml(args.jobTitle)}</strong> on VirtualAssistant.com.ph. Our recruiting team has your request and can use it to screen relevant candidates.</p><p>If you want to talk through the role, schedule, budget, or must-have experience, you can book a client discovery call below.</p><p><a href="${hiringCallUrl}">Choose a discovery-call time</a></p><p>You do not need to create a client account to continue the conversation. If you already have one, your Client Portal is available for private candidate details and hiring workflow when needed.</p>`
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

function renderMessageParagraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 18px;color:#344054;font-size:16px;line-height:1.7;">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function renderHiringEmail(args: {
  firstName: string;
  bodyHtml: string;
  senderName: string;
  ctaHref?: string | null;
  ctaLabel?: string;
}) {
  const cta = args.ctaHref
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 30px;"><tr><td style="border-radius:10px;background:#4f46e5;"><a href="${escapeHtml(args.ctaHref)}" style="display:inline-block;padding:13px 20px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;line-height:1;">${escapeHtml(args.ctaLabel || "Continue")}</a></td></tr></table>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#101828;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f7fb;padding:28px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #eaecf0;border-radius:16px;overflow:hidden;"><tr><td style="height:5px;background:#4f46e5;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td style="padding:22px 30px;border-bottom:1px solid #f2f4f7;"><div style="font-size:20px;font-weight:800;letter-spacing:-0.4px;color:#101828;">VirtualAssistant<span style="color:#4f46e5;">.com.ph</span></div><div style="margin-top:4px;font-size:12px;color:#667085;">Hiring team</div></td></tr><tr><td style="padding:30px;"><p style="margin:0 0 18px;color:#101828;font-size:16px;line-height:1.7;">Hi ${escapeHtml(args.firstName)},</p>${args.bodyHtml}${cta}<p style="margin:28px 0 0;color:#344054;font-size:15px;line-height:1.6;">Best,<br><strong>${escapeHtml(args.senderName)}</strong></p></td></tr></table><p style="max-width:620px;margin:14px auto 0;color:#98a2b3;font-size:11px;line-height:1.5;text-align:center;">You are receiving this because you contacted VirtualAssistant.com.ph about hiring support.</p></td></tr></table></body></html>`;
}

function normalizeClientFollowup(subjectValue: string, messageValue: string) {
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

  // Templates ship with their own sign-off (e.g. "Best,\nVirtualAssistant.com.ph Hiring Team").
  // renderHiringEmail() always appends its own "Best,\n<sender>" line, so strip any trailing
  // sign-off here rather than let the two stack into a duplicate.
  message = message.replace(/\n{2,}(?:Best|Regards|Thanks|Thank you|Cheers|Sincerely|Warm regards|Kind regards)[,]?\s*\n[^\n]*\s*$/i, "").trim();

  const rawSubject = subjectValue.trim().slice(0, 180) || "VirtualAssistant.com.ph follow-up";
  const legacyMatch = rawSubject.match(/^Your VirtualAssistant\.com\.ph enquiry\s*-\s*(.+)$/i);
  const subject = legacyMatch ? `About your ${legacyMatch[1].trim()} request` : rawSubject;
  return { firstName, message, subject };
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
  const sender = args.senderName?.trim() || "VirtualAssistant.com.ph Hiring Team";
  const normalized = normalizeClientFollowup(args.subject, args.message);
  const bookingUrl = `${(process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "")}/book-client-call`;
  const bodyHtml = renderMessageParagraphs(normalized.message);
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    bcc: staffClientFollowupBccRecipients.filter((email) => email.toLowerCase() !== recipient.toLowerCase()),
    subject: normalized.subject,
    text: `Hi ${normalized.firstName},\n\n${normalized.message}\n\nChoose a discovery-call time: ${bookingUrl}\n\nBest,\n${sender}\nVirtualAssistant.com.ph`,
    html: renderHiringEmail({
      firstName: normalized.firstName,
      bodyHtml,
      senderName: sender,
      ctaHref: bookingUrl,
      ctaLabel: "Choose a call time"
    })
  }, "client_followup");
  return { sent: true as const };
}

export async function sendTransactionalEventEmail(args: { to?: string | null; subject: string; heading: string; body: string; href?: string; hrefLabel?: string; archive?: boolean; teamCc?: boolean }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const link = args.href ? `<p><a href="${escapeHtml(args.href)}">${escapeHtml(args.hrefLabel || "Open VirtualAssistant.com.ph")}</a></p>` : "";
  const isPasswordChangeNotice = args.subject.trim().toLowerCase() === "your password was changed" || args.heading.trim().toLowerCase() === "password updated";
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: args.subject,
    html: `<h2>${escapeHtml(args.heading)}</h2><p>${escapeHtml(args.body)}</p>${link}`
  }, "transactional_event", { archive: args.archive !== false, teamCc: args.teamCc !== false && !isPasswordChangeNotice });
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
    details: `Client discovery call for ${args.service}.${args.meetingUrl ? ` Join: ${args.meetingUrl}` : ""} Lead ID: ${args.leadId}`,
  });
  const calendarUrl = `https://calendar.google.com/calendar/render?${calendarParams.toString()}`;
  const firstName = args.clientName.trim().split(/\s+/)[0] || "there";
  const rows = [
    ["Client", args.clientName],
    ["Company", args.company],
    ["Email", args.to],
    ["Client timezone", args.clientTimeZone],
    ["Lead ID", args.leadId],
  ].filter(([, value]) => value);
  const invite = createCalendarInvite({ uid: args.leadId, startsAt: args.scheduledAt, durationMinutes: 30, company: args.company, service: args.service, meetingUrl: args.meetingUrl });
  const meeting = args.meetingUrl
    ? `<p><a href="${escapeHtml(args.meetingUrl)}">Join the Zoom call</a></p>`
    : `<p>Jervis or Bryan will add the meeting link before the call.</p>`;

  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    bcc: discoveryBookingBccRecipients.filter((email) => email.toLowerCase() !== recipient.toLowerCase()),
    replyTo: recipient,
    attachments: [{ filename: "virtualassistant-discovery-call.ics", content: Buffer.from(invite).toString("base64") }],
    subject: `Client discovery call booked: ${args.company} — ${args.clientLabel}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Your 30-minute client discovery call is confirmed for <strong>${escapeHtml(args.clientLabel)}</strong>.</p><p>For our Philippine team, that is <strong>${escapeHtml(args.manilaLabel)}</strong>.</p>${meeting}<p><a href="${escapeHtml(calendarUrl)}">Add to Google Calendar</a> or open the attached calendar invitation.</p><p><a href="${escapeHtml(args.manageUrl)}">Reschedule or cancel this booking</a></p><hr><h3>Booking details</h3>${rows.map(([label, value]) => `<p><strong>${escapeHtml(String(label))}:</strong> ${escapeHtml(String(value))}</p>`).join("")}`,
  }, "public_discovery_booking");
  return { sent: true as const };
}

export async function sendDiscoveryReminderEmail(args: { to: string; clientName?: string | null; scheduledLabel: string; meetingUrl?: string | null; manageUrl: string; window: "24h" | "1h" }) {
  const config = resendConfig();
  const recipient = normalizeEmailAddress(args.to);
  if (!config || !recipient) return { sent: false as const, reason: !recipient ? "invalid_recipient" : "email_not_configured" };
  const firstName = args.clientName?.trim().split(/\s+/)[0] || "there";
  const timing = args.window === "24h" ? "tomorrow" : "in about one hour";
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    bcc: discoveryBookingBccRecipients.filter((email) => email.toLowerCase() !== recipient.toLowerCase()),
    subject: `Reminder: your discovery call is ${timing}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Your VirtualAssistant.com.ph client discovery call is ${timing}, at <strong>${escapeHtml(args.scheduledLabel)}</strong>.</p>${args.meetingUrl ? `<p><a href="${escapeHtml(args.meetingUrl)}">Join the Zoom call</a></p>` : ""}<p><a href="${escapeHtml(args.manageUrl)}">Reschedule or cancel</a></p>`,
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
  const expiry = args.expiresLabel ? `<p class="small">This proposal is valid until ${escapeHtml(args.expiresLabel)}.</p>` : "";
  await trackedSend(config, {
    from: config.from,
    to: [recipient],
    subject: `Your Virtual Assistant proposal — ${args.roleTitle}`,
    html: `<p>Hi ${escapeHtml(firstName)},</p><p>Based on our conversation, your VirtualAssistant.com.ph proposal for <strong>${escapeHtml(args.roleTitle)}</strong> is ready.</p><p>You can review the role, expected Virtual Assistant compensation, service fee, and next steps on one page.</p><p><a href="${escapeHtml(args.proposalUrl)}">Review and accept proposal</a></p>${expiry}<p>Regards,<br>${escapeHtml(args.recruiterName || "VirtualAssistant.com.ph hiring team")}</p>`
  }, "client_proposal");
  return { sent: true as const };
}
