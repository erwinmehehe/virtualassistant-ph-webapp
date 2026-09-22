import { redirect } from "next/navigation";

const LEGACY_VIEW_MAP: Record<string,string> = {
  needs_candidates: "needs_candidates",
  assigned: "active",
  waiting_client: "waiting_client",
  applications: "active",
  filled: "history",
  closed: "history",
  all: "active",
};

export default async function RecruiterMatchingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string,string|undefined>>;
}) {
  const query = await searchParams;
  const view = LEGACY_VIEW_MAP[String(query.view || "needs_candidates")] || "needs_candidates";
  const sort = query.sort === "recent" ? "recent" : "urgent";
  redirect(`/workspace/recruiter/roles?view=${view}&sort=${sort}`);
}
