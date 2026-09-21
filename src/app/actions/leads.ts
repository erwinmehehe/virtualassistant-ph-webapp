"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES, MIN_HOURLY_RATE } from "@/lib/constants";
import { servicePageBySlug } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { inferCategories, inferHours } from "@/lib/category-inference";
import { sendDiscoveryMeetingSetupFailureEmail, sendInternalDiscoveryBookingNotificationEmail, sendLeadAcknowledgementEmail, sendLeadNotificationEmail, sendPublicDiscoveryBookingEmail, sendVaApplicantRedirectEmail } from "@/lib/email";
import { looksLikeVaApplication, VA_APPLICANT_SOURCE_PAGE } from "@/lib/va-applicant-detection";
import { cleanJobSummary, cleanJobDescription } from "@/lib/job-content-cleanup";
import { DISCOVERY_DURATION_MINUTES, formatDiscoverySlot, isAllowedDiscoverySlot } from "@/lib/discovery-booking";
import { bookingManageUrl, cancelGoogleMeetDiscoveryMeeting, createBookingManageToken, createGoogleMeetDiscoveryMeeting } from "@/lib/booking-operations";

export type ServiceMatchState = {
  status: "idle" | "success" | "error";
  message?: string;
  leadId?: string;
  jobId?: string;
  clientLinked?: boolean;
  /** The submission read like a Virtual Assistant applying for work. */
  vaApplicant?: boolean;
};

const DUPLICATE_SUBMISSION_WINDOW_MINUTES = 30;

/**
 * Stores a hiring-form submission that reads like a VA applying for work as a
 * va_support lead (kept out of the client pipeline and recruiter SLAs, still
 * visible to admins), and emails the sender the VA sign-up link. No job is
 * created and recruiters are not notified.
 */
async function routeVaApplicant(args: { name?: string | null; email: string; phone?: string | null; service: string; hours?: string | null; message: string; sourcePath: string; sessionId?: string | null }) {
  try {
    const admin = createAdminClient();
    const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
    await admin.from("lead_intake").insert({
      name: args.name?.trim() || null,
      email: args.email,
      phone: args.phone?.trim() || null,
      service: args.service,
      hours: args.hours || null,
      message: args.message,
      source_page: VA_APPLICANT_SOURCE_PAGE,
      lead_type: "va_support",
      page_url: `${base}${args.sourcePath}`,
      session_id: args.sessionId || null
    });
  } catch {
    // Routing a likely applicant is best effort; never fail the visitor's submission.
  }
  try {
    await sendVaApplicantRedirectEmail({ to: args.email, name: args.name });
  } catch {
    // Email delivery is best effort.
  }
}

/**
 * Finds a lead already submitted by this same email, for the same
 * service/category, in the last 30 minutes -- catches double-clicks and
 * accidental resubmits (a double-click before the button's disabled state
 * kicks in, or a page-refresh resubmit) without adding any friction to a
 * genuine first submission. Returns the existing lead + its job so the
 * caller can respond as if the submission succeeded, rather than creating
 * a second duplicate lead and job.
 */
async function findRecentDuplicateLead(admin: ReturnType<typeof createAdminClient>, email: string, service: string | null) {
  const since = new Date(Date.now() - DUPLICATE_SUBMISSION_WINDOW_MINUTES * 60 * 1000).toISOString();
  let query = admin.from("lead_intake").select("id,job_id,client_id").ilike("email", email).gte("created_at", since).order("created_at", { ascending: false }).limit(1);
  if (service) query = query.eq("service", service);
  const { data } = await query.maybeSingle();
  return data;
}

const serviceMatchSchema = z.object({
  slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/),
  category: z.string().trim().min(2).max(100),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(50).optional(),
  hours: z.string().trim().min(1).max(80),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().min(10).max(3000),
  source_path: z.string().trim().min(1).max(500).refine((value) => value.startsWith("/") && !value.startsWith("//")),
  session_id: z.string().uuid().or(z.literal("")).optional(),
  website: z.string().max(200).optional()
});


async function currentClientId() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return profile?.role === "client" ? user.id : null;
  } catch {
    return null;
  }
}

function rateRangeFromBudget(value?: string | null) {
  const matches = String(value || "").match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
  if (!matches.length) return { min: MIN_HOURLY_RATE, max: null as number | null };
  const min = Math.max(MIN_HOURLY_RATE, matches[0]);
  const max = matches.length > 1 ? Math.max(min, matches[1]) : null;
  return { min, max };
}


