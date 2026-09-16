import { redirect } from "next/navigation";

export default function LegacyVaSetupPage() {
  redirect("/workspace/va/profile#work-readiness");
}
