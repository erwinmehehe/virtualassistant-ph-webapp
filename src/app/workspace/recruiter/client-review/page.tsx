import { redirect } from "next/navigation";

export default function RecruiterClientReviewPage() {
  redirect("/workspace/recruiter/roles?view=client_review&sort=urgent");
}