function jobTitleForCategory(category: string) {
  const labels: Record<string, string> = {
    "Administrative Support": "Administrative Virtual Assistant",
    "Bookkeeping & Finance": "Bookkeeping & Finance Virtual Assistant",
    "Customer Service": "Customer Service Virtual Assistant",
    "Dental & Healthcare": "Dental & Healthcare Virtual Assistant",
    "Ecommerce": "Ecommerce Virtual Assistant",
    "Executive Assistance": "Executive Virtual Assistant",
    "Lead Generation & Sales": "Lead Generation & Sales Virtual Assistant",
    "Marketing & Social Media": "Marketing & Social Media Virtual Assistant",
    "Phone & Reception": "Virtual Receptionist",
    "Real Estate": "Real Estate Virtual Assistant",
    "SEO": "SEO Virtual Assistant",
    "Video Editing & Creative": "Video Editing & Creative Virtual Assistant",
    "Web & WordPress": "WordPress & Web Virtual Assistant"
  };
  return labels[category] || `${category} Virtual Assistant`;
}

async function createPendingJobForLead(args: {
  admin: ReturnType<typeof createAdminClient>;
  leadId: string;
  title: string;
  service?: string | null;
  company?: string | null;
  hours?: string | null;
  timezone?: string | null;
  startTime?: string | null;
  message?: string | null;
  budget?: string | null;
  requestedVaId?: string | null;
  clientId?: string | null;
}) {
  // Lead-to-job creation is idempotent. Retries, double submits and concurrent
  // request processing must reuse the job already linked to this exact lead.
  const { data: existingLead } = await args.admin
    .from("lead_intake")
    .select("job_id")
    .eq("id", args.leadId)
    .maybeSingle();
  if (existingLead?.job_id) return existingLead.job_id as string;

  const { data: existingJob } = await args.admin
    .from("jobs")
    .select("id")
    .eq("lead_id", args.leadId)
    .maybeSingle();
  if (existingJob?.id) {
    await args.admin.from("lead_intake").update({ job_id: existingJob.id, client_id: args.clientId || null }).eq("id", args.leadId).is("job_id", null);
    return existingJob.id as string;
  }

  const categories = args.service && VA_CATEGORIES.includes(args.service as (typeof VA_CATEGORIES)[number])
    ? [args.service]
    : inferCategories(args.service, args.message);
  const rates = rateRangeFromBudget(args.budget);
  const fallbackSummary = `Virtual Assistant support requested for ${args.service || "business operations"}.`;
  const description = cleanJobDescription(args.message);
  const { data: job, error } = await args.admin.from("jobs").insert({
    client_id: args.clientId || null,
    lead_id: args.leadId,
    requested_va_id: args.requestedVaId || null,
    title: args.title,
    company_name: args.company || null,
    summary: cleanJobSummary(args.message, fallbackSummary),
    description,
    responsibilities: description ? [description] : [],
    categories,
    hours_per_week: inferHours(args.hours),
    min_hourly_rate: rates.min,
    max_hourly_rate: rates.max,
    timezone: args.timezone || null,
    overlap_hours: 4,
    live_coverage_exception: /reception|dispatch|cold call|outbound|front desk/i.test(`${args.service || ""} ${args.message || ""}`),
    onboarding_plan: "Client onboarding, success measures, and tool access to be confirmed before publication.",
    direct_feedback: true,
    engagement_length: "Long-term preferred",
    start_timing: args.startTime || null,
    status: "pending"
  }).select("id").single();
  if (error) throw error;
  await args.admin.from("lead_intake").update({ job_id: job.id, client_id: args.clientId || null }).eq("id", args.leadId);
  return job.id as string;
}

async function mergeBookingIntoRecentClientLead(args: {
  admin: ReturnType<typeof createAdminClient>;
  bookingLeadId: string;
  email: string;
  company: string;
  service: string;
  hours: string;
  budget: string;
  timezone: string;
  startTime: string;
  clientId?: string | null;
}) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: candidates } = await args.admin
    .from("lead_intake")
    .select("id,job_id,company")
    .ilike("email", args.email)
    .eq("lead_type", "client_hiring")
    .not("job_id", "is", null)
    .is("discovery_scheduled_at", null)
    .neq("id", args.bookingLeadId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(10);

  const companyKey = args.company.trim().toLowerCase();
  const related = (candidates || []).find(
    (row: any) => String(row.company || "").trim().toLowerCase() === companyKey,
  );
  if (!related?.job_id) return null;

  const rates = rateRangeFromBudget(args.budget);
  const hoursPerWeek = inferHours(args.hours);
  const { error: jobError } = await args.admin.from("jobs").update({
    title: args.service,
    company_name: args.company,
    ...(hoursPerWeek ? { hours_per_week: hoursPerWeek } : {}),
    min_hourly_rate: rates.min,
    max_hourly_rate: rates.max,
    timezone: args.timezone,
    start_timing: args.startTime,
  }).eq("id", related.job_id);
  if (jobError) throw jobError;

  if (args.clientId) {
    const { error: clientError } = await args.admin
      .from("lead_intake")
      .update({ client_id: args.clientId })
      .eq("id", args.bookingLeadId);
    if (clientError) throw clientError;
  }

  const { data: mergedLeadId, error: mergeError } = await args.admin.rpc(
    "merge_discovery_booking_lead",
    {
      canonical_lead_id: related.id,
      booking_lead_id: args.bookingLeadId,
    },
  );
  if (mergeError) throw mergeError;

  return {
    leadId: String(mergedLeadId || related.id),
    jobId: String(related.job_id),
  };
}

