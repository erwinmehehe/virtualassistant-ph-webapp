import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/public-routing";

export default async function LegacyTalentProfilePage({ params }: { params: Promise<{slug:string}> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const query = supabase.from("public_va_directory").select("user_id,slug");
  const { data: va } = isUuid(slug)
    ? await query.eq("user_id", slug).maybeSingle()
    : await query.eq("slug", slug).maybeSingle();

  if (!va?.slug) notFound();
  redirect(`/va/${encodeURIComponent(va.slug)}`);
}
