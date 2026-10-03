import { redirect } from "next/navigation";
import { canonicalRecruiterHref } from "@/lib/recruiter-routes";

export default async function RecruiterLegacyLeadBoardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }

  const suffix = query.toString();
  const legacyHref = `/workspace/recruiter/leads/board${suffix ? `?${suffix}` : ""}`;
  redirect(
    canonicalRecruiterHref(legacyHref, "/workspace/recruiter/crm?mode=board") ||
      "/workspace/recruiter/crm?mode=board",
  );
}
