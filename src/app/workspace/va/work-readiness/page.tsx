import { redirect } from "next/navigation";
import { requireRoleFast } from "@/lib/auth";

export default async function LegacyVAWorkReadinessPage() {
  await requireRoleFast("va");
  redirect("/workspace/va/profile");
}
