import { redirect } from "next/navigation";

export default function LegacyRecruiterBenchPage() {
  redirect("/workspace/recruiter/talent?view=bench&sort=recent");
}
