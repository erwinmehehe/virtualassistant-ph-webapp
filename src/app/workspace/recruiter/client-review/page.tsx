import { redirect } from "next/navigation";

export default function LegacyRecruiterClientReviewPage() {
  redirect("/workspace/recruiter/roles?view=waiting_client&sort=urgent");
}
