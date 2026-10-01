import { redirect } from "next/navigation";

export default async function RecruiterLeadBoardRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const view = params.scope === "mine" ? "mine" : "active";
  redirect(`/workspace/recruiter/crm?view=${view}&mode=board`);
}
