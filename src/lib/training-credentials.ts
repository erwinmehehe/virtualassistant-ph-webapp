import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type TrainingCredential = {
  id: string;
  credentialCode: string;
  issuedAt: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  courseSummary: string | null;
  category: string;
  estimatedMinutes: number;
};

type CredentialRow = {
  id: string;
  credential_code: string;
  issued_at: string;
  revoked_at: string | null;
  course_id: string;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  estimated_minutes: number;
  status: string;
};

export async function getTrainingCredentialsForUsers(userIds: string[]) {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  const byUser = new Map<string, TrainingCredential[]>();
  for (const userId of uniqueUserIds) byUser.set(userId, []);
  if (!uniqueUserIds.length) return byUser;

  const admin = createAdminClient();
  const { data: certificateData, error: certificateError } = await admin
    .from("training_certificates")
    .select("id,user_id,credential_code,issued_at,revoked_at,course_id")
    .in("user_id", uniqueUserIds)
    .is("revoked_at", null)
    .order("issued_at", { ascending: false });

  if (certificateError || !(certificateData || []).length) return byUser;

  const certificateRows = (certificateData || []) as Array<CredentialRow & { user_id: string }>;
  const courseIds = [...new Set(certificateRows.map((certificate) => certificate.course_id))];
  const { data: courseData, error: courseError } = await admin
    .from("training_courses")
    .select("id,slug,title,summary,category,estimated_minutes,status")
    .in("id", courseIds)
    .eq("status", "published");

  if (courseError) return byUser;

  const courses = new Map(((courseData || []) as CourseRow[]).map((course) => [course.id, course]));
  for (const certificate of certificateRows) {
    const course = courses.get(certificate.course_id);
    if (!course) continue;
    const credential: TrainingCredential = {
      id: certificate.id,
      credentialCode: certificate.credential_code,
      issuedAt: certificate.issued_at,
      courseId: course.id,
      courseSlug: course.slug,
      courseTitle: course.title,
      courseSummary: course.summary,
      category: course.category,
      estimatedMinutes: course.estimated_minutes,
    };
    byUser.set(certificate.user_id, [...(byUser.get(certificate.user_id) || []), credential]);
  }

  return byUser;
}

export async function getTrainingCredentialsForUser(userId: string) {
  const byUser = await getTrainingCredentialsForUsers([userId]);
  return byUser.get(userId) || [];
}


export type PublicTrainingCredential = {
  credentialCode: string;
  issuedAt: string;
  courseTitle: string;
  courseSlug: string;
  courseSummary: string | null;
  estimatedMinutes: number;
};

export async function getPublicTrainingCredentialByCode(rawCode: string): Promise<PublicTrainingCredential | null> {
  const credentialCode = rawCode.trim().toUpperCase();
  if (!/^VAT-[A-Z0-9-]{8,64}$/.test(credentialCode)) return null;

  const admin = createAdminClient();
  const { data: certificate, error: certificateError } = await admin
    .from("training_certificates")
    .select("credential_code,issued_at,course_id,revoked_at")
    .eq("credential_code", credentialCode)
    .is("revoked_at", null)
    .maybeSingle();

  if (certificateError || !certificate) return null;

  const { data: course, error: courseError } = await admin
    .from("training_courses")
    .select("title,slug,summary,estimated_minutes,status")
    .eq("id", certificate.course_id)
    .eq("status", "published")
    .maybeSingle();

  if (courseError || !course) return null;

  return {
    credentialCode: certificate.credential_code,
    issuedAt: certificate.issued_at,
    courseTitle: course.title,
    courseSlug: course.slug,
    courseSummary: course.summary,
    estimatedMinutes: course.estimated_minutes,
  };
}
