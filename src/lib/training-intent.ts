export function safeTrainingCourseSlug(value: string | null | undefined) {
  const slug = String(value || "").trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120 ? slug : null;
}

export function trainingCourseDestination(value?: string | null) {
  const slug = safeTrainingCourseSlug(value);
  return slug ? `/workspace/training/courses/${slug}` : "/workspace/training";
}

export function trainingJoinHref(value?: string | null) {
  const slug = safeTrainingCourseSlug(value);
  return slug ? `/auth/join/training?course=${encodeURIComponent(slug)}` : "/auth/join/training";
}

export function trainingLoginHref(value?: string | null) {
  return `/auth/login?next=${encodeURIComponent(trainingCourseDestination(value))}`;
}
