import { redirect } from "next/navigation";

const VIEW_MAP: Record<string, string> = {
  open: "active",
  recent: "active",
  attention: "attention",
  discovery: "discovery",
  qualified: "qualified",
  nurture: "nurture",
  won: "won",
  lost: "lost",
  all: "all",
};

export default async function RecruiterLeadsRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const mappedView = VIEW_MAP[String(params.view || "open")] || "active";
  query.set("view", mappedView);
  if (params.q) query.set("q", params.q);
  if (params.owner) query.set("owner", params.owner);
  redirect(`/workspace/recruiter/crm?${query.toString()}`);
}
