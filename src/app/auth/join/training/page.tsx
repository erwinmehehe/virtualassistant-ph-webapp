import type { Metadata } from "next";
import { TrainingSiteHeader } from "@/components/training-site-header";
import { TrainingJoinForm } from "@/components/training-join-form";
import { getPublicTrainingOverview } from "@/lib/public-training";
import { safeTrainingCourseSlug } from "@/lib/training-intent";

export const metadata: Metadata = {
  title: "Create a Free Training Account",
  description: "Create a free training account to save lesson progress and earn verified VirtualAssistant.com.ph course certificates.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Create a Free Training Account | VirtualAssistant.com.ph",
    description: "Save your free VA training progress and earn verified completion certificates.",
  },
  twitter: {
    card: "summary",
    title: "Create a Free Training Account | VirtualAssistant.com.ph",
    description: "Save your free VA training progress and earn verified completion certificates.",
  },
};

export default async function TrainingJoinPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const params = await searchParams;
  const requestedSlug = safeTrainingCourseSlug(params.course);
  let course: { slug: string; title: string } | null = null;

  if (requestedSlug) {
    const { courses } = await getPublicTrainingOverview();
    const match = courses.find(
      (item) => item.slug === requestedSlug && item.status === "published",
    );
    if (match) course = { slug: match.slug, title: match.title };
  }

  return (
    <>
      <TrainingSiteHeader courseSlug={course?.slug} current="join"/>
      <main id="main-content" className="auth-page training-auth-page">
        <TrainingJoinForm course={course}/>
      </main>
    </>
  );
}
