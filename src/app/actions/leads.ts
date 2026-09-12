"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { VA_CATEGORIES, MIN_HOURLY_RATE } from "@/lib/constants";
import { servicePageBySlug } from "@/lib/service-pages";
import { INDUSTRIES } from "@/lib/industries";
import { inferCategories, inferHours } from "@/lib/category-inference";
import { sendLeadAcknowledgementEmail, sendLeadNotificationEmail } from "@/lib/email";
import { cleanJobSummary, cleanJobDescription } from "@/lib/job-content-cleanup";

export type ServiceMatchState = {
  status: "idle" | "success" | "error";
  message?: string;
  leadId?: string;
  jobId?: string;
  clientLinked?: boolean;
};

const DUPLICATE_SUBMISSION_WINDOW_MINUTES = 5;

/**
 * Finds a lead already submitted by this same email, for the same
 * service/category, in the last few minutes -- catches double-clicks and
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
  phone: z.string().trim().max(50).optional(),
  hours: z.string().trim().min(1).max(80),
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

  const service = servicePageBySlug(parsed.data.slug);
  if (!service || service.directoryCategory !== parsed.data.category) {
    return { status: "error", message: "We could not verify this service request. Please refresh the page and try again." };
  }

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
      service: service.name,
      hours: parsed.data.hours,
      message: parsed.data.message,
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
      hours: parsed.data.hours,
      message: parsed.data.message
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
        message: parsed.data.message,
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
        service: service.name
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
  phone: z.string().trim().max(50).optional(),
  hours: z.string().trim().min(1).max(80),
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

  const industry = INDUSTRIES.find((item) => item.slug === parsed.data.slug);
  if (!industry) return { status: "error", message: "We could not verify this industry request. Please refresh the page and try again." };

  const primaryService = industry.serviceSlugs.map((slug) => servicePageBySlug(slug)).find(Boolean);
  const selectedTasks = parsed.data.tasks.filter((task) => industry.workflows.includes(task));
  const combinedMessage = [selectedTasks.length ? `Requested workflows: ${selectedTasks.join(", ")}.` : "", parsed.data.message].filter(Boolean).join("\n\n");
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
      service: serviceLabel,
      hours: parsed.data.hours,
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
      hours: parsed.data.hours,
      message: combinedMessage
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
        service: `${industry.label} Virtual Assistant support`
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
  message: "What should this Virtual Assistant own (at least 15 characters -- the actual tasks, not just budget)"
};

export async function submitRoleBriefAction(formData: FormData) {
  const raw = Object.fromEntries(formData);
  // Return the visitor to the page they submitted from. Validated the same way
  // as source_path, so it can only ever be a path on this site.
  const rawReturn = String(formData.get("source_path") || "").trim();
  const returnTo = rawReturn.startsWith("/") && !rawReturn.startsWith("//") ? rawReturn : "/hire";
  const parsed = roleBriefSchema.safeParse(raw);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = String(firstIssue?.path?.[0] ?? "");
    const label = roleBriefFieldLabels[field];
    const message = label ? `Please fill in: ${label}` : "Please complete the required role details";
    redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
  }
  if (parsed.data.website) redirect(`${returnTo}?sent=1`);

  const category = VA_CATEGORIES.includes(parsed.data.category as (typeof VA_CATEGORIES)[number]) ? parsed.data.category : parsed.data.category.trim();
  const candidateContext = parsed.data.talent ? `Requested talent profile: ${parsed.data.talent}.` : "";
  const budgetContext = `Virtual Assistant budget: ${parsed.data.budget}.`;
  const message = [candidateContext, budgetContext, parsed.data.message?.trim()].filter(Boolean).join("\n\n") || null;
  const admin = createAdminClient();
  const sourcePath = parsed.data.source_path || "/hire";
  const base = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const sourcePage = parsed.data.talent
    ? "talent_introduction_request"
    : sourcePath === "/hire/" || sourcePath === "/hire"
      ? "public_role_brief"
      : "content_role_brief";
  const pageUrl = `${base}${sourcePath}`;

  const duplicate = await findRecentDuplicateLead(admin, parsed.data.email, category);
  if (duplicate) redirect(`${returnTo}?sent=1`);

  const { data: lead, error } = await admin.from("lead_intake").insert({
    name: parsed.data.name?.trim() || null,
    email: parsed.data.email,
    phone: parsed.data.phone?.trim() || null,
    service: category,
    company: parsed.data.company?.trim() || null,
    hours: parsed.data.hours,
    start_time: parsed.data.start_time?.trim() || null,
    timezone: parsed.data.timezone,
    message,
    source_page: sourcePage,
    page_url: pageUrl,
    session_id: parsed.data.session_id || null
  }).select("id").single();
  if (error || !lead?.id) redirect(`${returnTo}?error=${encodeURIComponent("We could not save your request. Please try again.")}`);

  const requestedVaId = await resolveRequestedVaId(admin, parsed.data.talent);
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
    metadata: { service: category, source_page: sourcePage }
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
      service: jobTitleForCategory(category)
    });
  } catch {
    // Lead storage is the source of truth; acknowledgement email is best effort.
  }

  if (clientId) redirect(`/workspace/client/jobs/${jobId}?created_from_brief=1`);
  const talent = parsed.data.talent ? `&talent=${encodeURIComponent(parsed.data.talent)}` : "";
  redirect(`${returnTo}?sent=1&lead=${encodeURIComponent(lead.id)}${talent}`);
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
