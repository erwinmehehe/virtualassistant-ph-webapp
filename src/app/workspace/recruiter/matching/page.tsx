import { redirect } from "next/navigation";

export default function RecruiterMatchingPage() {
  redirect("/workspace/recruiter/roles?view=needs_candidates&sort=urgent");
}
