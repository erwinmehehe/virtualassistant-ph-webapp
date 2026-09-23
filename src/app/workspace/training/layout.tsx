import { requireAuthenticatedUserFast } from "@/lib/auth";
import { TrainingShell } from "@/components/training-shell";

export const metadata = {
  title: "Training | VirtualAssistant.com.ph",
  robots: { index: false, follow: false },
};

export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAuthenticatedUserFast("/workspace/training");
  return <TrainingShell profile={profile}>{children}</TrainingShell>;
}
