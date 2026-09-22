import { redirect } from "next/navigation";

export default async function LegacyRecruiterMatchingDetail({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  // Preserve workflow flags such as client_invited, shortlist_saved, and shortlist_released.
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) out.set(key, value);
  }
  const suffix = out.toString() ? `?${out.toString()}` : "";
  redirect(`/workspace/recruiter/roles/${id}${suffix}`);
}