async function resolveRequestedVaId(admin: ReturnType<typeof createAdminClient>, talent?: string | null) {
  if (!talent) return null;
  const { data } = await admin.from("public_va_directory").select("user_id").eq("slug", talent).maybeSingle();
  return data?.user_id || null;
}

async function recordLeadAnalytics(admin: ReturnType<typeof createAdminClient>, args: { leadId: string; jobId?: string | null; path: string; sessionId?: string | null; metadata?: Record<string, unknown> }) {
  const metadata = { lead_id: args.leadId, job_id: args.jobId || null, ...(args.metadata || {}) };
  await admin.from("analytics_events").insert([
    { event_name: "lead_submit", path: args.path, session_id: args.sessionId || null, metadata },
    { event_name: "job_draft_created", path: args.path, session_id: args.sessionId || null, metadata }
  ]);
}

const serviceMatchFieldLabels: Record<string, string> = {
  name: "First name",
  email: "Work email",
  hours: "Hours needed per week",
  message: "A short description of what the Virtual Assistant should own (at least 10 characters)"
};

export async function submitServiceMatchAction(_previousState: ServiceMatchState, formData: FormData): Promise<ServiceMatchState> {
  const parsed = serviceMatchSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = String(firstIssue?.path?.[0] ?? "");
    const label = serviceMatchFieldLabels[field];
    return { status: "error", message: label ? `Please fill in: ${label}` : "Please complete the required fields so we can match the role accurately." };
  }
  if (parsed.data.website) return { status: "success", message: "Your request has been received." };

  if (looksLikeVaApplication(parsed.data.message)) {
    await routeVaApplicant({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, service: parsed.data.category, hours: parsed.data.hours, message: parsed.data.message, sourcePath: parsed.data.source_path, sessionId: parsed.data.session_id });
    return { status: "success", vaApplicant: true };
  }

  const service = servicePageBySlug(parsed.data.slug);
  if (!service || service.directoryCategory !== parsed.data.category) {
    return { status: "error", message: "We could not verify this service request. Please refresh the page and try again." };
  }

  const briefMessage = [parsed.data.budget ? `Virtual Assistant budget: ${parsed.data.budget}.` : "", parsed.data.message].filter(Boolean).join("\n\n");
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";
  try {
    const admin = createAdminClient();
    const sourcePath = parsed.data.source_path;
    const sourcePage = sourcePath.startsWith("/service/") ? "service_match_request" : "blog_match_request";
    const pageUrl = `${base.replace(/\/$/, "")}${sourcePath}`;

    const duplicate = await findRecentDuplicateLead(admin, parsed.data.email, service.name);
    if (duplicate) {
      return {
        status: "success",
        leadId: duplicate.id,
        jobId: duplicate.job_id || undefined,
        clientLinked: Boolean(duplicate.client_id),
        message: `Your ${service.name.toLowerCase()} hiring request is with our recruiting team. We will review the role and follow up using the contact details you provided.`
      };
    }

    const { data: lead, error } = await admin.from("lead_intake").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() || null,
      company: parsed.data.company?.trim() || null,
      service: service.name,
      hours: parsed.data.hours,
      budget: parsed.data.budget || null,
      message: briefMessage,
      source_page: sourcePage,
      page_url: pageUrl,
      session_id: parsed.data.session_id || null
    }).select("id").single();
    if (error || !lead?.id) return { status: "error", message: "We could not save your request. Please try again or use the full hiring brief." };

    const clientId = await currentClientId();
    const jobId = await createPendingJobForLead({
      admin,
      leadId: lead.id,
      clientId,
      title: service.name,
      service: service.directoryCategory,
      company: parsed.data.company?.trim() || null,
      hours: parsed.data.hours,
      message: briefMessage,
      budget: parsed.data.budget
    });

    await recordLeadAnalytics(admin, {
      leadId: lead.id,
      jobId,
      path: sourcePath,
      sessionId: parsed.data.session_id || null,
      metadata: { service_slug: service.slug, source_page: sourcePage }
    });

    try {
      await sendLeadNotificationEmail({
        leadId: lead.id,
        jobId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone?.trim() || null,
        service: service.name,
        hours: parsed.data.hours,
        message: briefMessage,
        sourcePage,
        pageUrl
      });
    } catch {
      // Lead and pending job creation must not fail because email delivery is unavailable.
    }
    try {
      await sendLeadAcknowledgementEmail({
        to: parsed.data.email,
        name: parsed.data.name,
        service: service.name,
        leadId: lead.id
      });
    } catch {
      // Lead storage is the source of truth; acknowledgement email is best effort.
    }

    return {
      status: "success",
      leadId: lead.id,
      jobId,
      clientLinked: Boolean(clientId),
      message: clientId
        ? `Your ${service.name.toLowerCase()} hiring request is saved in your Client Portal and our recruiting team will review it.`
        : `Your ${service.name.toLowerCase()} hiring request is with our recruiting team. We will review the role and follow up using the contact details you provided.`
    };
  } catch {
    return { status: "error", message: "We could not save your request. Please try again or use the full hiring brief." };
  }
}


