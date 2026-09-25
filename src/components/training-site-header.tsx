import { SiteNav } from "@/components/site-nav";

export function TrainingSiteHeader({
  courseSlug,
  current = "landing",
}: {
  courseSlug?: string | null;
  current?: "landing" | "join" | "login";
}) {
  return (
    <SiteNav
      mode="training"
      trainingCourseSlug={courseSlug}
      trainingCurrent={current}
    />
  );
}
