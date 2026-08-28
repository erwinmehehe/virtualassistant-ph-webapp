import { redirect } from "next/navigation";

export default async function LegacyTalentProfilePage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  redirect(`/va/${encodeURIComponent(slug)}`);
}
