import { redirect } from "next/navigation";

export const metadata = {
  title: "Training Dashboard | VAPH",
  robots: { index: false, follow: false },
};

export default function TrainingDashboardAliasPage() {
  redirect("/workspace/training");
}
