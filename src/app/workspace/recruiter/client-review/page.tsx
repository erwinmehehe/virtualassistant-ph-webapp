import { redirect } from "next/navigation";

export default function LegacyRecruiterClientReviewPage() {
  redirect("/workspace/recruiter/matching?view=waiting_client");
}
