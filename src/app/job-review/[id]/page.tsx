import { notFound, redirect } from "next/navigation";
import { requireAuthenticatedUserFast } from "@/lib/auth";
import { jobReviewDestination, jobReviewLink } from "@/lib/job-review-link";

export const metadata = { robots: { index: false, follow: false } };

export default async function StaffJobReviewLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const path = jobReviewLink(id);
  if (!path) notFound();

  // A neutral path outside /workspace/admin or /workspace/recruiter also
  // survives sign-in: the login action otherwise rejects cross-role workspace URLs.
  const { profile } = await requireAuthenticatedUserFast(path);
  const destination = jobReviewDestination(profile?.role, id);
  if (!destination) notFound();
  // The destination page enforces its own role permissions and job visibility.
  redirect(destination);
}
