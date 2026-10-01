import { redirect } from "next/navigation";

export default function RecruiterQueueRedirect() {
  redirect("/workspace/recruiter/talent?stage=recruiter_review&sort=completion");
}