const industryMatchSchema = z.object({
  slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  company: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(50).optional(),
  hours: z.string().trim().min(1).max(80),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(3000).optional().default(""),
  tasks: z.array(z.string().trim().min(2).max(140)).max(6).optional().default([]),
  source_path: z.string().trim().min(1).max(500).refine((value) => value.startsWith("/industries/") && !value.startsWith("//")),
  session_id: z.string().uuid().or(z.literal("")).optional(),
  website: z.string().max(200).optional()
}).refine((value) => value.tasks.length > 0 || value.message.length >= 10, {
  message: "Choose at least one workflow or add a short note about the work you need.",
  path: ["message"]
});

const industryMatchFieldLabels: Record<string, string> = {
  name: "First name",
  email: "Work email",
  hours: "Hours needed per week"
};

export async function submitIndustryMatchAction(_previousState: ServiceMatchState, formData: FormData): Promise<ServiceMatchState> {
  const parsed = industryMatchSchema.safeParse({ ...Object.fromEntries(formData), tasks: formData.getAll("tasks") });
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = String(firstIssue?.path?.[0] ?? "");
    // The schema's own refine() already gives a specific, correct message for
    // the workflow/message case -- only fall back to a generic field label
    // for the other, simpler required fields.
    const message = firstIssue?.message && firstIssue.message !== "Required"
      ? firstIssue.message
      : industryMatchFieldLabels[field] ? `Please fill in: ${industryMatchFieldLabels[field]}` : "Please complete the required fields so we can match the role accurately.";
    return { status: "error", message };
  }
  if (parsed.data.website) return { status: "success", message: "Your request has been received." };

  if (looksLikeVaApplication(parsed.data.message)) {
    await routeVaApplicant({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, service: `Industry: ${parsed.data.slug}`, hours: parsed.data.hours, message: parsed.data.message, sourcePath: parsed.data.source_path, sessionId: parsed.data.session_id });
    return { status: "success", vaApplicant: true };
  }

  const industry = INDUSTRIES.find((item) => item.slug === parsed.data.slug);
  if (!industry) return { status: "error", message: "We could not verify this industry request. Please refresh the page and try again." };

  const primaryService = industry.serviceSlugs.map((slug) => servicePageBySlug(slug)).find(Boolean);
  const selectedTasks = parsed.data.tasks.filter((task) => industry.workflows.includes(task));
  const combinedMessage = [selectedTasks.length ? `Requested workflows: ${selectedTasks.join(", ")}.` : "", parsed.data.budget ? `Virtual Assistant budget: ${parsed.data.budget}.` : "", parsed.data.message].filter(Boolean).join("\n\n");
  const category = primaryService?.directoryCategory || inferCategories(industry.label, industry.primaryKeyword, combinedMessage)[0] || "Administrative Support";
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph";

  try {
    const admin = createAdminClient();
    const sourcePath = parsed.data.source_path;
    const pageUrl = `${base.replace(/\/$/, "")}${sourcePath}`;
    const serviceLabel = `${industry.label} virtual assistant support`;

    const duplicate = await findRecentDuplicateLead(admin, parsed.data.email, serviceLabel);
    if (duplicate) {
      return {
        status: "success",
        leadId: duplicate.id,
        jobId: duplicate.job_id || undefined,
        clientLinked: Boolean(duplicate.client_id),
        message: "Your hiring request is with our recruiting team. We will review the role and follow up using the contact details you provided."
      };
    }

    const { data: lead, error } = await admin.from("lead_intake").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() || null,
      company: parsed.data.company?.trim() || null,
      service: serviceLabel,
      hours: parsed.data.hours,
      budget: parsed.data.budget || null,
      message: combinedMessage,
      source_page: "industry_match_request",
      page_url: pageUrl,
      session_id: parsed.data.session_id || null
    }).select("id").single();
    if (error || !lead?.id) return { status: "error", message: "We could not save your request. Please try again or use the full hiring brief." };

    const clientId = await currentClientId();
    const jobId = await createPendingJobForLead({
      admin,
      leadId: lead.id,
      clientId,
      title: primaryService?.name || `${industry.label} Virtual Assistant`,
      service: category,
      company: parsed.data.company?.trim() || null,
      hours: parsed.data.hours,
      message: combinedMessage,
      budget: parsed.data.budget
    });

    await recordLeadAnalytics(admin, {
      leadId: lead.id,
      jobId,
      path: sourcePath,
      sessionId: parsed.data.session_id || null,
      metadata: { industry_slug: industry.slug, source_page: "industry_match_request", requested_workflows: selectedTasks }
    });

    try {
      await sendLeadNotificationEmail({
        leadId: lead.id,
        jobId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone?.trim() || null,
        service: serviceLabel,
        hours: parsed.data.hours,
        message: combinedMessage,
        sourcePage: "industry_match_request",
        pageUrl
      });
    } catch {
      // Lead and pending job creation remain successful if email delivery is unavailable.
    }
    try {
      await sendLeadAcknowledgementEmail({
        to: parsed.data.email,
        name: parsed.data.name,
        service: `${industry.label} Virtual Assistant support`,
        leadId: lead.id
      });
    } catch {
      // Lead storage is the source of truth; acknowledgement email is best effort.
    }

    return {
      status: "success",
      leadId: lead.id,
      jobId,
      clientLinked: Boolean(clientId),
      message: clientId
        ? `Your ${industry.label.toLowerCase()} hiring request is saved in your Client Portal and our recruiting team will review it.`
        : `Your ${industry.label.toLowerCase()} hiring request is with our recruiting team. We will review the role and follow up using the contact details you provided.`
    };
  } catch {
    return { status: "error", message: "We could not save your request. Please try again or use the full hiring brief." };
  }
}

