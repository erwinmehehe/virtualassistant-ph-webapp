import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AttachedHomepage } from "@/components/attached-homepage";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PUBLIC_VA_MIN_EXPERIENCE } from "@/lib/public-routing";
import { canonicalPath } from "@/lib/seo-url";

export const metadata: Metadata = {
  title: { absolute: "Hire Virtual Assistants | Virtual Assistant Philippines" },
  description: "Virtual Assistant Philippines — hire vetted, screened Filipino Virtual Assistants matched to your role. Browse approved talent or request a private shortlist today.",
  keywords: ["virtual assistant philippines", "hire filipino virtual assistant", "filipino virtual assistant", "virtual assistant services philippines", "outsource to the philippines"],
  alternates: { canonical: canonicalPath("/") }
};

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: featured }, { data: openJobs }] = await Promise.all([
    supabase
      .from("public_va_directory")
      .select("user_id,slug,full_name,avatar_url,headline,bio,primary_category,categories,skills,weekly_hours,years_experience,hourly_rate")
      .gte("years_experience", PUBLIC_VA_MIN_EXPERIENCE)
      .not("avatar_url", "is", null)
      .limit(6),
    supabase
      .from("jobs")
      .select("id,slug,title,company_name,categories,required_skills,hours_per_week,min_hourly_rate,max_hourly_rate,published_at")
      .eq("status", "published")
      .not("client_id", "is", null)
      .order("published_at", { ascending: false })
      .limit(4)
  ]);

  let placementFee = 0;
  let managedMarkup = 0;
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data } = await admin.from("admin_settings").select("default_placement_fee,default_managed_markup_percent").eq("id", 1).maybeSingle();
      placementFee = Number(data?.default_placement_fee || 0);
      managedMarkup = Number(data?.default_managed_markup_percent || 0);
    } catch {
      // The homepage remains usable if pricing settings cannot be loaded.
    }
  }

  const approvedTalent = (featured ?? []).filter((va: any) => typeof va.avatar_url === "string" && va.avatar_url.trim());
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://virtualassistant.com.ph").replace(/\/$/, "");
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "VirtualAssistant.com.ph",
      url: base,
      logo: `${base}/icon.svg`,
      description: "Hire vetted virtual assistants from the Philippines. Screened talent, private role briefs, and a clearer hiring process."
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "VirtualAssistant.com.ph",
      url: base,
      publisher: { "@id": `${base}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${base}/find-talent?q={search_term_string}` },
        "query-input": "required name=search_term_string"
      }
    }
  ];

  return <>
    <SiteHeader />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(schema) }} />
    <AttachedHomepage featured={approvedTalent} openJobs={openJobs ?? []} placementFee={placementFee} managedMarkup={managedMarkup}/>
    <SiteFooter />
  </>;
}
