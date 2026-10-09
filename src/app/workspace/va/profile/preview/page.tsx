import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { mergeUniqueStrings, uniqueStrings } from "@/lib/collections";
import { getTrainingCredentialsForUser } from "@/lib/training-credentials";
import { VaPortfolioPreview } from "@/components/va-portfolio-preview";
import { ReloadPageButton } from "@/components/reload-page-button";
import Link from "next/link";

/**
 * Signed-in VA portfolio preview. This route stays private under the
 * existing authenticated VA workspace layout. Public /va/[slug] routing
 * remains disabled and public consent is not changed by viewing this page.
 */
export default async function VaPreviewPage() {
  const { user, profile } = await requireRole("va");
  const supabase = await createClient();
  const { data: va, error } = await supabase
    .from("va_profiles")
    .select("headline,bio,primary_category,categories,skills,tools,industries,languages,years_experience,weekly_hours,schedule,overlap_hours,portfolio_url")
    .eq("user_id", user.id)
    .single();

  if (error || !va) {
    return (
      <section className="card stack" role="alert">
        <h1>Portfolio preview is temporarily unavailable</h1>
        <p>We couldn't read your saved profile. Your details have not been changed.</p>
        <div className="row wrap">
          <ReloadPageButton label="Reload preview" />
          <Link className="btn" href="/workspace/va/profile">Back to profile</Link>
        </div>
      </section>
    );
  }

  const categories = mergeUniqueStrings(va.primary_category, va.categories);
  const skills = uniqueStrings(va.skills);
  const tools = uniqueStrings(va.tools);
  const industries = uniqueStrings(va.industries);
  const languages = uniqueStrings(va.languages);
  let trainingCredentials: Awaited<ReturnType<typeof getTrainingCredentialsForUser>> = [];
  try {
    trainingCredentials = await getTrainingCredentialsForUser(user.id);
  } catch {
    // The professional portfolio remains usable during a training service issue.
  }

  return (
    <VaPortfolioPreview
      name={profile.full_name || "Virtual Assistant"}
      avatarUrl={profile.avatar_url}
      headline={va.headline}
      bio={va.bio}
      categories={categories}
      skills={skills}
      tools={tools}
      industries={industries}
      languages={languages}
      yearsExperience={va.years_experience}
      weeklyHours={va.weekly_hours}
      schedule={va.schedule}
      overlapHours={va.overlap_hours}
      portfolioUrl={va.portfolio_url}
      trainingCredentials={trainingCredentials}
      audience="self"
      backHref="/workspace/va/profile"
    />
  );
}
