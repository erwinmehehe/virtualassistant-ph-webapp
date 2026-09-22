import { redirect } from "next/navigation";

export default function LegacyRecruiterStalledPage() {
  redirect("/workspace/recruiter/roles?view=intervention&sort=urgent");
}