const roleBriefSchema = z.object({
  category: z.string().min(2).max(100),
  hours: z.string().min(1).max(80),
  timezone: z.string().min(2).max(120),
  budget: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().trim().max(50).optional(),
  name: z.string().max(100).optional(),
  company: z.string().max(160).optional(),
  start_time: z.string().max(100).optional(),
  message: z.string().trim().min(15).max(3000),
  talent: z.string().max(160).optional(),
  shortlist: z.string().max(800).optional(),
  source_path: z.string().trim().min(1).max(500).refine((value) => value.startsWith("/") && !value.startsWith("//")).optional(),
  session_id: z.string().uuid().or(z.literal("")).optional(),
  website: z.string().max(200).optional()
});

const roleBriefFieldLabels: Record<string, string> = {
  category: "What type of help do you need",
  hours: "Hours / week",
  timezone: "Timezone / overlap",
  budget: "Hourly budget",
  email: "Work email",
  message: "What should this Virtual Assistant own (at least 15 characters, including the actual tasks)"
};

export async function submitRoleBriefAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const attachmentValue = formData.get("attachment");
  const attachment = attachmentValue instanceof File && attachmentValue.size > 0 ? attachmentValue : null;
  const allowedAttachmentTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]);
  const allowedAttachmentName = /\.(pdf|doc|docx|txt)$/i;
  // Return the visitor to the page they submitted from. Validated the same way
  // as source_path, so it can only ever be a path on this site.
  const rawReturn = String(formData.get("source_path") || "").trim();
  const returnTo = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/hire";
  if (attachment && (attachment.size > 10 * 1024 * 1024 || (!allowedAttachmentTypes.has(attachment.type) && !allowedAttachmentName.test(attachment.name)))) {
    redirect(`${returnTo}?error=${encodeURIComponent("Attach a PDF, Word, or text file no larger than 10 MB.")}`);
  }
  const parsed = roleBriefSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = String(firstIssue?.path?.[0] ?? "");
    const label = roleBriefFieldLabels[field];
    const message = label ? `Please fill in: ${label}` : "Please complete the required role details";
    redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
  }
  if (parsed.data.website) redirect(`${returnTo}?sent=1`);

  if (looksLikeVaApplication(parsed.data.message, parsed.data.company)) {
    await routeVaApplicant({ name: parsed.data.name, email: parsed.data.email, phone: parsed.data.phone, service: parsed.data.category, hours: parsed.data.hours, message: parsed.data.message, sourcePath: returnTo, sessionId: parsed.data.session_id });
    redirect(`${returnTo}?sent=1&va=1`);
  }

  const category = VA_CATEGORIES.includes(parsed.data.category as (typeof VA_CATEGORIES)[number]) ? parsed.data.category : parsed.data.category.trim();
  const shortlistSlugs = String(parsed.data.shortlist || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => /^[a-z0-9-]+$/i.test(item))
    .slice(0, 5);
  const candidateContext = parsed.data.talent ? `Requested talent profile: ${parsed.data.talent}.` : "";
  const shortlistContext = shortlistSlugs.length ? `Client-selected shortlist: ${shortlistSlugs.join(", ")}.` : "";
  const budgetContext = `Virtual Assistant budget: ${parsed.data.budget}.`;
  const message = [candidateContext, shortlistContext, budgetContext, parsed.data.message?.trim()].filter(Boolean).join("\n\n") || null;
  const admin = createAdminClient();
  const sourcePath = parsed.data.source_path || "/hire";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const sourcePage = shortlistSlugs.length
    ? "talent_shortlist_request"
    : parsed.data.talent
      ? "talent_introduction_request"
      : sourcePath === "/hire/" || sourcePath === "/hire"
        ? "public_role_brief"
        : "content_role_brief";
  const pageUrl = `${base}${sourcePath}`;

  const duplicate = await findRecentDuplicateLead(admin, parsed.data.email, category);
  if (duplicate) redirect(`${returnTo}?sent=1&cat=${encodeURIComponent(category)}`);

  const { data: lead, error } = await admin.from("lead_intake").insert({
    name: parsed.data.name?.trim() || null,
    email: parsed.data.email,
    phone: parsed.data.phone?.trim() || null,
    service: category,
    company: parsed.data.company?.trim() || null,
    hours: parsed.data.hours,
    budget: parsed.data.budget,
    start_time: parsed.data.start_time?.trim() || null,
    timezone: parsed.data.timezone,
    message,
    source_page: sourcePage,
    page_url: pageUrl,
    session_id: parsed.data.session_id || null
  }).select("id").single();
  if (error || !lead?.id) redirect(`${returnTo}?error=${encodeURIComponent("We could not save your request. Please try again.")}`);

  if (attachment) {
    const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(-140) || "client-brief";
    const attachmentPath = `${lead.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await admin.storage.from("lead-attachments").upload(attachmentPath, attachment, { upsert: false, contentType: attachment.type });
    if (uploadError) {
      await admin.from("lead_intake").delete().eq("id", lead.id);
      redirect(`${returnTo}?error=${encodeURIComponent("We could not securely upload that document. Please try again without it or use a smaller file.")}`);
    }
    const { error: metadataError } = await admin.from("lead_intake").update({
      attachment_path: attachmentPath,
      attachment_name: attachment.name.slice(0, 255),
      attachment_type: attachment.type || null,
    }).eq("id", lead.id);
    if (metadataError) {
      await admin.storage.from("lead-attachments").remove([attachmentPath]);
      await admin.from("lead_intake").delete().eq("id", lead.id);
      redirect(`${returnTo}?error=${encodeURIComponent("We could not securely attach that document. Please try again without it.")}`);
    }
  }

  const requestedVaId = await resolveRequestedVaId(admin, parsed.data.talent || shortlistSlugs[0]);
  const clientId = await currentClientId();
  let jobId: string;
  try {
    jobId = await createPendingJobForLead({
      admin,
      leadId: lead.id,
      clientId,
      title: jobTitleForCategory(category),
      service: category,
      company: parsed.data.company?.trim() || null,
      hours: parsed.data.hours,
      timezone: parsed.data.timezone,
      startTime: parsed.data.start_time?.trim() || null,
      message,
      budget: parsed.data.budget,
      requestedVaId
    });
  } catch {
    await admin.from("lead_intake").update({ status: "new" }).eq("id", lead.id);
    redirect(`${returnTo}?error=${encodeURIComponent("We saved your request but could not prepare the job draft. Please try again.")}`);
  }

  await recordLeadAnalytics(admin, {
    leadId: lead.id,
    jobId,
    path: sourcePath,
    sessionId: parsed.data.session_id || null,
    metadata: { service: category, source_page: sourcePage, shortlist: shortlistSlugs }
  });

  try {
    await sendLeadNotificationEmail({
      leadId: lead.id,
      jobId,
      name: parsed.data.name?.trim() || null,
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() || null,
      company: parsed.data.company?.trim() || null,
      service: category,
      hours: parsed.data.hours,
      timezone: parsed.data.timezone,
      message,
      sourcePage,
      pageUrl
    });
  } catch {
    // Lead and job creation remain successful even if notification delivery fails.
  }
  try {
    await sendLeadAcknowledgementEmail({
      to: parsed.data.email,
      name: parsed.data.name?.trim() || null,
      service: jobTitleForCategory(category),
      leadId: lead.id
    });
  } catch {
    // Lead storage is the source of truth; acknowledgement email is best effort.
  }

  if (clientId) redirect(`/workspace/client/jobs/${jobId}?created_from_brief=1`);
  const talent = parsed.data.talent ? `&talent=${encodeURIComponent(parsed.data.talent)}` : "";
  const shortlist = shortlistSlugs.length ? `&shortlist=${encodeURIComponent(shortlistSlugs.join(","))}` : "";
  redirect(`${returnTo}?sent=1&lead=${encodeURIComponent(lead.id)}&cat=${encodeURIComponent(category)}${talent}${shortlist}`);
}

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().trim().max(50).optional(),
  company: z.string().max(160).optional(),
  topic: z.string().min(2).max(100),
  message: z.string().min(20).max(3000),
  website: z.string().max(200).optional()
});

export async function submitContactAction(formData: FormData) {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect("/contact?error=Please%20complete%20the%20required%20fields");
  if (parsed.data.website) redirect("/contact?sent=1");
  const admin = createAdminClient();
  const pageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/contact`;
  const { data: lead, error } = await admin.from("lead_intake").insert({
    name: parsed.data.name.trim(),
    email: parsed.data.email,
    phone: parsed.data.phone?.trim() || null,
    company: parsed.data.company?.trim() || null,
    service: parsed.data.topic.trim(),
    message: parsed.data.message.trim(),
    source_page: "contact",
    page_url: pageUrl
  }).select("id").single();
  if (error) redirect(`/contact?error=${encodeURIComponent("We could not save your message. Please try again.")}`);
  if (lead?.id) {
    await recordLeadAnalytics(admin, {
      leadId: lead.id,
      path: "/contact",
      metadata: { source_page: "contact", topic: parsed.data.topic.trim() }
    });
  }
  try {
    await sendLeadNotificationEmail({
      leadId: lead?.id,
      name: parsed.data.name.trim(),
      email: parsed.data.email,
      phone: parsed.data.phone?.trim() || null,
      company: parsed.data.company?.trim() || null,
      service: parsed.data.topic.trim(),
      message: parsed.data.message.trim(),
      sourcePage: "contact",
      pageUrl
    });
  } catch {
    // Contact storage is the source of truth; email notification is best effort.
  }
  try {
    await sendLeadAcknowledgementEmail({
      to: parsed.data.email,
      name: parsed.data.name.trim(),
      service: parsed.data.topic.trim()
    });
  } catch {
    // The saved request remains successful if acknowledgement delivery fails.
  }
  redirect("/contact?sent=1");
}

