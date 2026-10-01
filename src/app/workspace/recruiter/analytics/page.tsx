import { redirect } from "next/navigation";

export default async function RecruiterAnalyticsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "analytics" });
  if (params.days) query.set("days", params.days);
  if (params.scope) query.set("scope", params.scope);
  redirect(`/workspace/recruiter/performance?${query.toString()}`);
}
