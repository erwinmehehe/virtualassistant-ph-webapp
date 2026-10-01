import { redirect } from "next/navigation";

export default async function RecruiterFunnelRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "funnel" });
  if (params.days) query.set("days", params.days);
  redirect(`/workspace/recruiter/performance?${query.toString()}`);
}
