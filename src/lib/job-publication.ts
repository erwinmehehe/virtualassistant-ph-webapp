export type PublicationBlocker =
  | "published"
  | "needs_client_account"
  | "needs_role_review"
  | "needs_role_details"
  | "needs_terms"
  | "waiting_client_approval"
  | "ready_to_publish";

type PublicationJob = {
  status?: string | null;
  client_id?: string | null;
  title?: string | null;
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

export function publicationMissingDetails(job: PublicationJob): string[] {
  const missing = publicationMissingDetails(job);
  return missing;
}

export function publicationBlocker(job: PublicationJob, commercial?: PublicationCommercial): {
  key: PublicationBlocker;
  label: string;
  detail: string;
} {
  if (job.status === "published") {
    return { key: "published", label: "Published", detail: "This role is live on the public jobs page." };
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

  const missing: string[] = [];
  if (!job.title || String(job.title).trim().length < 3) missing.push("title");
  if (!job.summary || String(job.summary).trim().length < 20) missing.push("summary");
  if (!Array.isArray(job.responsibilities) || job.responsibilities.length === 0) missing.push("responsibilities");
  if (!Array.isArray(job.required_skills) || job.required_skills.length < 2) missing.push("skills");
  if (!job.hours_per_week) missing.push("hours");
  if (!job.timezone) missing.push("timezone");
  if (job.min_hourly_rate == null) missing.push("budget");
  if (!job.start_timing) missing.push("start timing");

  if (missing.length) {
    return {
      key: "needs_role_details",
      label: "Needs role details",
      detail: `Complete: ${missing.join(", ")}.`,
    };
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