const discoveryBookingSchema = z.object({
  audience: z.literal("client"),
  scheduled_at: z.string().datetime({ offset: true }),
  timezone: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  phone: z.string().trim().max(50).optional(),
  company: z.string().trim().min(2).max(160),
  company_url: z.string().trim().url().max(300).or(z.literal("")).optional(),
  service: z.string().trim().min(3).max(100).refine((value) => !/^virtual assistant hiring$/i.test(value), {
    message: "Tell us the actual role you need to hire.",
  }),
  hours: z.string().trim().min(1).max(3).refine((value) => {
    const hours = Number(value);
    return Number.isInteger(hours) && hours >= 1 && hours <= 80;
  }, { message: "Hours per week must be between 1 and 80." }),
  budget: z.string().trim().min(1).max(100).refine((value) => {
    const rates = value.match(/\d+(?:\.\d+)?/g)?.map(Number).filter(Number.isFinite) || [];
    return rates.length > 0 && rates.some((rate) => rate >= MIN_HOURLY_RATE);
  }, { message: `Enter an hourly VA budget of at least USD ${MIN_HOURLY_RATE}/hour.` }),
  start_time: z.string().trim().min(2).max(100),
  message: z.string().trim().min(15).max(3000),
  website: z.string().max(200).optional(),
});

