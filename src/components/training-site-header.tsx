import { SiteNav } from "@/components/site-nav";

export function TrainingSiteHeader({
  courseSlug,
  current = "landing",
}: {
  courseSlug?: string | null;
  current?: "landing" | "join" | "login";
}) {
  if (current === "landing" && !courseSlug) {
    return <SiteNav actionContext="training" />;
  }

  return (
    <SiteNav
      mode="training"
      trainingCourseSlug={courseSlug}
      trainingCurrent={current}
    />
  );
}
