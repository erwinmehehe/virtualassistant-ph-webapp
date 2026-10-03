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
  return normalized.length >= 2 && !INVALID_PUBLIC_COMPANY_NAMES.has(normalized);
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

export function publicationBlocker(job: PublicationJob, commercial?: PublicationCommercial): {
  key: PublicationBlocker;
  label: string;
  detail: string;
} {
  if (job.status === "published" && job.recruiter_managed_public) {
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
    return { key: "published", label: "Published", detail: "This role is live on the public jobs page." };
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
