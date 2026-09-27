import { redirect } from "next/navigation";
import { requireRoleFast } from "@/lib/auth";

export default async function LegacyRecruiterWorkReadinessPage() {
  await requireRoleFast("recruiter");
  redirect("/workspace/recruiter/talent");
}
