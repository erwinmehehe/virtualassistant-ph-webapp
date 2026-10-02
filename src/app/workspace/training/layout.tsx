import { requireTrainingAccessFast } from "@/lib/auth";
import { TrainingShell } from "@/components/training-shell";
import { getTrainingShellData } from "@/lib/training-shell-data";
import "./training-home.css";

export const metadata = {
  title: "Training | VirtualAssistant.com.ph",
  robots: { index: false, follow: false },
};

export default async function TrainingLayout({ children }: { children: React.ReactNode }) {
  const { userId, profile } = await requireTrainingAccessFast();
  const shellData = await getTrainingShellData(userId);
  return (
    <TrainingShell
      profile={profile}
      learnerName={shellData.authName}
      notifications={shellData.notifications}
      unreadCount={shellData.unreadCount}
    >
      {children}
    </TrainingShell>
  );
}
