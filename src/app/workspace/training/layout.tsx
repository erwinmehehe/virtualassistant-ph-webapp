import { requireAnyRoleFast } from "@/lib/auth";
import { TrainingShell } from "@/components/training-shell";
import "./training-home.css";

export const metadata = {
  title: "Training | VirtualAssistant.com.ph",
  robots: { index: false, follow: false },
};

export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAnyRoleFast(["va", "admin"]);
  return <TrainingShell profile={profile}>{children}</TrainingShell>;
}
