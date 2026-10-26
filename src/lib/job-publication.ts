const MIN_HOURLY_RATE = 6;

export type PublicationBlocker =
  | "published"
  | "needs_client_account"
  | "needs_role_review"
  | "brief_incomplete"
  | "needs_terms"
  | "waiting_client_approval"
  | "ready_to_publish";

export type PublicationJob = {
  status?: string | null;
  moderation_status?: string | null;
  client_id?: string | null;
  recruiter_managed_public?: boolean | null;
  title?: string | null;
  company_name?: string | null;
  summary?: string | null;
  responsibilities?: unknown;
  required_skills?: unknown;
  hours_per_week?: number | null;
  timezone?: string | null;
  min_hourly_rate?: number | string | null;
  start_timing?: string | null;
};

type PublicationCommercial = {
  commercial_status?: string | null;
} | null | undefined;

const INVALID_PUBLIC_COMPANY_NAMES = new Set(["n/a", "na", "none", "test", "private employer", "confidential client"]);

export function isPublishableCompanyName(value: unknown): boolean {
  const normalized = String(value ?? "").trim().toLowerCase();
  // A contact address or URL is not a public employer name.
  return normalized.length >= 2
    && !INVALID_PUBLIC_COMPANY_NAMES.has(normalized)
    && !/@|https?:\/\/|www\./i.test(normalized)
    && !/^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(normalized);
}

export function publicationMissingDetails(job: PublicationJob): string[] {
  const missing: string[] = [];
  if (!job.title || String(job.title).trim().length < 3) missing.push("title");
  if (!isPublishableCompanyName(job.company_name)) missing.push("company name");
  if (!job.summary || String(job.summary).trim().length < 20) missing.push("summary");
  if (!Array.isArray(job.responsibilities) || job.responsibilities.length === 0) missing.push("responsibilities");
  // Public hiring forms do not consistently ask for explicit skills,
  // timezone, preferred start, or a fixed weekly hour count. Those can be
  // refined during recruiter discovery and matching.
  if (job.min_hourly_rate == null || Number(job.min_hourly_rate) < MIN_HOURLY_RATE) missing.push("budget");
  return missing;
}

/** Anonymous match requests remain private unless the sender explicitly opts in to
 * a PUBLIC listing and supplies enough independently usable role details.
 * This does not grant candidate access or bypass content moderation. */
export function canAutoPublishLeadJob({
  optedIn, clientId, requestedVaId, title, companyName, publicBrief,
  hoursPerWeek, budget, minHourlyRate,
}: {
  optedIn: boolean;
  clientId?: string | null;
  requestedVaId?: string | null;
  title?: string | null;
  companyName?: string | null;
  publicBrief?: string | null;
  hoursPerWeek?: number | null;
  budget?: string | null;
  minHourlyRate?: number | null;
}): boolean {
  const description = String(publicBrief || "").trim();
  const statedBudget = String(budget || "").trim();
  // The intake form specifies USD hourly ranges. Never turn a PHP monthly
  // budget, a bare number, or an unknown unit into a public USD/hour claim.
  const hourlyRate = statedBudget.match(/^USD\s+(\d+(?:\.\d+)?)(?:\s*(?:to|-)\s*(\d+(?:\.\d+)?)|\s*\+)?\s*\/\s*(?:hour|hr)$/i);
  const low = hourlyRate ? Number(hourlyRate[1]) : Number.NaN;
  const high = hourlyRate?.[2] ? Number(hourlyRate[2]) : null;

  // Never infer consent, a real wage, or an actual opening from a generic
  // match enquiry. Do not expose personally selected talent requests.
  if (!optedIn || clientId || requestedVaId || description.length < 80) return false;
  if (!hoursPerWeek || hoursPerWeek <= 0 || !Number.isFinite(low)) return false;
  if (low < MIN_HOURLY_RATE || (high !== null && high < low)) return false;
  if (minHourlyRate == null || Number(minHourlyRate) !== low) return false;
  if (/requested\s+talent\s+profile:|client-selected\s+shortlist:/i.test(description)) return false;
  return publicationMissingDetails({
    title,
    company_name: companyName,
    summary: description,
    responsibilities: [description],
    min_hourly_rate: minHourlyRate,
  }).length === 0;
}

/** A completed employer job publishes immediately after email verification.
 * Company-approval toggles, rollout flags and service model do not gate public
 * visibility. Commercial acceptance and candidate access remain separate.
 */