export async function submitDiscoveryBookingAction(formData: FormData) {
  const parsed = discoveryBookingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    redirect(`/book-client-call?error=${encodeURIComponent("Please choose a time and complete all required client questions.")}`);
  }
  if (parsed.data.website) redirect("/book-client-call?booked=1");
  if (!isAllowedDiscoverySlot(parsed.data.scheduled_at)) {
    redirect(`/book-client-call?error=${encodeURIComponent("That time is no longer available. Please choose another slot.")}`);
  }

  const admin = createAdminClient();
  const manage = createBookingManageToken();
  let meeting: Awaited<ReturnType<typeof createGoogleMeetDiscoveryMeeting>> | null = null;
  let meetingError: string | null = null;
  try {
    meeting = await createGoogleMeetDiscoveryMeeting({
      topic: `VirtualAssistant.com.ph discovery call with ${parsed.data.company}`,
      startsAt: parsed.data.scheduled_at,
      durationMinutes: DISCOVERY_DURATION_MINUTES,
      attendeeEmails: [parsed.data.email],
    });
  } catch (error) {
    meetingError = error instanceof Error ? error.message : "Unknown Google Meet setup error.";
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const clientDetails = [
    `Company website: ${parsed.data.company_url || "Not provided"}`,
    `Hourly VA budget: ${parsed.data.budget}`,
    `Preferred start: ${parsed.data.start_time}`,
    `Visitor timezone: ${parsed.data.timezone}`,
    "",
    parsed.data.message,
  ].join("\n");

  const { data: lead, error } = await admin.from("lead_intake").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone || null,
    company: parsed.data.company,
    service: parsed.data.service,
    hours: parsed.data.hours,
    budget: parsed.data.budget,
    start_time: parsed.data.start_time,
    timezone: parsed.data.timezone,
    message: clientDetails,
    source_page: "client_discovery_booking",
    page_url: `${base}/book-client-call`,
    crm_stage: "discovery_booked",
    discovery_scheduled_at: parsed.data.scheduled_at,
    discovery_duration_minutes: DISCOVERY_DURATION_MINUTES,
    discovery_meeting_url: meeting?.joinUrl || null,
    discovery_calendar_event_id: meeting?.eventId || null,
    discovery_meeting_provider: meeting ? "google_meet" : null,
    discovery_manage_token_hash: manage.hash,
    discovery_manage_token: manage.token,
    discovery_notes: [
      "Booked by a prospective client through the public qualification calendar.",
      meetingError ? `Automatic Google Meet setup failed: ${meetingError}` : null,
    ].filter(Boolean).join("\n"),
  }).select("id").single();

  if (error || !lead?.id) {
    if (meeting?.eventId) {
      try { await cancelGoogleMeetDiscoveryMeeting(meeting.eventId); } catch { /* best-effort cleanup of unsaved calendar event */ }
    }
    const message = error?.code === "23505"
      ? "Someone just booked that time. Please choose another available slot."
      : "We could not confirm the booking. Please try again.";
    redirect(`/book-client-call?error=${encodeURIComponent(message)}`);
  }

  let leadId = lead.id as string;
  let jobId: string | null = null;
  try {
    const clientId = await currentClientId();
    const merged = await mergeBookingIntoRecentClientLead({
      admin,
      bookingLeadId: leadId,
      email: parsed.data.email,
      company: parsed.data.company,
      service: parsed.data.service,
      hours: parsed.data.hours,
      budget: parsed.data.budget,
      timezone: parsed.data.timezone,
      startTime: parsed.data.start_time,
      clientId,
    });
    if (merged) {
      leadId = merged.leadId;
      jobId = merged.jobId;
    } else {
      jobId = await createPendingJobForLead({
        admin,
        leadId,
        clientId,
        title: parsed.data.service,
        service: parsed.data.service,
        company: parsed.data.company,
        hours: parsed.data.hours,
        timezone: parsed.data.timezone,
        startTime: parsed.data.start_time,
        message: parsed.data.message,
        budget: parsed.data.budget,
      });
    }
  } catch (jobError) {
    console.error("[booking] Could not create or merge pending job draft", {
      leadId,
      error: jobError instanceof Error ? jobError.message : String(jobError),
    });
  }

  await admin.from("analytics_events").insert({
    event_name: "booking_completed",
    path: "/book-client-call",
    metadata: { lead_id: leadId, job_id: jobId, service: parsed.data.service, audience: "client" },
  });

  const clientLabel = formatDiscoverySlot(parsed.data.scheduled_at, parsed.data.timezone);
  const manilaLabel = formatDiscoverySlot(parsed.data.scheduled_at);
  try {
    await sendPublicDiscoveryBookingEmail({
      leadId,
      to: parsed.data.email,
      clientName: parsed.data.name,
      company: parsed.data.company,
      companyUrl: parsed.data.company_url || null,
      phone: parsed.data.phone || null,
      service: parsed.data.service,
      hours: parsed.data.hours,
      budget: parsed.data.budget,
      startTime: parsed.data.start_time,
      message: parsed.data.message,
      scheduledAt: parsed.data.scheduled_at,
      clientLabel,
      manilaLabel,
      clientTimeZone: parsed.data.timezone,
      meetingUrl: meeting?.joinUrl || null,
      calendarEventId: meeting?.eventId || null,
      manageUrl: bookingManageUrl(manage.token),
    });
  } catch {
    // The database booking remains the source of truth if delivery is unavailable.
  }

  try {
    await sendInternalDiscoveryBookingNotificationEmail({
      leadId,
      clientName: parsed.data.name,
      clientEmail: parsed.data.email,
      company: parsed.data.company,
      service: parsed.data.service,
      hours: parsed.data.hours,
      budget: parsed.data.budget,
      startTime: parsed.data.start_time,
      message: parsed.data.message,
      clientLabel,
      manilaLabel,
      meetingUrl: meeting?.joinUrl || null,
      manageUrl: bookingManageUrl(manage.token),
    });
  } catch {
    // Never lose a confirmed client booking because an internal alert failed.
  }

  if (meetingError) {
    try {
      await sendDiscoveryMeetingSetupFailureEmail({
        clientName: parsed.data.name,
        clientEmail: parsed.data.email,
        company: parsed.data.company,
        scheduledLabel: clientLabel,
        error: meetingError,
      });
    } catch {
      // Do not lose the booking because an internal alert failed.
    }
  }

  redirect(`/book-client-call?booked=1&when=${encodeURIComponent(parsed.data.scheduled_at)}&tz=${encodeURIComponent(parsed.data.timezone)}`);
}
