import { SiteNav } from "@/components/site-nav";

export function TrainingSiteHeader({
  courseSlug,
  current = "landing",
}: {
  courseSlug?: string | null;
  current?: "landing" | "join";
}) {
  return (
    <SiteNav
      mode="training"
      trainingCourseSlug={courseSlug}
      trainingCurrent={current}
    />
  );
}