export function clientCanSelfPublishJob({
  emailVerified,
}: {
  emailVerified: boolean;
  serviceModel?: string;
  legacyApproved?: boolean;
  verifiedClientRollout?: boolean;
}): boolean {
  return emailVerified;
}

/** Shared, testable state decision. A staff hold always wins over auto-publishing. */
export function resolveClientJobSubmitStatus({
  submitMode,
  canSelfPublish,
  needsModeration,
  previousStatus = null,
  staffHold = false,
}: {
  submitMode: string;
  canSelfPublish: boolean;
  needsModeration: boolean;
  previousStatus?: string | null;
  staffHold?: boolean;
}): "draft" | "pending" | "published" {
  if (submitMode === "draft") return "draft";
  if (staffHold || needsModeration) return "pending";
  if (previousStatus === "published" || canSelfPublish) return "published";
  return "pending";
}

/** Low-noise signals for public job content. A match requires private review. */
export function publicJobReviewSignals(parts: Array<string | string[] | null | undefined>) {
  const text = parts.flatMap((part) => Array.isArray(part) ? part : [part])
    .map((part) => String(part || "")).join(" ");
  const signals: string[] = [];
  if (/https?:\/\/|\bwww\.[a-z0-9-]+\./i.test(text)) signals.push("external_link");
  if (/\b(?:earn money fast|guaranteed income|limited time offer|click here to apply)\b/i.test(text))
    signals.push("promotional_language");
  return signals;
}

export function publicationBlocker(job: PublicationJob, commercial?: PublicationCommercial): {
  key: PublicationBlocker;
  label: string;
  detail: string;
} {
  if (job.moderation_status && job.moderation_status !== "clear") {
    return {
      key: "needs_role_review",
      label: "Content review needed",
      detail: "This role is held from public search while staff reviews its content.",
    };
  }

  if (job.status === "published" && job.recruiter_managed_public && !job.client_id) {
    const missing = publicationMissingDetails(job);
    if (missing.length) {
      return {
        key: "brief_incomplete",
        label: "Brief incomplete",
        detail: `This published recruiter-managed role is missing required public content: ${missing.join(", ")}.`,
      };
    }
    return {
      key: "published",
      label: "Published",
      detail: "This recruiter-managed role is live while the client account is being linked.",
    };
  }

  if (!job.client_id) {
    return {
      key: "needs_client_account",
      label: "Needs client account",
      detail: "The client must claim or link this hiring request before commercial terms can be accepted.",
    };
  }

  if (job.status === "draft") {
    return {
      key: "needs_role_review",
      label: "Needs role review",
      detail: "The role is still a draft and must be resubmitted for recruiter review.",
    };
  }

  const missing = publicationMissingDetails(job);
  if (missing.length) {
    return {
      key: "brief_incomplete",
      label: "Brief incomplete",
      detail: job.status === "published"
        ? `This published role is missing required public content: ${missing.join(", ")}.`
        : `Missing required public content: ${missing.join(", ")}.`,
    };
  }

  if (job.status === "published") {
    // Public visibility and permission to release identified candidates are
    // separate. A live job can still need the client's terms acceptance.
    if (!commercial?.commercial_status) {
      return { key: "needs_terms", label: "Published · terms needed",
        detail: "The job is live. Prepare service terms before candidates can be sent to the client." };
    }
    if (commercial.commercial_status === "quoted") {
      return { key: "waiting_client_approval", label: "Published · client approval needed",
        detail: "The job is live. The client must accept the service terms before candidates can be sent." };
    }
    if (commercial.commercial_status === "accepted") {
      return { key: "published", label: "Published", detail: "This role is live on the public jobs page." };
    }
    return { key: "needs_terms", label: "Published · terms to review",
      detail: "The job is live, but commercial terms need attention before client shortlist release." };
  }

  if (!commercial?.commercial_status) {
    return {
      key: "needs_terms",
      label: "Needs terms",
      detail: "The recruiter must prepare the placement terms for client approval.",
    };
  }

  if (commercial.commercial_status === "quoted") {
    return {
      key: "waiting_client_approval",
      label: "Waiting client approval",
      detail: "The client must accept the quoted commercial terms before publication.",
    };
  }

  if (commercial.commercial_status === "accepted") {
    return {
      key: "ready_to_publish",
      label: "Ready to publish",
      detail: "Terms are accepted. Publication should complete automatically.",
    };
  }

  return {
    key: "needs_terms",
    label: "Needs terms",
    detail: "Review the commercial terms before this role can publish.",
  };
}
