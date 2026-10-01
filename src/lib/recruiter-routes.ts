const BASE_URL = "https://virtualassistant.com.ph";

export function canonicalRecruiterHref(value: string | null | undefined, fallback: string | null = null) {
  const raw = String(value || "").trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;

  const url = new URL(raw, BASE_URL);
  const originalPath = url.pathname;

  if (originalPath === "/workspace/recruiter/leads/board") {
    url.pathname = "/workspace/recruiter/crm";
    url.searchParams.set("mode", "board");
    if (url.searchParams.get("scope") === "mine") url.searchParams.set("view", "mine");
    url.searchParams.delete("scope");
  } else if (originalPath === "/workspace/recruiter/leads") {
    url.pathname = "/workspace/recruiter/crm";
    const view = url.searchParams.get("view");
    if (!view || view === "open" || view === "recent") url.searchParams.set("view", "active");
  } else if (originalPath === "/workspace/recruiter/queue") {
    url.pathname = "/workspace/recruiter/talent";
    url.searchParams.set("stage", "recruiter_review");
    if (!url.searchParams.has("sort")) url.searchParams.set("sort", "completion");
  } else if (originalPath === "/workspace/recruiter/activity") {
    url.pathname = "/workspace/recruiter/today";
  } else if (originalPath === "/workspace/recruiter/funnel") {
    url.pathname = "/workspace/recruiter/performance";
    url.searchParams.set("tab", "funnel");
  } else if (originalPath === "/workspace/recruiter/analytics") {
    url.pathname = "/workspace/recruiter/performance";
    url.searchParams.set("tab", "analytics");
  } else if (originalPath === "/workspace/recruiter/client-review") {
    url.pathname = "/workspace/recruiter/roles";
    url.searchParams.set("view", "client_review");
  } else if (originalPath === "/workspace/recruiter/placements") {
    url.pathname = "/workspace/client-success";
  } else if (originalPath.startsWith("/workspace/recruiter/placements/")) {
    url.pathname = originalPath.replace("/workspace/recruiter/placements/", "/workspace/client-success/");
  } else if (originalPath === "/workspace/recruiter/matching") {
    url.pathname = "/workspace/recruiter/roles";
  } else if (originalPath.startsWith("/workspace/recruiter/matching/")) {
    url.pathname = originalPath.replace("/workspace/recruiter/matching/", "/workspace/recruiter/roles/");
  } else if (originalPath.startsWith("/workspace/admin/jobs/")) {
    url.pathname = originalPath.replace("/workspace/admin/jobs/", "/workspace/recruiter/roles/");
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
